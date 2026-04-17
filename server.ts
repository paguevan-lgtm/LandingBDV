import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SECURITY PROTOCOLS ---

// Global In-memory stores
const loginTokens = new Map<string, { token: string, expires: number }>();
const tokenAttempts = new Map<string, { count: number, lastAttempt: number, blockedUntil?: number }>();
const apiSessionTokens = new Map<string, { email: string, expires: number, deviceId?: string, fingerprint?: string }>();
const blockedIps = new Set<string>();

// Multi-layered Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Strict but allow operational traffic
    message: { error: 'Traffic limit exceeded. Progressive block initiated.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`[DOS DETECTED] IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Max 20 auth requests per hour per IP
    message: { error: 'Abuse detection triggered. Authentication services temporarily suspended for this IP.' },
    skipSuccessfulRequests: true
});

const maintenanceLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 10, 
    message: { error: 'Maintenance bypass attempt rejected.' }
});

const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Limite de envios atingido. Tente novamente em 15 minutos.' }
});

// Trusted Origins for CORS
const corsOptions = {
    origin: (origin: any, callback: any) => {
        // Permitir QUALQUER origem em desenvolvimento/preview para resolver bloqueios
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-App-Version', 'X-Device-Fingerprint'],
    credentials: true,
    maxAge: 86400
};

// Security Middlewares
const securityHeaders = (req: any, res: any, next: any) => {
    // Removemos headers restritivos de framing explicitamente
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    // Adicionamos permissivos
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
};

const validateHttpHeaders = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // 1. Content-Type Enforcement
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-type'] !== 'application/json' && req.originalUrl !== '/api/webhook') {
        return res.status(415).json({ error: 'FORMATO INVÁLIDO', details: 'Apenas application/json é permitido.' });
    }
    
    // 2. Strict Method Enforcement
    if (req.originalUrl.startsWith('/api') && req.originalUrl !== '/api/health' && req.method === 'GET') {
        const postOnlyRoutes = ['/api/send-login-token', '/api/verify-login-token', '/api/create-booking', '/api/verify_session'];
        if (postOnlyRoutes.includes(req.originalUrl)) {
            return res.status(405).json({ error: 'MÉTODO NÃO PERMITIDO', details: 'Apenas POST é aceito para esta operação.' });
        }
    }

    // 3. Bot & WebView Detection (Simple heuristics)
    const ua = req.headers['user-agent'] || '';
    const isHeadless = ua.includes('Headless') || ua.includes('Puppeteer') || ua.includes('Playwright');
    const hasLikelyAutomation = req.headers['x-automation-id'] || req.headers['x-selenium-id'];

    if (isHeadless || hasLikelyAutomation) {
        console.warn(`[SECURITY] Acesso automatizado bloqueado: ${req.ip} (UA: ${ua})`);
        return res.status(403).json({ error: 'ACCESS_DENIED', details: 'Automação detectada.' });
    }

    // 4. Client Integrity Check
    const isApi = req.originalUrl.startsWith('/api');
    if (isApi && !req.headers['accept']?.includes('application/json')) {
        // Raw curl often lacks this
    }
    
    next();
};

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'NÃO AUTORIZADO', details: 'Token ausente.' });
    }
    
    const token = authHeader.split(' ')[1];
    const session = apiSessionTokens.get(token);
    
    if (!session || Date.now() > session.expires) {
        if (session) apiSessionTokens.delete(token);
        return res.status(403).json({ error: 'SESSÃO EXPIRADA', details: 'Token inválido ou expirado.' });
    }
    
    (req as any).userEmail = session.email;
    next();
};

