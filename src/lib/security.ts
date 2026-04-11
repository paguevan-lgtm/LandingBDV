
import fpPromise from '@fingerprintjs/fingerprintjs';

// Simple hash function (Cypher 53)
export const cyrb53 = (str: string, seed = 0) => {
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

// Cookie helpers for better persistence
const setCookie = (name: string, value: string, days = 365) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
};

const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

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

const getCanvasFingerprint = () => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no_canvas';
        
        canvas.width = 280;
        canvas.height = 60;
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.font = "11pt no-real-font-123"; 
        ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "18pt Arial";
        ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 4, 45);
        
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgb(255,0,255)";
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.fill();
        
        return cyrb53(canvas.toDataURL()).toString();
    } catch (e) { return 'canvas_err'; }
};

export const getHardwareFingerprint = () => {
    try {
        const components = [
            window.screen.width,
            window.screen.height,
            window.screen.colorDepth,
            window.devicePixelRatio || 1,
            navigator.hardwareConcurrency || 'unknown',
            navigator.platform || 'unknown',
            navigator.maxTouchPoints || 0,
            navigator.vendor || 'unknown',
            // We exclude Timezone and Languages as they change with VPNs/IPs
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
        // 1. Try to recover existing ID from multiple storages
        let savedId = localStorage.getItem('sys_dev_id') || getCookie('sys_dev_id');
        
        // 2. Poison pill check (survives localStorage clear if cookie remains)
        if (localStorage.getItem('sys_dev_blocked') === 'true' || getCookie('sys_dev_blocked') === 'true') {
            // Re-sync both storages
            localStorage.setItem('sys_dev_blocked', 'true');
            setCookie('sys_dev_blocked', 'true');
            return 'BANNED_DEVICE_' + (savedId || 'UNKNOWN');
        }

        const fp = await fpPromise.load();
        const result = await fp.get();
        const fpId = result.visitorId;
        const hwId = getHardwareFingerprint();
        
        // Use v3 to distinguish from previous potentially unstable versions
        const currentCompositeId = `v3_${fpId}_${hwId}`;
        
        // 3. Stability Logic: If we have a saved ID, try to stick to it
        if (savedId && savedId.startsWith('v3_')) {
            const parts = savedId.split('_');
            if (parts.length === 3) {
                const [, savedFp, savedHw] = parts;
                
                // If either the FingerprintJS ID OR the Hardware ID matches, 
                // we consider it the same device to prevent ban evasion via IP/Browser minor changes
                if (savedFp === fpId || savedHw === hwId) {
                    // Update storages to ensure both have the same ID
                    localStorage.setItem('sys_dev_id', savedId);
                    setCookie('sys_dev_id', savedId);
                    return savedId;
                }
            }
        }

        // New device or both parts changed significantly
        localStorage.setItem('sys_dev_id', currentCompositeId);
        setCookie('sys_dev_id', currentCompositeId);
        
        return currentCompositeId;
    } catch (e) {
        console.error("Fingerprint error:", e);
        const fallbackId = 'fallback_v3_' + getHardwareFingerprint();
        localStorage.setItem('sys_dev_id', fallbackId);
        setCookie('sys_dev_id', fallbackId);
        return fallbackId;
    }
};

export const setPoisonPill = (deviceId?: string) => {
    localStorage.setItem('sys_dev_blocked', 'true');
    setCookie('sys_dev_blocked', 'true');
    if (deviceId) {
        localStorage.setItem('sys_dev_id', deviceId);
        setCookie('sys_dev_id', deviceId);
    }
};
