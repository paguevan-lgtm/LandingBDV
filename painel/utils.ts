
import { INITIAL_SP_LIST, BAIRROS, BAIRROS_MIP } from './constants';
import { GoogleGenAI } from "@google/genai";
import fpPromise from '@fingerprintjs/fingerprintjs';

export const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getTodayDate = () => {
    const d = new Date();
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

export const getOperationalDate = () => {
    const d = new Date();
    // Só vira o dia operacional às 03:00 da manhã
    if (d.getHours() < 3) {
        d.setDate(d.getDate() - 1);
    }
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

export const getLousaDate = () => {
    const d = new Date();
    // Sincronizado com o Operacional para evitar desvios
    if (d.getHours() < 3) {
        d.setDate(d.getDate() - 1);
    }
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return local.toISOString().split('T')[0];
};

export const parseDisplayDate = (d: string) => {
    if (!d || d.length !== 10) return '';
    const [day, m, y] = d.split('/');
    if (!day || !m || !y) return '';
    return `${y}-${m}-${day}`;
};

export const formatDisplayDate = (d: string) => {
    if(!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
};

export const dateAddDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

export const normalizeTime = (t: string) => {
    if (!t) return '';
    const upper = t.toUpperCase();
    const isPM = upper.includes('PM');
    const isAM = upper.includes('AM');
    
    if (!isPM && !isAM) return t; // Já é 24h ou formato desconhecido

    let clean = upper.replace('PM', '').replace('AM', '').trim();
    let [h, m] = clean.split(':').map(Number);

    if (isNaN(h)) return t;
    if (isNaN(m)) m = 0;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const formatTime = (t: string) => normalizeTime(t); 

export const getBairroIdx = (b: string, systemContext?: string) => { 
    if (!b) return 999;
    const normB = b.toLowerCase().trim();
    
    // Se o contexto for MIP, procura na lista da MIP primeiro
    if (systemContext === 'Mip') {
        const idxMip = BAIRROS_MIP.findIndex(item => item.toLowerCase().trim() === normB);
        if (idxMip !== -1) return idxMip;
    }

    // Procura na lista padrão (PG)
    const idx = BAIRROS.findIndex(item => item.toLowerCase().trim() === normB);
    
    // Se não achou na padrão, mas é MIP, já retornou 999 ou o índice MIP acima.
    // Se achou na padrão, retorna.
    if (idx !== -1) return idx;

    // Fallback: Se for MIP e não achou em nenhuma, tenta achar na MIP de novo (caso o contexto não tenha sido passado mas o bairro seja obviamente MIP? Não, melhor seguir a regra do contexto)
    // Se não achou em nenhuma lista
    return 999; 
};

export const getDayName = (dateStr: string) => {
    const days = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    const date = new Date(dateStr + 'T12:00:00');
    return days[date.getDay()];
};

export const getAvatarUrl = (name: string) => {
    if(name && name.toLowerCase() === 'breno') {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=Robert`; 
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

export const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const addMinutes = (time: string, mins: number) => {
    if(!time) return '';
    if (time.includes('/')) return time; // Se já tiver barra, retorna como está (ex: 05:00/05:45)
    
    const normTime = normalizeTime(time);
    const parts = normTime.split(':');
    if (parts.length < 2) return time;

    const [h, m] = parts.map(Number);
    if (isNaN(h) || isNaN(m)) return time;

    const date = new Date();
    date.setHours(h);
    date.setMinutes(m + mins);
    // FORÇAR 24 HORAS
    return date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', hour12: false});
}

export const calculateTimeSlot = (t: string, duration: number = 45) => { 
    if(!t) return '-'; 
    if (t.includes('/')) {
        return t; // Se já tiver formato composto, não duplica
    }
    const endTime = addMinutes(t, duration);
    return `${formatTime(t)} - ${endTime}`; 
};

export const generateWhatsappMessage = (tripId: string, passengers: any[], driverName: string, time: string, date: string) => {
    if(!passengers?.length) return "";
    
    const [y, m, d] = date.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    let msg = `*DADOS DA VIAGEM - ${formattedDate}*\n\n`;
    msg += `*Código:* ${tripId}\n`;
    msg += `*Horário:* ${formatTime(time)}\n`;
    msg += `*PASSAGEIRO(S):*\n\n`;

    // Ordena passageiros por bairro
    const sorted = passengers.sort((a,b)=>getBairroIdx(a.neighborhood)-getBairroIdx(b.neighborhood));

    sorted.forEach((p, index) => {
        let displayTime = formatTime(p.time || time);
        // Evita duplicar se o horário já for composto (ex: Madrugada)
        if (!displayTime.includes('/')) {
            const endTime = addMinutes(displayTime, 45);
            displayTime = `${displayTime}/${endTime}`;
        }

        msg += `*Passageiro ${index + 1}:*\n`;
        msg += `• ${p.name}\n`;
        msg += `• ${p.phone || 'Sem número'}\n`;
        if (p.address) msg += `• ${p.address}\n`;
        if (p.reference) msg += `• ${p.reference}\n`;
        if (p.neighborhood) msg += `• ${p.neighborhood}\n`;
        
        const count = p.passengerCount || 1;
        msg += `• ${count} ${count > 1 ? 'passageiros' : 'passageiro'}\n`;

        if (p.children && p.children.length > 0) {
            const childrenText = p.children.map((c: any) => `${c.quantity} ${c.quantity > 1 ? 'Crianças' : 'Criança'} de ${c.age} Anos`).join(', ');
            msg += `• ${childrenText}\n`;
        }

        if (p.luggageCount > 0) {
            msg += `• ${p.luggageCount} bagagem(ns)${p.luggageDetails ? ` (${p.luggageDetails})` : ''}\n`;
        }

        if (p.observation || p.obs) {
            msg += `• Obs: ${p.observation || p.obs}\n`;
        }

        msg += `\n`;
    });

    msg += `_Enviado via Bora de Van Transportes_`;
    return msg;
};

export const sendPassWhatsapp = (p: any) => {
    if(!p.phone) return false;
    const msg = encodeURIComponent(`Olá ${p.name}, sobre seu agendamento para ${formatDisplayDate(p.date)} às ${formatTime(p.time)}...`);
    window.open(`https://wa.me/55${p.phone.replace(/\D/g,'')}?text=${msg}`, '_blank');
    return true;
};

export const generateTripListText = (passengers: any[], driverName: string, time: string) => {
    const sorted = passengers.sort((a,b)=>getBairroIdx(a.neighborhood)-getBairroIdx(b.neighborhood));
    return `VIAGEM ${formatTime(time)} - ${driverName}\n\n` + sorted.map(p=> {
        let text = `• ${p.name} - ${p.neighborhood}\n  ${p.address} (${p.reference || ''})`;
        if (p.children && p.children.length > 0) {
            const childrenText = p.children.map((c: any) => `${c.quantity} ${c.quantity > 1 ? 'Crianças' : 'Criança'} de ${c.age} Anos`).join(', ');
            text += `\n  ${childrenText}`;
        }
        if (p.observation || p.obs) {
            text += `\n  Obs: ${p.observation || p.obs}`;
        }
        return text;
    }).join('\n\n');
};

// Global state for Gemini model choice
let robustModeExpiration: number | null = null;
const ROBUST_MODE_DURATION = 60 * 60 * 1000; // 1 hour

export const callGemini = async (prompt: string, apiKey: string, retries = 2) => {
    if (!apiKey) throw new Error("Chave API Gemini não configurada!");
    
    const now = Date.now();
    // Check if we are still in the 1-hour "robust mode" window
    const isInRobustMode = robustModeExpiration !== null && now < robustModeExpiration;
    
    // Tier 1: gemini-3.1-flash-lite-preview (Fastest and most economical)
    // Tier 2: gemini-3-flash-preview (Robust fallback)
    const modelName = isInRobustMode ? 'gemini-3-flash-preview' : 'gemini-3.1-flash-lite-preview';
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        return response.text || "";
    } catch (error: any) {
        const isUnavailable = error.message?.includes('503') || 
                            error.message?.includes('high demand') || 
                            error.message?.includes('UNAVAILABLE') ||
                            error.message?.includes('overloaded');

        if (isUnavailable) {
            // Trigger robust mode for 1 hour
            robustModeExpiration = Date.now() + ROBUST_MODE_DURATION;
            console.warn(`Gemini API (${modelName}) busy. Switching to robust model (gemini-flash-preview) for the next 1 hour.`);
            
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Immediate retry using the robust model (since robustModeExpiration was just set)
                return callGemini(prompt, apiKey, retries - 1);
            }
        }
        throw error;
    }
};

export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG with 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/* --- PRINT FUNCTION FIXED --- */
export const handlePrint = async (targetId: string, filename: string, title: string, options: any = {}) => {
    // ... existing handlePrint content (omitted for brevity, assume it's the same) ...
    // Using simple placeholder to save space as it's not changed
    const element = document.getElementById(targetId);
    if (!element) throw new Error("Elemento não encontrado para impressão.");
    
    // (Existing Print Logic)
    let wrapper = null;
    try {
        let clone: HTMLElement | null = null;
        const itemCount = element.children.length;
        let columns = 1;
        let itemsToSkip = 0;
        const ITEMS_PER_COL = 10;

        if (options.forceCols) {
            columns = options.forceCols;
        } else if (options.mode === 'confirmados') {
            columns = Math.ceil(itemCount / ITEMS_PER_COL);
        } else if (options.mode === 'lousa') {
            if (itemCount > ITEMS_PER_COL * 2) {
                itemsToSkip = ITEMS_PER_COL;
                columns = Math.ceil((itemCount - ITEMS_PER_COL) / ITEMS_PER_COL);
            } else {
                columns = Math.ceil(itemCount / ITEMS_PER_COL);
            }
        } else {
            columns = Math.ceil(itemCount / ITEMS_PER_COL);
        }
        if (columns < 1) columns = 1;

        wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;background-color:#1e293b;color:white;padding:40px;z-index:99999;line-height:1.2;';
        
        let dateStr = new Date().toLocaleDateString('pt-BR');
        if (options.date) { const [y, m, d] = options.date.split('-'); dateStr = `${d}/${m}/${y}`; }

        const titleEl = document.createElement('h1');
        titleEl.innerText = `${title} - ${dateStr}`;
        titleEl.style.cssText = 'text-align:center;margin-bottom:5px;font-size:32px;font-weight:bold;color:#fbbf24;width:100%';
        wrapper.appendChild(titleEl);

        if (options.userName) {
            const userEl = document.createElement('div');
            userEl.innerText = `Gerado por: ${options.userName}`;
            userEl.style.cssText = 'text-align:center;margin-bottom:20px;font-size:14px;opacity:0.7;font-style:italic;width:100%';
            wrapper.appendChild(userEl);
        }

        clone = element.cloneNode(true) as HTMLElement;
        
        // Remove os itens que devem ser pulados (primeira coluna da lousa)
        if (itemsToSkip > 0) {
            for (let i = 0; i < itemsToSkip; i++) {
                if (clone.children[0]) clone.children[0].remove();
            }
        }

        clone.style.width = '100%';
        clone.querySelectorAll('.hide-on-print').forEach(el => el.remove());
        clone.querySelectorAll('.overflow-hidden').forEach(el => el.classList.remove('overflow-hidden'));
        clone.querySelectorAll('.show-on-print').forEach(el => { 
            el.classList.remove('hidden'); 
            const display = el.getAttribute('data-print-display') || 'flex';
            (el as any).style.display = display;
            (el as any).style.visibility = 'visible';
            (el as any).style.opacity = '1';
        });

        clone.querySelectorAll('[data-print-size]').forEach(el => {
            (el as any).style.fontSize = el.getAttribute('data-print-size');
        });
        clone.querySelectorAll('[data-print-color]').forEach(el => {
            (el as any).style.color = el.getAttribute('data-print-color');
        });
        clone.querySelectorAll('[data-print-weight]').forEach(el => {
            (el as any).style.fontWeight = el.getAttribute('data-print-weight');
        });
        clone.querySelectorAll('.line-through, [data-print-decoration="line-through"]').forEach(el => {
            el.classList.remove('line-through');
            (el as any).style.textDecoration = 'none';
            
            if (!el.classList.contains('absolute') && !el.classList.contains('fixed') && !el.classList.contains('relative')) {
                el.classList.add('relative');
            }
            
            const line = document.createElement('span');
            const offset = el.getAttribute('data-print-line-offset') || '20px';
            line.style.cssText = `position: absolute; left: 0; right: 0; top: calc(50% + ${offset}); height: 2px; background-color: currentColor; transform: translateY(-50%); pointer-events: none; z-index: 10;`;
            el.appendChild(line);
        });
        
        clone.querySelectorAll('[data-print-decoration]').forEach(el => {
            const decoration = el.getAttribute('data-print-decoration');
            if (decoration !== 'line-through') {
                (el as any).style.textDecoration = decoration;
            }
        });
        clone.querySelectorAll('[data-print-transform]').forEach(el => {
            (el as any).style.transform = el.getAttribute('data-print-transform');
        });
        clone.querySelectorAll('[data-print-justify]').forEach(el => {
            (el as any).style.justifyContent = el.getAttribute('data-print-justify');
        });
        clone.querySelectorAll('[data-print-flex]').forEach(el => {
            (el as any).style.flex = el.getAttribute('data-print-flex');
        });
        clone.querySelectorAll('[data-print-border]').forEach(el => {
            (el as any).style.border = el.getAttribute('data-print-border');
        });
        clone.querySelectorAll('[data-print-bg]').forEach(el => {
            (el as any).style.backgroundColor = el.getAttribute('data-print-bg');
        });
        clone.querySelectorAll('[data-print-opacity]').forEach(el => {
            (el as any).style.opacity = el.getAttribute('data-print-opacity');
        });
        clone.querySelectorAll('[data-print-shadow]').forEach(el => {
            (el as any).style.boxShadow = el.getAttribute('data-print-shadow');
        });
        
        // Fix for column breaking
        Array.from(clone.children).forEach((child: any) => {
            child.style.breakInside = 'avoid';
            child.style.pageBreakInside = 'avoid';
            child.style.marginBottom = '10px';
        });

        // Render clone to wrapper
        const contentContainer = document.createElement('div');
        const colWidth = 450;
        wrapper.style.width = `${columns * colWidth + (columns > 1 ? (columns - 1) * 40 : 0) + 80}px`; 
        
        if (columns > 1) {
            contentContainer.style.columnCount = columns.toString();
            contentContainer.style.columnGap = '40px';
        }
        
        contentContainer.appendChild(clone);
        wrapper.appendChild(contentContainer);
        document.body.appendChild(wrapper);

        // @ts-ignore
        const html2canvas = (window as any).html2canvas;
        await document.fonts.ready;
        const canvas = await html2canvas(wrapper, { 
            backgroundColor: '#1e293b', 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            logging: false,
            windowWidth: 1280 // Forçar viewport de desktop para consistência
        });
        const link = document.createElement('a');
        link.download = `${filename}_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (err) { throw new Error("Erro ao gerar imagem."); } 
    finally { if (wrapper && document.body.contains(wrapper)) document.body.removeChild(wrapper); }
};

// --- SECURITY FINGERPRINTING ---

// Simple hash function (Cypher 53)
const cyrb53 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// Helper for Canvas Fingerprint (Hardware Acceleration Signature)
const getCanvasFingerprint = () => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no_canvas';
        
        // Setup complex scene to trigger hardware specific rasterization differences
        canvas.width = 280;
        canvas.height = 60;
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        // Use a fallback font to force system default rendering paths
        ctx.font = "11pt no-real-font-123"; 
        ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "18pt Arial";
        ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 4, 45);
        
        // Composite operation triggers GPU blending logic
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgb(255,0,255)";
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgb(0,255,255)";
        ctx.beginPath();
        ctx.arc(100, 50, 50, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.fill();
        
        return cyrb53(canvas.toDataURL()).toString();
    } catch (e) { return 'canvas_err'; }
};

// Hardware-based fingerprint (more stable across browsers on same device)
export const getHardwareFingerprint = () => {
    try {
        const components = [
            window.screen.width,
            window.screen.height,
            window.screen.colorDepth,
            navigator.hardwareConcurrency || 'unknown',
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            navigator.languages ? navigator.languages.join(',') : 'unknown',
            getHardwareInfo(),
            getCanvasFingerprint()
        ];
        return cyrb53(components.join('|')).toString();
    } catch (e) {
        return 'hw_fallback_' + Math.random().toString(36).substr(2, 9);
    }
};

export const getDeviceFingerprint = async () => {
    try {
        // Check for poison pill first
        if (localStorage.getItem('sys_dev_blocked') === 'true') {
            return 'BANNED_DEVICE_' + (localStorage.getItem('sys_dev_id') || 'UNKNOWN');
        }

        const fp = await fpPromise.load();
        const result = await fp.get();
        const fpId = result.visitorId;
        const hwId = getHardwareFingerprint();
        
        // Composite ID: Combine both for maximum stability and uniqueness
        const compositeId = `v2_${fpId}_${hwId}`;
        
        // Store the ID for the poison pill mechanism
        localStorage.setItem('sys_dev_id', compositeId);
        
        return compositeId;
    } catch (e) {
        console.error("FingerprintJS error:", e);
        const hwId = getHardwareFingerprint();
        return 'fallback_v2_' + hwId;
    }
};

export const setPoisonPill = (deviceId?: string) => {
    localStorage.setItem('sys_dev_blocked', 'true');
    if (deviceId) localStorage.setItem('sys_dev_id', deviceId);
};

// Extrator de detalhes para exibição (Log)
export const parseUserAgent = (ua: string) => {
    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown OS';
    
    // Device
    if (/mobile/i.test(ua)) device = 'Mobile';
    if (/tablet/i.test(ua)) device = 'Tablet';
    if (/iphone/i.test(ua)) device = 'iPhone';
    if (/android/i.test(ua)) device = 'Android';
    
    // Browser
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    
    // OS
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac os/i.test(ua)) os = 'MacOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/ios/i.test(ua)) os = 'iOS';
    
    return { device, browser, os };
};

// Helper para obter Hardware Info legível (para logs)
export const getHardwareInfo = () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        let gpu = 'Unknown GPU';
        if (gl) {
            // @ts-ignore
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            // @ts-ignore
            if(debugInfo) gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        return gpu;
    } catch(e) { return 'Unknown GPU'; }
}

export const getUsdBrlRate = async () => {
    try {
        const res = await fetch('/api/exchange-rate');
        const data = await res.json();
        if (data?.USDBRL?.bid) {
            return parseFloat(data.USDBRL.bid);
        }
        return 5.25;
    } catch (e) {
        console.error("Erro ao buscar cotação via proxy:", e);
        return 5.25; // Fallback
    }
};

export const calculateSimilarity = (str1: string, str2: string) => {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    
    const costs = new Array();
    for (let i = 0; i <= shorter.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= longer.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (shorter.charAt(i - 1) != longer.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[longer.length] = lastValue;
    }
    
    return (longerLength - costs[longer.length]) / parseFloat(longerLength.toString());
};