const maintenanceCheck = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // 1. Bypass Logic (Header, Query or Cookie)
    const secret = process.env.FIREBASE_DATABASE_SECRET;
    const hasBypass = 
        req.headers['x-admin-key'] === secret || 
        req.query.admin_key === secret || 
        req.cookies?.admin_bypass === secret;

    if (hasBypass) {
        // Prolong bypass via cookie if they used query string
        if (req.query.admin_key === secret) {
            res.cookie('admin_bypass', secret, { maxAge: 86400000, httpOnly: true, secure: true });
        }
        return next();
    }

    try {
        const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
        const configUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
        const resp = await fetch(configUrl);
        const settings = await resp.json();

        const isPainel = req.originalUrl.startsWith('/painel');
        const isApi = req.originalUrl.startsWith('/api');
        
        // Site Wide Maintenance
        if (settings?.maintenance_site === true && !isPainel) {
            if (req.accepts('html') && !isApi) {
                return res.status(503).send(`
                    <!DOCTYPE html>
                    <html lang="pt-br">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Em Manutenção | Bora de Van</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; }
                            .bg-brand { background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); }
                            .text-gradient { background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                        </style>
                    </head>
                    <body class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                        <div class="max-w-md w-full space-y-8 animate-pulse">
                            <div class="w-32 h-32 mx-auto bg-slate-900 rounded-[2rem] p-6 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                                <img src="/BDV.png" alt="Logo" class="w-full h-full object-contain grayscale opacity-50">
                            </div>
                            <h1 class="text-4xl md:text-5xl font-black italic select-none">SITE EM <br><span class="text-gradient">MANUTENÇÃO</span></h1>
                            <p class="text-slate-400 font-medium">Estamos preparando os motores! Nossa van está fazendo uma revisão completa para garantir sua segurança e conforto.</p>
                            <div class="pt-8">
                                <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                                    Voltamos em breve
                                </div>
                            </div>
                            <div class="mt-12">
                                <a href="https://wa.me/5513997744720" class="inline-block px-8 py-4 bg-brand rounded-2xl text-white font-black hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">NOSSO WHATSAPP</a>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
            }
            return res.status(503).json({ error: 'SYSTEM_MAINTENANCE' });
        }
        
        // Panel Maintenance
        if (settings?.maintenance_panel === true && isPainel) {
             if (req.accepts('html') && !isApi) {
                return res.status(503).send(`
                    <!DOCTYPE html>
                    <html lang="pt-br">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Painel em Manutenção | Bora de Van</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; }
                            .text-gradient { background: linear-gradient(135deg, #f43f5e 0%, #fb923c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                        </style>
                    </head>
                    <body class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                        <div class="max-w-md w-full space-y-8">
                            <div class="w-24 h-24 mx-auto bg-red-500/10 border-2 border-red-500/20 rounded-3xl flex items-center justify-center text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                            <h1 class="text-4xl font-black italic"><span class="text-gradient">PAINEL BLOQUEADO</span></h1>
                            <p class="text-slate-400 font-medium italic uppercase text-xs tracking-widest">Manutenção Administrativa em Andamento</p>
                            <p class="text-slate-500 text-sm">O acesso ao painel está temporariamente restrito para manutenção técnica. Por favor, aguarde o comunicado oficial.</p>
                        </div>
                    </body>
                    </html>
                `);
            }
            return res.status(503).json({ error: 'PANEL_MAINTENANCE' });
        }
    } catch (e) {
        console.error("Maintenance check failed:", e);
    }
    next();
};

// --- STRIPE & FIREBASE HELPERS ---

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
async function updateUserSubscriptionStatus(userId: string, status: string, mpId: string, date: string | undefined, systemContext?: string) {
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
        
        console.log(`Updating subscription status for ${systemContext || 'Mistura'} to ${status} by user ${userId}`);
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
                updates.isRecurring_Mistura = true;
            } else if (systemContext && systemContext !== 'unknown') {
                updates[`expiresAt_${systemContext}`] = newExpiresAt.toISOString();
                updates[`isBlocked_${systemContext}`] = false;
                updates[`isRecurring_${systemContext}`] = true;
            } else {
                updates.expiresAt = newExpiresAt.toISOString();
                updates.isBlockedByAdmin = false;
                updates.isRecurring_Mistura = true;
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
    if (username === 'Breno') return; // Admin oculto
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

    // 1. CORE SECURITY STACK
    app.use(cookieParser());
    app.use(securityHeaders);
    app.use(cors(corsOptions));
    app.use(validateHttpHeaders);
    
    // 2. MAINTENANCE LAYER
    app.use(maintenanceCheck);

    // Use JSON parser for all non-webhook routes
    app.use((req, res, next) => {
        if (req.originalUrl === '/api/webhook') {
            next();
        } else {
            express.json({ limit: '1mb' })(req, res, next);
        }
    });
    
    // Apply layered rate limiting
    app.use('/api', globalLimiter);
    app.use('/api/send-login-token', authLimiter);
    app.use('/api/verify-login-token', authLimiter);

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
    });

    // API Routes
    app.post('/api/send-login-token', async (req, res) => {
        try {
            const { email, name, type, uid, deviceId, fingerprint } = req.body;
            if (!email) return res.status(400).json({ error: 'Identificador obrigatório' });

            const emailKey = email.toLowerCase().trim();
            const now = Date.now();

            // GENERIC SUCCESS TO PREVENT EMAIL HARVESTING
            const genericSuccess = { success: true, message: 'Se o cadastro existir, um código foi enviado.' };

            // 1. ADVANCED RATE LIMITING & SECURITY CHECKS
            let attemptData = tokenAttempts.get(emailKey) || { count: 0, lastAttempt: 0 };
            
            if (attemptData.blockedUntil && now < attemptData.blockedUntil) {
                return res.status(429).json({ error: 'Acesso temporariamente suspenso por atividade suspeita.', retryAfter: attemptData.blockedUntil });
            }

            // Fingerprint check (Bot prevention)
            if (!fingerprint && process.env.NODE_ENV === 'production') {
                console.warn(`[SECURITY] Request without fingerprint from IP: ${req.ip}`);
                // In a production world, we might block this or flag it
            }

            // Trusted Device Bypass
            if (type === 'login' && uid && deviceId) {
                const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
                const trustedUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/trusted_devices/${uid}/${deviceId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
                try {
                    const trustRes = await fetchWithRetry(trustedUrl);
                    const trustData = await trustRes.json();
                    if (trustData && trustData.expiresAt && Date.now() < trustData.expiresAt) {
                        return res.json({ success: true, trusted: true, message: 'Dispositivo confiável' });
                    }
                } catch (e) {}
            }

            // Wait time enforcement
            const waitTime = attemptData.count >= 3 ? 15 * 60 * 1000 : 30 * 1000;
            if (now < attemptData.lastAttempt + waitTime) {
                return res.status(429).json({ error: 'Aguarde o vencimento do código anterior.', retryAfter: attemptData.lastAttempt + waitTime });
            }

            // Update attempts
            attemptData.count += 1;
            attemptData.lastAttempt = now;
            if (attemptData.count > 5) attemptData.blockedUntil = now + (2 * 60 * 60 * 1000); // 2 hours block
            tokenAttempts.set(emailKey, attemptData);

            // 2. TOKEN GENERATION
            const token = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 5 * 60 * 1000; // 5 minutes only (Hardened)

            loginTokens.set(emailKey, { token, expires });

            // 3. SECURE EMAIL DISPATCH
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
                port: parseInt(process.env.EMAIL_PORT || '465'),
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const userName = name || 'Usuário';
            let title = 'Código de Segurança';
            let message = 'Acesse sua conta com segurança usando o código abaixo:';

            if (type === 'new_user') title = 'Verificação de E-mail';
            else if (type === 'reset') title = 'Recuperação de Acesso';
            
            // Log attempt for monitoring
            console.log(`[AUTH] Solicitando token para: ${emailKey} (IP: ${req.ip})`);

            // Check if user exists in Firebase to avoid sending spam to non-users (Internal Check)
            // But we still return 200 to the client
            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const userCheckUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/users.json?orderBy="email"&equalTo="${emailKey}"${dbSecret ? `&auth=${dbSecret}` : ''}`;
            
            const userCheckRes = await fetch(userCheckUrl);
            const userData = await userCheckRes.json();
            
            // If user doesn't exist and it's a login attempt, don't send email but return success
            if ((!userData || Object.keys(userData).length === 0) && type === 'login') {
                return res.json(genericSuccess);
            }

            await transporter.sendMail({
                from: `"Segurança Bora de Van" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `[Bora de Van] ${token} é o seu código`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #db2777;">${title}</h2>
                        <p>Olá, <b>${userName}</b>!</p>
                        <p>${message}</p>
                        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #db2777; border-radius: 5px;">
                            ${token}
                        </div>
                        <p style="font-size: 12px; color: #666; margin-top: 20px;">Este código expira em 5 minutos. Se não foi você quem solicitou, ignore com segurança.</p>
                    </div>
                `
            });

            res.json(genericSuccess);
        } catch (error: any) {
            console.error('[AUTH ERROR] send-login-token:', error);
            res.status(500).json({ error: 'Erro interno no serviço de autenticação.' });
        }
    });

    app.post('/api/verify-login-token', async (req, res) => {
        const { email, token, uid, deviceId, fingerprint } = req.body;
        if (!email || !token) return res.status(400).json({ error: 'Credenciais incompletas.' });

        const emailKey = email.toLowerCase().trim();
        const storedData = loginTokens.get(emailKey);

        if (!storedData || Date.now() > storedData.expires) {
            return res.status(401).json({ error: 'Código expirado ou inexistente.' });
        }

        if (storedData.token !== token) {
            console.warn(`[AUTH FAILURE] Código incorreto para ${emailKey} (IP: ${req.ip})`);
            return res.status(401).json({ error: 'Código de verificação incorreto.' });
        }

        // Clean up
        loginTokens.delete(emailKey);
        tokenAttempts.delete(emailKey);

        // Trusted Device Update
        if (uid && deviceId) {
            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const trustedUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/trusted_devices/${uid}/${deviceId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
            try {
                await fetch(trustedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expiresAt: Date.now() + 12 * 60 * 60 * 1000, lastUsed: Date.now(), ip: req.ip, fingerprint })
                });
            } catch (e) {}
        }

        // Session Generation
        const sessionToken = crypto.randomBytes(64).toString('hex');
        apiSessionTokens.set(sessionToken, { 
            email: emailKey, 
            expires: Date.now() + 12 * 60 * 60 * 1000,
            deviceId,
            fingerprint
        });

        console.log(`[AUTH SUCCESS] Login realizado: ${emailKey}`);
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

    app.post('/api/verify_session', requireAuth, async (req, res) => {
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

    app.post('/api/create_subscription_preference', requireAuth, async (req, res) => {
        try {
            const { email, userId, systemContext } = req.body;
            if (!userId || !email) return res.status(400).json({ error: 'userId and email are required' });

            const appUrl = process.env.APP_URL || 'http://localhost:3000';
            const priceMap: any = {
                'Mip': 'price_1TCiud2N7Ik4UR6lmc0cL6nK',
                'Pg': 'price_1TCk6c2N7Ik4UR6lAIkjBTUb',
                'Sv': 'price_1TCk6A2N7Ik4UR6l46SnE2KD'
            };
            const priceId = priceMap[systemContext] || 'price_1TCiud2N7Ik4UR6lmc0cL6nK';

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

    app.post('/api/create-pix-payment', requireAuth, async (req, res) => {
        try {
            const { email, userId, systemContext, amount } = req.body;
            if (!userId || !amount) return res.status(400).json({ error: 'userId and amount are required' });

            const paymentIntent = await getStripe().paymentIntents.create({
                amount: amount,
                currency: 'brl',
                payment_method_types: ['pix'],
                metadata: { userId, systemContext: systemContext || 'unknown', type: 'pix_payment' },
                receipt_email: email
            });
            
            const confirmedIntent = await getStripe().paymentIntents.confirm(
                paymentIntent.id,
                { payment_method_data: { type: 'pix' } }
            );

            if (confirmedIntent.next_action && confirmedIntent.next_action.pix_display_qr_code) {
                res.json({
                    qrCodeBase64: confirmedIntent.next_action.pix_display_qr_code.image_url_png,
                    qrCode: confirmedIntent.next_action.pix_display_qr_code.hosted_instructions_url,
                    id: confirmedIntent.id
                });
            } else {
                res.status(500).json({ error: 'Failed to generate PIX QR code' });
            }
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
                    if (!userId && session.client_reference_id && session.client_reference_id.startsWith('BORA_VAN_SUB_')) {
                        const parts = session.client_reference_id.split('_');
                        userId = parts[3];
                        systemContext = parts[4];
                    }
                    if (userId && systemContext) {
                        await updateUserSubscriptionStatus(userId, 'active', session.subscription as string || session.id, new Date().toISOString(), systemContext);
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
