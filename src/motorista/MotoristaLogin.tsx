import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { MapPin, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import fpPromise from '@fingerprintjs/fingerprintjs';

// Helper functions for device info
const parseUserAgent = (ua: string) => {
    let browser = "Unknown";
    let os = "Unknown";
    let device = "Desktop";

    if (/mobile/i.test(ua)) device = "Mobile";
    else if (/tablet/i.test(ua)) device = "Tablet";

    if (/windows/i.test(ua)) os = "Windows";
    else if (/mac os/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua)) os = "Linux";
    else if (/android/i.test(ua)) os = "Android";
    else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

    if (/chrome|crios/i.test(ua) && !/edge|opr|brave/i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/edge|edgios|edga/i.test(ua)) browser = "Edge";
    else if (/opr|opera/i.test(ua)) browser = "Opera";

    return { browser, os, device };
};

const getHardwareInfo = () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
            return debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown GPU';
        }
    } catch (e) { return 'Unknown GPU'; }
    return 'Unknown GPU';
};

export default function MotoristaLogin() {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [requireLocation, setRequireLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'approximate'>('idle');
  const [locationData, setLocationData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ref = db.ref('system_settings/requireLocationOnLogin');
    ref.on('value', (snap: any) => {
      setRequireLocation(!!snap.val());
    });
    return () => ref.off();
  }, []);

    const getUserLocation = async () => {
    setLocationStatus('loading');
    setError('');

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error("Falha na API de IP");
      const data = await response.json();
      
      const loc = {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
        ip: data.ip,
        type: 'ip',
        reason: 'IP-based location'
      };
      
      console.log("Localização por IP obtida:", loc);
      setLocationData(loc);
      setLocationStatus('success');
      localStorage.setItem('motorista_location', JSON.stringify(loc));
    } catch (err) {
      console.error("Erro ao obter localização por IP:", err);
      setError("Não foi possível obter sua localização automática. Verifique sua conexão.");
      setLocationStatus('idle');
    }
  };

  const handleLocationFallback = async (reason: string) => {
    // Mantido para compatibilidade, mas agora chama getUserLocation que já usa IP
    getUserLocation();
  };

  const handleLogin = async () => {
    if (requireLocation && locationStatus === 'idle') {
      setError('Por favor, ative sua localização antes de entrar.');
      return;
    }

    try {
      const snapshot = await db.ref('drivers').once('value');
      const driversData = snapshot.val();
      const drivers = driversData ? Object.values(driversData) : [];
      console.log('Fetched drivers:', drivers);
      
      const sanitizedInputCpf = cpf.replace(/\D/g, '');
      const driver = drivers.find((d: any) => {
        console.log('Checking driver object:', d);
        const sanitizedStoredCpf = (d.cpf || '').replace(/\D/g, '');
        console.log('Comparing:', d.name, 'with', name, '| CPF:', sanitizedStoredCpf, 'with', sanitizedInputCpf);
        return d.name === name && sanitizedStoredCpf.substring(0, 6) === sanitizedInputCpf;
      }) as any;
      
      if (driver) {
        // Gather Device Info
        let deviceId = 'unknown';
        try {
            const fp = await fpPromise.load();
            const result = await fp.get();
            deviceId = result.visitorId;
        } catch (e) { console.warn("FP error", e); }

        // Check if banned
        const blockedSnap = await db.ref(`blocked_devices/${deviceId}`).once('value');
        if (blockedSnap.exists()) {
            setError('Nome ou CPF inválido.'); // Generic error
            return;
        }

        const sessionData = { ...driver, lastLocation: locationData };
        localStorage.setItem('motorista_session', JSON.stringify(sessionData));

        const uaInfo = parseUserAgent(navigator.userAgent);
        const gpuInfo = getHardwareInfo();
        
        let currentIp = locationData?.ip || '0.0.0.0';
        if (currentIp === '0.0.0.0') {
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    currentIp = ipData.ip;
                }
            } catch (e) { console.warn("IP fetch error", e); }
        }

        const logData = {
            username: driver.name,
            timestamp: Date.now(),
            ip: currentIp,
            device: navigator.userAgent,
            deviceId: deviceId,
            deviceInfo: { ...uaInfo, gpu: gpuInfo },
            location: locationData ? {
                coords: { lat: locationData.latitude, lng: locationData.longitude },
                city: locationData.city,
                region: locationData.region,
                country: locationData.country,
                display_name: locationData.display_name || (locationData.city ? `${locationData.city}, ${locationData.region} - ${locationData.country} (IP)` : 'Localização não identificada'),
                type: locationData.type || 'unknown'
            } : null
        };

        // Log de Acesso do Motorista
        try {
          const logId = db.ref('audit_logs').push().key;
          if (logId) {
            await db.ref(`audit_logs/${logId}`).set({
              ...logData,
              action: 'Login Motorista',
              details: `Motorista ${driver.name} entrou no sistema via ${logData.deviceInfo.browser} (${logData.ip}).`,
              sessionId: logId,
              date: new Date().toISOString().split('T')[0]
            });
          }
          
          // Add to access_timeline
          await db.ref('access_timeline').push(logData);
          
        } catch (logErr) {
          console.warn("Erro ao gerar log de motorista:", logErr);
        }

        navigate('/motorista/dashboard');
      } else {
        setError('Nome ou CPF inválido.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao fazer login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Login Motorista</h2>
        {error && <p className="text-red-400 mb-4 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
        
        <input 
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-4 focus:border-blue-500 outline-none transition-colors"
          placeholder="Nome do Motorista"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input 
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-6 focus:border-blue-500 outline-none transition-colors"
          placeholder="6 primeiros dígitos do CPF"
          value={cpf}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setCpf(val.substring(0, 6));
          }}
        />

        {requireLocation && (
          <div className="mb-6">
            {locationStatus === 'idle' && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-300 mb-3 text-center">Clique para ativar sua localização e ver opções próximas a você</p>
                <button 
                  onClick={getUserLocation}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border border-blue-500/30"
                >
                  <MapPin size={18} />
                  Ativar minha localização
                </button>
              </div>
            )}

            {locationStatus === 'loading' && (
              <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-700">
                <Loader2 className="animate-spin text-blue-400" size={24} />
                <p className="text-sm text-slate-300">Obtendo localização...</p>
              </div>
            )}

            {locationStatus === 'success' && (
              <div className="bg-green-500/10 p-4 rounded-xl flex items-center gap-3 border border-green-500/20">
                <CheckCircle2 className="text-green-400 shrink-0" size={24} />
                <p className="text-sm text-green-300">Localização obtida via IP ({locationData?.city})</p>
              </div>
            )}

            {locationStatus === 'approximate' && (
              <div className="bg-amber-500/10 p-4 rounded-xl flex flex-col gap-3 border border-amber-500/20">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-amber-300 leading-tight">Localização aproximada via IP ({locationData?.city})</p>
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={requireLocation && locationStatus === 'idle'}
          className={`w-full py-4 rounded-xl font-bold transition-all ${
            requireLocation && locationStatus === 'idle' 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
          }`}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
