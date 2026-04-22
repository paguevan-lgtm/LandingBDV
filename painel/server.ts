import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
            console.log('If you get 401 Unauthorized, add FIREBASE_DATABASE_SECRET to your environment variables.');
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

// --- Cron Job: Prancheta Auto-Riscar ---
const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

let lastPranchetaAutoRun = '';

async function checkPranchetaAutoRiscar() {
    try {
        const now = new Date();
        // Check time in Brazil (America/Sao_Paulo)
        const brTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
        const brDate = new Date(brTimeStr);
        
        const day = brDate.getDay(); // 5 = Friday
        const hours = brDate.getHours();
        const minutes = brDate.getMinutes();
        const todayStr = brDate.toISOString().split('T')[0];

        // Trigger at 19:55 on Fridays
        if (day === 5 && hours === 19 && minutes === 55 && lastPranchetaAutoRun !== todayStr) {
            console.log(`[Cron] Triggered Prancheta Auto-Riscar at ${brTimeStr}`);
            lastPranchetaAutoRun = todayStr;

            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const baseUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/`;
            const authParam = dbSecret ? `?auth=${dbSecret}` : '';

            // 1. Get current week ID
            const weekNum = getWeekNumber(brDate);
            const weekId = `${brDate.getFullYear()}-W${weekNum}`;

            // 2. Fetch drivers_table_list for PG
            const driversUrl = `${baseUrl}drivers_table_list.json${authParam}`;
            const driversRes = await fetchWithRetry(driversUrl);
            const driversList = await driversRes.json();

            if (!Array.isArray(driversList)) {
                console.error("[Cron] drivers_table_list is not an array or not found");
                return;
            }

            // 3. Fetch prancheta data for the week
            const pranchetaUrl = `${baseUrl}prancheta/${weekId}.json${authParam}`;
            const pranchetaRes = await fetchWithRetry(pranchetaUrl);
            const pranchetaData = await pranchetaRes.json() || {};

            // 4. Update drivers who haven't paid
            let updatedCount = 0;
            const newList = driversList.map((driver: any) => {
                if (driver && driver.vaga) {
                    const payment = pranchetaData[driver.vaga];
                    if (!payment || !payment.paid) {
                        if (!driver.riscado) {
                            updatedCount++;
                            return { ...driver, riscado: true };
                        }
                    }
                }
                return driver;
            });

            if (updatedCount > 0) {
                // 5. Save updated list
                await fetchWithRetry(driversUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newList)
                });

                // 6. Log action to audit_logs
                const logUrl = `${baseUrl}audit_logs.json${authParam}`;
                const logEntry = {
                    username: 'Sistema (Auto)',
                    action: 'Auto-Riscar Prancheta',
                    details: `Sexta-feira 19:55 - ${updatedCount} vagas não pagas foram riscadas para a semana ${weekId}`,
                    timestamp: Date.now(),
                    date: todayStr
                };
                await fetchWithRetry(logUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logEntry)
                });

                console.log(`[Cron] Prancheta Auto-Riscar completed: ${updatedCount} drivers riscados for ${weekId}`);
            } else {
                console.log(`[Cron] No drivers needed to be riscados for ${weekId}`);
            }
        }
    } catch (error) {
        console.error("[Cron] Error in checkPranchetaAutoRiscar:", error);
    }
}

// Run check every 30 seconds
setInterval(checkPranchetaAutoRiscar, 30000);

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
    
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API Routes
    app.post('/api/send-login-token', async (req, res) => {
        try {
            const { email, name, type, uid, deviceId } = req.body;
            if (!email) return res.status(400).json({ error: 'Email is required' });

            // Check if device is trusted for this user (only for login type)
            if (type === 'login' && uid && deviceId) {
                const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
                const trustedUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/trusted_devices/${uid}/${deviceId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
                
                try {
                    const trustRes = await fetchWithRetry(trustedUrl);
                    const trustData = await trustRes.json();
                    
                    if (trustData && trustData.expiresAt && Date.now() < trustData.expiresAt) {
                        console.log(`Device ${deviceId} is trusted for user ${uid}. Skipping token.`);
                        return res.json({ success: true, trusted: true, message: 'Device trusted' });
                    }
                } catch (e) {
                    console.error("Error checking trusted device:", e);
                }
            }

            // Generate a 6-digit random token
            const token = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

            loginTokens.set(email.toLowerCase(), { token, expires });

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'SMTP.HOSTINGER.COM',
                port: parseInt(process.env.EMAIL_PORT || '465'),
                secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_SECURE === 'ssl' || true,
                auth: {
                    user: process.env.EMAIL_USER || 'suporte@painel.boradevan.com.br',
                    pass: process.env.EMAIL_PASS || '15744751@Bb'
                }
            });

            const userName = name ? name : 'Usuário';
            
            let subject = 'Código de Acesso';
            let title = 'Código de Acesso';
            let message = 'Recebemos uma tentativa de login na sua conta. Use o código de verificação abaixo para acessar o sistema:';
            let footerMessage = 'Se você não solicitou este código, por favor ignore este email ou contate o suporte se achar que sua conta está em risco.';

            if (type === 'new_user') {
                subject = 'Bem-vindo ao Bora de Van - Validação de E-mail';
                title = 'Validação de E-mail';
                message = `Boas-vindas ao Bora de Van! Estamos muito felizes em ter você conosco. Para finalizar o seu cadastro, use o código de verificação abaixo:`;
                footerMessage = 'Se você não solicitou este cadastro, por favor ignore este email.';
            } else if (type === 'reset') {
                subject = 'Bora de Van - Recuperação de Senha';
                title = 'Recuperação de Senha';
                message = 'Recebemos uma solicitação para alterar a senha da sua conta. Use o código de verificação abaixo para prosseguir com a mudança de senha:';
                footerMessage = 'Se você não solicitou a mudança de senha, por favor desconsidere este email. Sua senha permanecerá a mesma e sua conta está segura.';
            }

            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #1e293b;">
              <h1 style="margin: 0; color: #f59e0b; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-style: italic;">Bora de Van</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px; font-weight: 600;">Olá, ${userName}!</h2>
              <p style="margin: 0 0 30px 0; color: #94a3b8; font-size: 16px; line-height: 1.5;">
                ${message}
              </p>
              
              <!-- Botão/Área de Código Fácil de Copiar -->
              <div style="margin: 0 auto 30px auto; max-width: 300px;">
                <div style="background-color: #f59e0b; border-radius: 12px; padding: 20px; text-align: center; cursor: text;">
                  <span style="margin: 0; color: #0f172a; font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace; display: block;">${token}</span>
                </div>
              </div>

              <p style="margin: 0; color: #ef4444; font-size: 14px; font-weight: 500;">
                Este código expira em 10 minutos.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #020617; border-top: 1px solid #1e293b;">
              <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                ${footerMessage}
              </p>
              <p style="margin: 10px 0 0 0; color: #475569; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Bora de Van. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `;

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
        if (!storedData) {
            return res.status(400).json({ success: false, error: 'Token inválido ou expirado' });
        }

        if (Date.now() > storedData.expires) {
            loginTokens.delete(email.toLowerCase());
            return res.status(400).json({ success: false, error: 'Token expirado' });
        }

        if (storedData.token !== token) {
            return res.status(400).json({ success: false, error: 'Token incorreto' });
        }

        // Token is valid
        loginTokens.delete(email.toLowerCase());

        // Register device as trusted for 12 hours
        if (uid && deviceId) {
            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const trustedUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/trusted_devices/${uid}/${deviceId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
            
            try {
                await fetchWithRetry(trustedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
                        lastUsed: Date.now()
                    })
                });
                console.log(`Device ${deviceId} registered as trusted for user ${uid}`);
            } catch (e) {
                console.error("Error registering trusted device:", e);
            }
        }

        res.json({ success: true });
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
                    // Try to update via server
                    const updateSuccess = await updateUserSubscriptionStatus(
                        userId, 
                        'active', 
                        session.subscription as string || session.id, 
                        new Date().toISOString(), 
                        systemContext
                    );
                    
                    if (updateSuccess) {
                        // Fetch the updated expiration date to send back
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
                } else {
                    return res.status(400).json({ success: false, error: 'Metadados inválidos na sessão do Stripe.' });
                }
            }
            res.json({ success: false, status: session.payment_status, error: 'Pagamento ainda não consta como pago no Stripe.' });
        } catch (error: any) {
            console.error('Error verifying session:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/create_subscription_preference', async (req, res) => {
        try {
            const { email, userId, systemContext } = req.body;
            
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }
            if (!email) {
                return res.status(400).json({ error: 'email is required' });
            }

            // Save the subscription email to Firebase
            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            let systemUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/subscription.json`;
            if (dbSecret) {
                systemUrl += `?auth=${dbSecret}`;
            }

            try {
                const updates: any = {};
                if (systemContext && systemContext !== 'unknown' && systemContext !== 'Mistura') {
                    updates[`subscription_email_${systemContext}`] = email;
                } else {
                    updates.subscription_email = email;
                }

                await fetchWithRetry(systemUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
            } catch (e) {
                console.error("Error saving subscription email", e);
            }

            const appUrl = process.env.APP_URL || 'http://localhost:3000';

            // Create Stripe Checkout Session
            const priceMap: any = {
                'Mip': 'price_1TOUDi2N7Ik4UR6linH20Duh',
                'Pg': 'price_1TOUAv2N7Ik4UR6lkRIvD9VR',
                'Sv': 'price_1TOUEq2N7Ik4UR6lnPlsuAQ6'
            };
            
            const priceId = priceMap[systemContext] || 'price_1TOUAv2N7Ik4UR6lkRIvD9VR'; // Default to PG if not found

            const session = await getStripe().checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}`,
                customer_email: email,
                client_reference_id: `BORA_VAN_SUB_${userId}_${systemContext || 'unknown'}`,
                metadata: {
                    userId: userId,
                    systemContext: systemContext || 'unknown'
                },
                subscription_data: {
                    metadata: {
                        userId: userId,
                        systemContext: systemContext || 'unknown'
                    }
                }
            });

            res.json({
                id: session.id,
                url: session.url
            });
        } catch (error: any) {
            console.error('Error creating Stripe Checkout Session:', error);
            res.status(500).json({ 
                error: error.message || 'Erro interno ao criar preferência de assinatura'
            });
        }
    });

    app.post('/api/cancel-subscription', async (req, res) => {
        try {
            const { systemContext, userId } = req.body;
            if (!systemContext || !userId) {
                return res.status(400).json({ error: 'System context and userId are required' });
            }

            // Check if user is admin
            const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
            const userUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/users/${userId}.json${dbSecret ? `?auth=${dbSecret}` : ''}`;
            const userRes = await fetchWithRetry(userUrl);
            const userData = await userRes.json();
            
            if (!userData || userData.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized: Admin access required' });
            }

            // Fetch current system subscription data to get the subscription ID
            let systemUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/subscription.json`;
            if (dbSecret) {
                systemUrl += `?auth=${dbSecret}`;
            }

            const sysRes = await fetchWithRetry(systemUrl);
            const sysData = await sysRes.json() || {};
            
            // Try to find the subscription ID for the specific system
            const subscriptionId = systemContext === 'Mistura' ? sysData.lastPaymentId : (sysData[`lastPaymentId_${systemContext}`] || sysData.lastPaymentId);

            if (!subscriptionId) {
                return res.status(404).json({ error: 'Subscription ID not found' });
            }

            // Cancel on Stripe
            try {
                await getStripe().subscriptions.cancel(subscriptionId);
            } catch (stripeError: any) {
                console.warn(`Stripe cancellation failed for ${subscriptionId}: ${stripeError.message}. Proceeding to update Firebase.`);
                // If the error is that the subscription is already cancelled or not found, we can proceed.
                if (stripeError.type !== 'StripeInvalidRequestError' && 
                    !stripeError.message.includes('already canceled') && 
                    !stripeError.message.includes('No such subscription')) {
                    throw stripeError;
                }
            }

            // Update Firebase
            await updateUserSubscriptionStatus(
                userId,
                'cancelled',
                subscriptionId,
                new Date().toISOString(),
                systemContext
            );

            res.json({ success: true });
        } catch (error: any) {
            console.error('Error cancelling subscription:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/create-pix-payment', async (req, res) => {
        try {
            const { email, userId, systemContext } = req.body;
            if (!userId || !email) return res.status(400).json({ error: 'userId and email are required' });

            // Create Stripe PaymentIntent for PIX
            const paymentIntent = await getStripe().paymentIntents.create({
                amount: 30000, // 300.00 BRL
                currency: 'brl',
                payment_method_types: ['pix'],
                metadata: {
                    userId,
                    systemContext: systemContext || 'unknown',
                    type: 'pix_payment'
                },
                receipt_email: email
            });
            
            // Confirm the PaymentIntent to get PIX instructions (QR code)
            const confirmedIntent = await getStripe().paymentIntents.confirm(
                paymentIntent.id,
                { 
                    payment_method_data: { 
                        type: 'pix',
                        billing_details: { email }
                    } 
                }
            );

            if (confirmedIntent.next_action && confirmedIntent.next_action.pix_display_qr_code) {
                res.json({
                    qrCodeBase64: confirmedIntent.next_action.pix_display_qr_code.image_url_png,
                    qrCode: confirmedIntent.next_action.pix_display_qr_code.data, // Literal copy-paste code
                    id: confirmedIntent.id,
                    expires_at: confirmedIntent.next_action.pix_display_qr_code.expires_at
                });
            } else {
                res.status(400).json({ 
                    error: 'PIX não está habilitado ou disponível para esta conta Stripe. Verifique se o método PIX está ativo no seu Dashboard do Stripe.' 
                });
            }
        } catch (error: any) {
            console.error('PIX Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Stripe Webhook
    app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
        const sig = req.headers['stripe-signature'];
        // In a real app, you should verify the webhook signature using endpoint secret
        // const endpointSecret = "whsec_...";
        
        let event;

        try {
            // For now, we just parse the body without signature verification since we don't have the webhook secret
            event = JSON.parse(req.body.toString());
        } catch (err: any) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        try {
            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    if (paymentIntent.metadata?.type === 'pix_payment') {
                        const userId = paymentIntent.metadata.userId;
                        const systemContext = paymentIntent.metadata.systemContext;
                        
                        if (userId && systemContext) {
                            await updateUserSubscriptionStatus(
                                userId, 
                                'active', 
                                paymentIntent.id, 
                                new Date().toISOString(), 
                                systemContext
                            );
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
                        await updateUserSubscriptionStatus(
                            userId, 
                            'active', 
                            session.subscription as string || session.id, 
                            new Date().toISOString(), 
                            systemContext
                        );
                    }
                    break;
                }
                case 'invoice.payment_succeeded': {
                    const invoice = event.data.object;
                    // Ignore the first payment because checkout.session.completed handles it
                    if (invoice.billing_reason === 'subscription_create') {
                        break;
                    }
                    if (invoice.subscription) {
                        const subscription = await getStripe().subscriptions.retrieve(invoice.subscription as string);
                        const userId = subscription.metadata.userId;
                        const systemContext = subscription.metadata.systemContext;
                        
                        if (userId && systemContext) {
                            await updateUserSubscriptionStatus(
                                userId, 
                                'active', 
                                invoice.id, 
                                new Date().toISOString(), 
                                systemContext
                            );
                        }
                    }
                    break;
                }
                case 'customer.subscription.deleted': {
                    const subscription = event.data.object;
                    const userId = subscription.metadata.userId;
                    const systemContext = subscription.metadata.systemContext;
                    
                    if (userId && systemContext) {
                        await updateUserSubscriptionStatus(
                            userId, 
                            'cancelled', 
                            subscription.id, 
                            new Date().toISOString(), 
                            systemContext
                        );
                    }
                    break;
                }
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            
            res.send();
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).send('Webhook processing error');
        }
    });

    app.post('/api/sync-subscription', async (req, res) => {
        try {
            const { userId, systemContext } = req.body;
            if (!userId || !systemContext) {
                return res.status(400).json({ error: 'userId and systemContext are required' });
            }

            // Search for active subscriptions for this user and system
            const subscriptions = await getStripe().subscriptions.search({
                query: `status:'active' AND metadata['userId']:'${userId}' AND metadata['systemContext']:'${systemContext}'`,
                limit: 1
            });

            if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                
                // Update Firebase
                const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
                let systemUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/subscription.json`;
                if (dbSecret) systemUrl += `?auth=${dbSecret}`;

                const updates: any = {};
                const newExpiresAt = new Date((sub as any).current_period_end * 1000).toISOString();

                if (systemContext === 'Mistura') {
                    updates.expiresAt = newExpiresAt;
                    updates.isRecurring_Mistura = true;
                    updates.isBlockedByAdmin = false;
                } else {
                    updates[`expiresAt_${systemContext}`] = newExpiresAt;
                    updates[`isRecurring_${systemContext}`] = true;
                    updates[`isBlocked_${systemContext}`] = false;
                }

                await fetchWithRetry(systemUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });

                res.json({ success: true, status: 'active', expiresAt: newExpiresAt });
            } else {
                // No active subscription found, ensure auto-renewal is off
                const dbSecret = process.env.FIREBASE_DATABASE_SECRET;
                let systemUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/subscription.json`;
                if (dbSecret) systemUrl += `?auth=${dbSecret}`;

                const updates: any = {};
                if (systemContext === 'Mistura') {
                    updates.isRecurring_Mistura = false;
                } else {
                    updates[`isRecurring_${systemContext}`] = false;
                }

                await fetchWithRetry(systemUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });

                res.json({ success: false, status: 'not_found' });
            }
        } catch (error: any) {
            console.error('Error syncing subscription:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Vite Middleware (Development)
    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { 
                middlewareMode: true,
                hmr: false
            },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        // Production Static Serving
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
