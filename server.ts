import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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

            // Check if device is trusted
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
            }

            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; max-width: 500px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px 30px 30px; text-align: center;">
              <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); border-radius: 12px; margin-bottom: 20px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px;">Bora de Van</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <p style="margin: 0 0 24px 0; color: #f8fafc; font-size: 18px; font-weight: 600;">Olá, ${userName}!</p>
              <p style="margin: 0 0 32px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">${message}</p>
              
              <div style="background: rgba(219, 39, 119, 0.1); border: 2px dashed #db2777; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <span style="display: block; color: #db2777; font-size: 42px; font-weight: 900; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">${token}</span>
              </div>
              
              <p style="margin: 0 0 8px 0; color: #f43f5e; font-size: 14px; font-weight: 700;">Este código expira em 10 minutos.</p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">Por segurança, não compartilhe este código com ninguém.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #020617; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 12px 0; color: #475569; font-size: 12px; line-height: 1.4;">${footerMessage}</p>
              <p style="margin: 0; color: #475569; font-size: 12px; font-weight: 600;">&copy; ${new Date().getFullYear()} Bora de Van. Todos os direitos reservados.</p>
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

        res.json({ success: true });
    });

    async function findExistingPassenger(system: string, name: string, phone: string, address: string, authParam: string) {
        let url = `https://lotacao-753a1-default-rtdb.firebaseio.com/`;
        if (system === 'Pg') {
            url += `passengers.json${authParam}`;
        } else {
            url += `${system}/passengers.json${authParam}`;
        }

        try {
            const res = await fetchWithRetry(url);
            const passengers = await res.json();
            if (!passengers) return null;

            const normalizedName = name.toLowerCase().trim();
            const normalizedPhone = phone.replace(/\D/g, '');
            const normalizedAddress = address.toLowerCase().trim();

            for (const key in passengers) {
                const p = passengers[key];
                if (!p || !p.name || !p.phone) continue;

                const pName = p.name.toLowerCase().trim();
                const pPhone = p.phone.replace(/\D/g, '');
                const pAddress = (p.address || '').toLowerCase().trim();

                // Match by Name, Phone and Address
                if (pName === normalizedName && pPhone === normalizedPhone && pAddress === normalizedAddress) {
                    return { key, id: p.id, data: p };
                }
            }
        } catch (e) {
            console.error("Error searching for existing passenger:", e);
        }
        return null;
    }

    app.post('/api/create-booking', async (req, res) => {
        try {
            const passengerData = req.body;
            if (!passengerData || !passengerData.name || !passengerData.phone) {
                return res.status(400).json({ error: 'Name and phone are required' });
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

            // 2. Check for existing passenger (Name, Phone, Address match)
            const existing = await findExistingPassenger(systemToSave, passengerData.name, passengerData.phone, passengerData.address || '', authParam);
            
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
                
                console.log(`Reusing existing passenger: ${displayId} (key: ${firebaseKey})`);
            } else {
                // 3. Get and increment the site booking counter
                const counterUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/system_settings/site_booking_counter.json${authParam}`;
                let currentCounter = 1;
                
                try {
                    const counterRes = await fetchWithRetry(counterUrl);
                    const counterData = await counterRes.json();
                    if (typeof counterData === 'number') {
                        currentCounter = counterData + 1;
                    }
                } catch (e) {
                    console.warn("Could not fetch counter, starting at 1");
                }

                // Save the new counter
                await fetchWithRetry(counterUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentCounter)
                });

                // 4. Generate new ID
                displayId = `SITE #${currentCounter}`;
                firebaseKey = `SITE_${currentCounter}`;
            }

            passengerData.id = displayId;

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

            // 5. Push notification for real-time alerts in the panel
            try {
                const notificationUrl = `https://lotacao-753a1-default-rtdb.firebaseio.com/site_notifications.json${authParam}`;
                const notificationData = {
                    id: Date.now().toString(),
                    type: 'new_booking',
                    system: systemToSave,
                    passengerName: passengerData.name,
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

    app.post('/api/update-booking-phone', async (req, res) => {
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

    app.post('/api/create-pix-payment', async (req, res) => {
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
