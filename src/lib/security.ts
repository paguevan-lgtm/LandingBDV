
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
        // Poison pill check
        if (localStorage.getItem('sys_dev_blocked') === 'true') {
            return 'BANNED_DEVICE_' + (localStorage.getItem('sys_dev_id') || 'UNKNOWN');
        }

        const fp = await fpPromise.load();
        const result = await fp.get();
        const fpId = result.visitorId;
        const hwId = getHardwareFingerprint();
        
        const compositeId = `v2_${fpId}_${hwId}`;
        localStorage.setItem('sys_dev_id', compositeId);
        
        return compositeId;
    } catch (e) {
        console.error("Fingerprint error:", e);
        return 'fallback_v2_' + getHardwareFingerprint();
    }
};

export const setPoisonPill = (deviceId?: string) => {
    localStorage.setItem('sys_dev_blocked', 'true');
    if (deviceId) localStorage.setItem('sys_dev_id', deviceId);
};
