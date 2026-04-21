import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stripe Configuration
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeClient) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        stripeClient = new Stripe(key, {
            apiVersion: '2023-10-16' as any,
        });
    }
    return stripeClient;
}

// In-memory token store for login
const loginTokens = new Map<string, { token: string, expires: number }>();
const tokenAttempts = new Map<string, { count: number, lastAttempt: number, blockedUntil?: number }>();

// API Session Tokens (Security Layer)
const apiSessionTokens = new Map<string, { email: string, expires: number }>();

// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT] IP bloqueado globalmente: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 form submissions per windowMs
    message: { error: 'Limite de envios atingido. Tente novamente em 15 minutos.' },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT] IP bloqueado no formulário: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Origin Validation Middleware
const validateOrigin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl === '/api/webhook') return next();
    
    const origin = req.headers.origin;
    if (!origin) {
        // Allow requests without origin only if they are not typical browser requests, 
        // but to be safe against bots, we can log it.
        console.warn(`[SECURITY] Requisição sem origin: ${req.originalUrl} (IP: ${req.ip})`);
        return next();
    }
    
    const allowedDomains = ['localhost', 'boradevan.com.br', 'ais-dev', 'ais-pre'];
    const isAllowed = allowedDomains.some(domain => origin.includes(domain));
    
    if (!isAllowed) {
        console.warn(`[SECURITY] Origem bloqueada: ${origin} (IP: ${req.ip})`);
        return res.status(403).json({ error: 'Origem não permitida' });
    }
    
    next();
};

// Auth Middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[AUTH] Tentativa de acesso sem token: ${req.originalUrl} (IP: ${req.ip})`);
        return res.status(401).json({ error: 'Não autorizado. Token ausente.' });
    }
    
    const token = authHeader.split(' ')[1];
    const session = apiSessionTokens.get(token);
    
    if (!session || Date.now() > session.expires) {
        if (session) apiSessionTokens.delete(token);
        console.warn(`[AUTH] Token inválido ou expirado: ${req.originalUrl} (IP: ${req.ip})`);
        return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
    }
    
    (req as any).userEmail = session.email;
    next();
};

// Helper function for resilient fetch
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (!response.ok && retries > 0) throw new Error(`Status ${response.status}`);
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying in ${backoff}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}

// Helper function to update system subscription status in Firebase RTDB
async function updateUserSubscriptionStatus(userId: string, status: string, mpId: string, date: string | undefined, systemContext?: string, isRecurringFromPayment: boolean = true) {
    const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
    
    // We update the global system settings, not the individual user
    let systemUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/subscription.json`;
    if (dbSecret) {
        systemUrl += `?auth=${dbSecret}`;
    }

    try {
        // Fetch current system subscription data
        const sysRes = await fetchWithRetry(systemUrl);
        const sysData = await sysRes.json() || {};
        
        if (sysData.lastPaymentId === mpId && status === 'active') {
            console.log(`Payment ${mpId} already processed, skipping update.`);
            return true;
        }
        
        console.log(`Updating subscription status for ${systemContext || 'Mistura'} to ${status} by user ${userId}. Recurring: ${isRecurringFromPayment}`);
        const updates: any = {
            lastPaymentId: mpId,
            lastPaymentDate: date || new Date().toISOString(),
            paidBy: userId,
        };

        if (status === 'active') {
            let currentExpiresAtStr;
            if (systemContext === 'Mistura') {
                currentExpiresAtStr = sysData?.expiresAt;
            } else if (systemContext && systemContext !== 'unknown') {
                currentExpiresAtStr = sysData?.[`expiresAt_${systemContext}`];
            } else {
                currentExpiresAtStr = sysData?.expiresAt;
            }

            let newExpiresAt = new Date();
            if (currentExpiresAtStr) {
                const currentExpiresAt = new Date(currentExpiresAtStr);
                if (currentExpiresAt > newExpiresAt) {
                    // If currently active, add 30 days to the existing expiration date
                    newExpiresAt = currentExpiresAt;
                }
            }
            newExpiresAt.setDate(newExpiresAt.getDate() + 30);
            
            if (systemContext === 'Mistura') {
                updates.expiresAt = newExpiresAt.toISOString();
                updates.isBlockedByAdmin = false;
                updates.isRecurring_Mistura = isRecurringFromPayment;
            } else if (systemContext && systemContext !== 'unknown') {
                updates[`expiresAt_${systemContext}`] = newExpiresAt.toISOString();
                updates[`isBlocked_${systemContext}`] = false;
                updates[`isRecurring_${systemContext}`] = isRecurringFromPayment;
            } else {
                updates.expiresAt = newExpiresAt.toISOString();
                updates.isBlockedByAdmin = false;
                updates.isRecurring_Mistura = isRecurringFromPayment;
            }
        } else if (status === 'past_due' || status === 'cancelled') {
            // If subscription is cancelled or past due, we turn off auto-renewal flag
            if (systemContext === 'Mistura') {
                updates.isRecurring_Mistura = false;
            } else if (systemContext && systemContext !== 'unknown') {
                updates[`isRecurring_${systemContext}`] = false;
            } else {
                updates.isRecurring_Mistura = false;
            }
        }

        const response = await fetchWithRetry(systemUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
            console.error('Failed to update Firebase via REST. Status:', response.status, await response.text());
            return false;
        } else {
            console.log(`Updated system subscription for ${systemContext || 'Mistura'} to ${status} by user ${userId}`);
            return true;
        }
    } catch (error) {
        console.error('Error updating Firebase:', error);
        return false;
    }
}

// Helper to log actions to audit_logs
async function logAction(action: string, details: string, username: string = 'Sistema') {
    try {
        const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
        const authParam = dbSecret ? `?auth=${dbSecret}` : '';
        const logUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/audit_logs.json${authParam}`;
        
        const logEntry = {
            username,
            action,
            details,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-')
        };

        await fetchWithRetry(logUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
        });
    } catch (e) {
        console.error("Error logging action in server:", e);
    }
}

async function startServer() {
    const app = express();
    const PORT = Number(process.env.PORT) || 3000;

    // Use JSON parser for all non-webhook routes
    app.use((req, res, next) => {
        if (req.originalUrl === '/api/webhook') {
            next();
        } else {
            express.json()(req, res, next);
        }
    });
    
    app.use(cors());
    
    // Apply global security middlewares
    app.use('/api', validateOrigin);
    app.use('/api', globalLimiter);
    
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API Routes
    app.post('/api/send-login-token', async (req, res) => {
        try {
            const { email, name, type, uid, deviceId } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });

            const emailKey = email.toLowerCase();
            const now = Date.now();

            // 1. Check if device is trusted FIRST (to skip token request and rate limits)
            if (type === 'login' && uid && deviceId) {
                const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
                const trustedUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/trusted_devices/${uid}/${deviceId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
                
                try {
                    const trustRes = await fetchWithRetry(trustedUrl);
                    const trustData = await trustRes.json();
                    
                    if (trustData && trustData.expiresAt && Date.now() < trustData.expiresAt) {
                        return res.json({ success: true, trusted: true, message: 'Device trusted' });
                    }
                } catch (e) {
                    console.error("Error checking trusted device:", e);
                }
            }

            let attemptData = tokenAttempts.get(emailKey) || { count: 0, lastAttempt: 0 };

            // Check if blocked
            if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
                const remainingMinutes = Math.ceil((attemptData.blockedUntil - now) / (60 * 1000));
                return res.status(429).json({ 
                    error: `Muitas tentativas. Tente novamente em ${remainingMinutes} minutos.`,
                    blocked: true,
                    retryAfter: attemptData.blockedUntil
                });
            }

            // Check wait time between attempts (Relaxed)
            let waitTime = 0;
            if (attemptData.count === 1) waitTime = 30 * 1000; // 30s for first retry
            else if (attemptData.count === 2) waitTime = 2 * 60 * 1000; // 2 min
            else if (attemptData.count === 3) waitTime = 5 * 60 * 1000; // 5 min
            else if (attemptData.count >= 4) {
                // Block for 1 hour (instead of 2)
                attemptData.blockedUntil = now + 1 * 60 * 60 * 1000;
                tokenAttempts.set(emailKey, attemptData);
                return res.status(429).json({ 
                    error: 'Não foi possível verificar sua identidade. Tente novamente mais tarde.',
                    blocked: true,
                    retryAfter: attemptData.blockedUntil
                });
            }

            if (now < attemptData.lastAttempt + waitTime) {
                const remainingSeconds = Math.ceil((attemptData.lastAttempt + waitTime - now) / 1000);
                return res.status(429).json({ 
                    error: `Aguarde ${remainingSeconds} segundos para solicitar um novo código.`,
                    retryAfter: attemptData.lastAttempt + waitTime
                });
            }

            // Update attempts
            attemptData.count += 1;
            attemptData.lastAttempt = now;
            tokenAttempts.set(emailKey, attemptData);

            const token = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 10 * 60 * 1000;

            loginTokens.set(email.toLowerCase(), { token, expires });

            const transporter = nodemailer.createTransport({
                host: (process.env.EMAIL_HOST && !process.env.EMAIL_HOST.includes('@')) ? process.env.EMAIL_HOST : 'smtp.hostinger.com',
                port: parseInt(process.env.EMAIL_PORT || '465'),
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER || 'suporte@painel.boradevan.com.br',
                    pass: process.env.EMAIL_PASS || '15744751@Bb'
                }
            });

            const userName = name ? name : 'Usuário';
            let subject = 'Código de Acesso';
            let title = 'Código de Acesso';
            let message = 'Recebemos uma tentativa de login na sua conta. Use o código de verificação abaixo para acessar o sistema:';
            let footerMessage = 'Se você não solicitou este código, por favor ignore este email.';

            if (type === 'new_user') {
                subject = 'Bem-vindo ao Bora de Van - Validação de E-mail';
                title = 'Validação de E-mail';
                message = `Boas-vindas ao Bora de Van! Para finalizar o seu cadastro, use o código de verificação abaixo:`;
            } else if (type === 'reset') {
                subject = 'Bora de Van - Recuperação de Senha';
                title = 'Recuperação de Senha';
                message = 'Recebemos uma solicitação para alterar a senha da sua conta. Use o código de verificação abaixo:';
            } else if (type === 'password_change') {
                subject = 'Bora de Van - Alerta de Segurança';
                title = 'Alteração de Senha';
                message = 'Alguém está tentando alterar a senha da sua conta. Se foi você, use o código abaixo para confirmar a alteração. Caso contrário, ignore este e-mail e sua senha permanecerá segura.';
            }

            const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0f172a; border-radius: 32px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 48px 40px 32px 40px; text-align: center;">
              <div style="margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 32px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1px; color: #ffffff; line-height: 1;">
                  BORA DE <span style="color: #db2777;">VAN</span>
                </h2>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; opacity: 0.9;">${title}</h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 40px 48px 40px; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700;">Olá, ${userName}!</p>
              <p style="margin: 0 0 40px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">${message}</p>
              
              <!-- Token Display -->
              <div style="background-color: #020617; border: 1px solid #334155; border-radius: 24px; padding: 32px 20px; margin-bottom: 32px; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Seu código é</p>
                <div style="display: inline-block; margin: 0 auto;">
                  <span style="display: block; color: #db2777; font-size: 48px; font-weight: 900; letter-spacing: 12px; padding-left: 12px; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 20px rgba(219, 39, 119, 0.3); line-height: 1;">${token}</span>
                </div>
              </div>
              
              <!-- Expiration Warning -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: rgba(244, 63, 94, 0.1); padding: 8px 16px; border-radius: 100px; border: 1px solid rgba(244, 63, 94, 0.2);">
                    <span style="color: #f43f5e; font-size: 13px; font-weight: 700;">⏱ Expira em 10 minutos</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #475569; font-size: 13px; line-height: 1.5;">
                Se você não solicitou este acesso, pode ignorar este e-mail com segurança.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #020617; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px; line-height: 1.6;">
                Este é um e-mail automático, por favor não responda.<br>
                &copy; ${new Date().getFullYear()} Bora de Van. Todos os direitos reservados.
              </p>
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://boradevan.com.br" style="color: #94a3b8; text-decoration: none; font-size: 12px; font-weight: 600;">Site Oficial</a>
                  </td>
                  <td style="color: #334155;">&bull;</td>
                  <td style="padding: 0 8px;">
                    <a href="https://wa.me/5513997744720" style="color: #94a3b8; text-decoration: none; font-size: 12px; font-weight: 600;">Suporte WhatsApp</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Spacer -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="margin: 0; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                Enviado com ❤️ por Bora de Van
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

            await transporter.sendMail({
                from: `"Bora de Van" <${process.env.EMAIL_USER || 'suporte@painel.boradevan.com.br'}>`,
                to: email,
                subject: subject,
                html: emailHtml
            });

            res.json({ success: true, message: 'Token sent successfully' });
        } catch (error: any) {
            console.error('Error sending token:', error);
            res.status(500).json({ error: 'Failed to send token' });
        }
    });

    app.post('/api/verify-login-token', async (req, res) => {
        const { email, token, uid, deviceId } = req.body;
        if (!email || !token) return res.status(400).json({ error: 'Email and token are required' });

        const storedData = loginTokens.get(email.toLowerCase());
        if (!storedData) return res.status(400).json({ success: false, error: 'Token inválido ou expirado' });

        if (Date.now() > storedData.expires) {
            loginTokens.delete(email.toLowerCase());
            return res.status(400).json({ success: false, error: 'Token expirado' });
        }

        if (storedData.token !== token) return res.status(400).json({ success: false, error: 'Token incorreto' });

        loginTokens.delete(email.toLowerCase());
        tokenAttempts.delete(email.toLowerCase());

        if (uid && deviceId) {
            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const trustedUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/trusted_devices/${uid}/${deviceId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
            
            try {
                await fetchWithRetry(trustedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
                        lastUsed: Date.now()
                    })
                });
            } catch (e) {
                console.error("Error registering trusted device:", e);
            }
        }

        // Generate secure session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        apiSessionTokens.set(sessionToken, { 
            email: email.toLowerCase(), 
            expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ success: true, sessionToken });
    });

    async function findExistingPassenger(name: string, phone: string, address: string, authParam: string, fingerprint?: string) {
        const systems = ['Pg', 'Mip', 'Sv'];
        const normalizedName = name.toLowerCase().trim();
        const normalizedPhone = phone.replace(/\D/g, '');

        try {
            const promises = systems.map(sys => {
                let url = `https://lotacao-753a1-default-rtdb.firebaseio.com/`;
                if (sys === 'Pg') url += `passengers.json${authParam}`;
                else url += `${sys}/passengers.json${authParam}`;
                return fetchWithRetry(url).then(r => r.json().then(data => ({ system: sys, data })));
            });

            const results = await Promise.all(promises);

            for (const result of results) {
                const passengers = result.data;
                if (!passengers || typeof passengers !== 'object') continue;

                for (const key in passengers) {
                    const p = passengers[key];
                    if (!p) continue;

                    // Match by Fingerprint FIRST if available
                    if (fingerprint && p.fingerprint) {
                        // Exact match
                        if (p.fingerprint === fingerprint) {
                            return { key, id: p.id, data: p, system: result.system };
                        }

                        // Fuzzy match for composite fingerprints (v2_FPID_HWID or v3_FPID_HWID)
                        const isV2orV3 = (f: string) => f.startsWith('v2_') || f.startsWith('v3_');
                        if (isV2orV3(fingerprint) && isV2orV3(p.fingerprint)) {
                            const parts1 = fingerprint.split('_');
                            const parts2 = p.fingerprint.split('_');
                            
                            if (parts1.length === 3 && parts2.length === 3) {
                                const [, fp1, hw1] = parts1;
                                const [, fp2, hw2] = parts2;
                                
                                const hwMatch = hw1 === hw2 && hw1 !== 'canvas_err' && hw1 !== 'no_canvas' && !hw1.startsWith('hw_fallback');
                                const fpMatch = fp1 === fp2;

                                if (hwMatch || fpMatch) {
                                    return { key, id: p.id, data: p, system: result.system };
                                }
                            }
                        }
                    }

                    if (!p.name || !p.phone) continue;

                    const pName = p.name.toLowerCase().trim();
                    const pPhone = p.phone.replace(/\D/g, '');

                    // Match by Name and Phone
                    if (pName === normalizedName && pPhone === normalizedPhone) {
                        return { key, id: p.id, data: p, system: result.system };
                    }
                }
            }
        } catch (e) {
            console.error("Error searching for existing passenger:", e);
        }
        return null;
    }

    app.post('/api/create-booking', formLimiter, async (req, res) => {
        try {
            const passengerData = req.body;
            if (!passengerData || !passengerData.name || !passengerData.phone) {
                console.warn(`[VALIDATION] Falha na validação de agendamento: Dados incompletos (IP: ${req.ip})`);
                return res.status(400).json({ error: 'Name and phone are required' });
            }
            
            if (passengerData.name.length > 100 || passengerData.phone.length > 20) {
                console.warn(`[VALIDATION] Falha na validação de agendamento: Campos muito longos (IP: ${req.ip})`);
                return res.status(400).json({ error: 'Invalid data format' });
            }

            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const authParam = dbSecret ? `?auth=${dbSecret}` : '';

            // 1. Determine the system based on origin/destination
            const targetCity = passengerData.targetCity || passengerData.neighborhood; // fallback for older requests
            let systemToSave = 'Pg';
            if (targetCity === 'mongagua' || targetCity === 'itanhaem') {
                systemToSave = 'Mip';
            } else if (targetCity === 'santos' || targetCity === 'sao_vicente' || targetCity === 'cubatao' || targetCity === 'guaruja') {
                systemToSave = 'Sv';
            } else if (targetCity === 'praia_grande') {
                systemToSave = 'Pg';
            }
            passengerData.system = systemToSave;
            passengerData.ip = req.ip;
            passengerData.userAgent = req.headers['user-agent'] || '';

            // 2. Check for existing passenger (Name and Phone match OR Fingerprint) - Search across ALL systems
            const existing = await findExistingPassenger(passengerData.name, passengerData.phone, passengerData.address || '', authParam, passengerData.fingerprint);
            
            let displayId, firebaseKey;

            if (existing) {
                // Check if blocked
                if (existing.data.status === 'Bloqueado') {
                    return res.status(403).json({ 
                        error: 'Este cadastro está bloqueado para novos agendamentos. Por favor, entre em contato com o suporte.',
                        isBlocked: true 
                    });
                }

                displayId = existing.id;
                firebaseKey = existing.key;
                
                // Preserve some existing metadata
                if (existing.data.tags) passengerData.tags = existing.data.tags;
                if (existing.data.notes) passengerData.notes = existing.data.notes;
                
                console.log(`Reusing existing passenger: ${displayId} (key: ${firebaseKey}) from system: ${existing.system}`);
            } else {
                // 3. Get the last passenger ID to continue sequence
                try {
                    const allPassUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/${systemToSave === 'Pg' ? '' : systemToSave + '/'}passengers.json${authParam}`;
                    const allPassRes = await fetchWithRetry(allPassUrl);
                    const allPassData = await allPassRes.json();
                    
                    let maxSiteId = 0;
                    if (allPassData && typeof allPassData === 'object') {
                        for (const key in allPassData) {
                            const item = allPassData[key];
                            if (!item) continue;
                            
                            const keyStr = String(key);
                            const idStr = item.id ? String(item.id) : '';
                            
                            // Considera apenas passageiros que têm 'S' no ID/Chave ou source === 'Site'
                            if (keyStr.startsWith('S') || idStr.startsWith('S') || item.source === 'Site') {
                                // Extrai apenas os números do ID (ex: de "S2" extrai "2")
                                const keyMatch = keyStr.match(/S(\d+)/);
                                const idMatch = idStr.match(/S(\d+)/);
                                
                                let keyNum = keyMatch ? parseInt(keyMatch[1], 10) : 0;
                                let idNum = idMatch ? parseInt(idMatch[1], 10) : 0;
                                
                                const numericId = Math.max(isNaN(keyNum) ? 0 : keyNum, isNaN(idNum) ? 0 : idNum);
                                
                                if (numericId > maxSiteId) {
                                    maxSiteId = numericId;
                                }
                            }
                        }
                    }
                    
                    const nextId = maxSiteId + 1;
                    displayId = `S${nextId}`;
                    firebaseKey = displayId; // Usa S1, S2, etc.
                    console.log(`Generated new Site ID: ${displayId} (Max Site ID found was: ${maxSiteId})`);
                } catch (e) {
                    console.warn("Could not fetch last ID, using timestamp fallback", e);
                    displayId = `S${Date.now().toString().slice(-6)}`;
                    firebaseKey = displayId;
                }
            }

            passengerData.id = displayId;
            passengerData.source = 'Site'; // Ensure source is always Site
            passengerData.isSiteBooking = true;

            // 5. Save to Firebase
            let url = `https://lotacao-753a1-default-rtdb.firebaseio.com/`;
            if (systemToSave === 'Pg') {
                url += `passengers/${firebaseKey}.json${authParam}`;
            } else {
                url += `${systemToSave}/passengers/${firebaseKey}.json${authParam}`;
            }

            const response = await fetchWithRetry(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passengerData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to create booking in Firebase. Status:', response.status, errorText);
                return res.status(500).json({ error: 'Failed to create booking' });
            }

            // Log the action
            await logAction('Auto-Agendamento Site', `Passageiro ${passengerData.name} (#${displayId}) se agendou via site para ${passengerData.date} às ${passengerData.time}`);

            // 5. Push notification for real-time alerts in the panel
            try {
                const notificationUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/site_notifications.json${authParam}`;
                const notificationData = {
                    id: Date.now().toString(),
                    type: 'new_booking',
                    system: systemToSave,
                    passengerName: passengerData.name,
                    date: passengerData.date,
                    timestamp: Date.now(),
                    read: false
                };

                await fetchWithRetry(notificationUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notificationData)
                });
            } catch (notifError) {
                console.error('Failed to push notification:', notifError);
                // Don't fail the request if notification fails
            }

            res.json({ success: true, id: displayId, system: systemToSave });
        } catch (error: any) {
            console.error('Error creating booking:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/update-booking-phone', formLimiter, async (req, res) => {
        try {
            const { id, system, phone } = req.body;
            if (!id || !system || !phone) {
                return res.status(400).json({ error: 'ID, system and phone are required' });
            }

            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const authParam = dbSecret ? `?auth=${dbSecret}` : '';
            const firebaseKey = id.replace(' #', '_');
            
            let url = `https://lotacao-753a1-default-rtdb.firebaseio.com/`;
            if (system === 'Pg') {
                url += `passengers/${firebaseKey}.json${authParam}`;
            } else {
                url += `${system}/passengers/${firebaseKey}.json${authParam}`;
            }

            const response = await fetchWithRetry(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update phone in Firebase. Status:', response.status, errorText);
                return res.status(500).json({ error: 'Failed to update phone' });
            }

            await logAction('Update Telefone Site', `Telefone do passageiro #${id} atualizado para ${phone} via site`);
            res.json({ success: true });
        } catch (error: any) {
            console.error('Error updating phone:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/verify_session', async (req, res) => {
        try {
            const { session_id } = req.body;
            if (!session_id) return res.status(400).json({ error: 'session_id required' });

            const session = await getStripe().checkout.sessions.retrieve(session_id);
            if (session.payment_status === 'paid') {
                let userId = session.metadata?.userId;
                let systemContext = session.metadata?.systemContext;
                
                if (!userId && session.client_reference_id && session.client_reference_id.startsWith('BORA_VAN_SUB_')) {
                    const parts = session.client_reference_id.split('_');
                    userId = parts[3];
                    systemContext = parts[4];
                }
                
                if (userId && systemContext) {
                    const updateSuccess = await updateUserSubscriptionStatus(
                        userId, 
                        'active', 
                        session.subscription as string || session.id, 
                        new Date().toISOString(), 
                        systemContext
                    );
                    
                    if (updateSuccess) {
                        const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
                        let systemUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/subscription.json`;
                        if (dbSecret) systemUrl += `?auth=${dbSecret}`;
                        const sysRes = await fetchWithRetry(systemUrl);
                        const sysData = await sysRes.json() || {};
                        let expiresAt = sysData.expiresAt;
                        if (systemContext && systemContext !== 'Mistura') {
                            expiresAt = sysData[`expiresAt_${systemContext}`];
                        }
                        return res.json({ success: true, status: 'paid', expiresAt });
                    } else {
                        return res.json({ 
                            success: true, 
                            status: 'paid', 
                            needsFrontendUpdate: true,
                            userId,
                            systemContext,
                            mpId: session.subscription as string || session.id,
                            date: new Date().toISOString()
                        });
                    }
                }
            }
            res.json({ success: false, status: session.payment_status });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/create_subscription_preference', async (req, res) => {
        try {
            const { email, userId, systemContext } = req.body;
            if (!userId || !email) return res.status(400).json({ error: 'userId and email are required' });

            const appUrl = process.env.APP_URL || 'http://localhost:3000';
            const priceMap: any = {
                'Mip': 'price_1TOUDi2N7Ik4UR6linH20Duh',
                'Pg': 'price_1TOUAv2N7Ik4UR6lkRIvD9VR',
                'Sv': 'price_1TOUEq2N7Ik4UR6lnPlsuAQ6'
            };
            const priceId = priceMap[systemContext] || 'price_1TOUAv2N7Ik4UR6lkRIvD9VR';

            const session = await getStripe().checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                success_url: `${appUrl}/painel?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/painel`,
                customer_email: email,
                client_reference_id: `BORA_VAN_SUB_${userId}_${systemContext || 'unknown'}`,
                metadata: { userId, systemContext: systemContext || 'unknown' },
                subscription_data: { metadata: { userId, systemContext: systemContext || 'unknown' } }
            });

            res.json({ id: session.id, url: session.url });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/create-pix-payment', async (req, res) => {
        try {
            const { email, userId, systemContext } = req.body;
            if (!userId || !email) return res.status(400).json({ error: 'userId and email are required' });

            const appUrl = process.env.APP_URL || 'http://localhost:3000';
            
            // User provided price for one-time payment
            const priceId = 'price_1TOUer2N7Ik4UR6lPOQL8XRQ';

            const session = await getStripe().checkout.sessions.create({
                payment_method_types: ['pix', 'card'],
                line_items: [{ price: priceId, quantity: 1 }],
                mode: 'payment',
                success_url: `${appUrl}/painel?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/painel`,
                customer_email: email,
                client_reference_id: `BORA_VAN_PIX_${userId}_${systemContext || 'unknown'}`,
                metadata: { userId, systemContext: systemContext || 'unknown', type: 'pix_payment' }
            });

            res.json({ id: session.id, url: session.url });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
        let event;
        try {
            event = JSON.parse(req.body.toString());
        } catch (err: any) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    if (paymentIntent.metadata?.type === 'pix_payment') {
                        const userId = paymentIntent.metadata.userId;
                        const systemContext = paymentIntent.metadata.systemContext;
                        if (userId && systemContext) {
                            await updateUserSubscriptionStatus(userId, 'active', paymentIntent.id, new Date().toISOString(), systemContext);
                        }
                    }
                    break;
                }
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    let userId = session.metadata?.userId;
                    let systemContext = session.metadata?.systemContext;
                    let isRecurring = session.mode === 'subscription';

                    if (!userId && session.client_reference_id) {
                        if (session.client_reference_id.startsWith('BORA_VAN_SUB_')) {
                            const parts = session.client_reference_id.split('_');
                            userId = parts[3];
                            systemContext = parts[4];
                            isRecurring = true;
                        } else if (session.client_reference_id.startsWith('BORA_VAN_PIX_')) {
                            const parts = session.client_reference_id.split('_');
                            userId = parts[3];
                            systemContext = parts[4];
                            isRecurring = false;
                        }
                    }
                    
                    if (userId && systemContext) {
                        await updateUserSubscriptionStatus(userId, 'active', session.subscription as string || session.id, new Date().toISOString(), systemContext, isRecurring);
                    }
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object;
                    const userId = subscription.metadata.userId;
                    const systemContext = subscription.metadata.systemContext;
                    if (userId && systemContext) {
                        await updateUserSubscriptionStatus(userId, 'cancelled', subscription.id, new Date().toISOString(), systemContext);
                    }
                    break;
                }
            }
            res.send();
        } catch (error) {
            res.status(500).send('Webhook processing error');
        }
    });

    // Vite Middleware (Development)
    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const hmrConfig = false; // Always disable HMR in this environment to avoid port conflicts

        // Root App Vite
        const viteRoot = await createViteServer({
            server: { 
                middlewareMode: true,
                hmr: false 
            },
            appType: 'spa',
            root: process.cwd()
        });

        // Painel App Vite
        const vitePainel = await createViteServer({
            server: { 
                middlewareMode: true,
                hmr: false
            },
            appType: 'spa',
            root: path.resolve(__dirname, 'painel'),
            base: '/painel/'
        });

        app.use('/painel', vitePainel.middlewares);
        app.use(viteRoot.middlewares);
    } else {
        // Production Static Serving
        // Painel
        app.use('/painel', express.static(path.resolve(__dirname, 'painel/dist')));
        app.get('/painel/*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'painel/dist/index.html'));
        });

        // Root
        app.use(express.static(path.resolve(__dirname, 'dist')));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
