import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { MapPin, Loader2, CheckCircle2, AlertTriangle, User, ShieldCheck, Car } from 'lucide-react';
import { motion } from 'motion/react';
import { getDeviceFingerprint, setPoisonPill, getHardwareInfo } from '../lib/security';

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
      
      const driver = drivers.find((d: any) => {
        console.log('Checking driver object:', d);
        const sanitizedStoredCpf = (d.cpf || '').replace(/\D/g, '');
        const storedPassword = d.password || sanitizedStoredCpf.substring(0, 6);
        
        console.log('Comparing:', d.name, 'with', name, '| Password:', storedPassword, 'with', cpf);
        return d.name === name && storedPassword === cpf;
      }) as any;
      
      if (driver) {
        // Gather Device Info
        const deviceId = await getDeviceFingerprint();

        // Check if banned
        const blockedSnap = await db.ref(`blocked_devices/${deviceId}`).once('value');
        if (blockedSnap.exists() || deviceId.startsWith('BANNED_DEVICE_')) {
            setPoisonPill(deviceId);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] w-full max-w-md border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3">
            <Car size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-display font-extrabold text-white">Bora de <span className="text-blue-500">Van</span></h2>
          <p className="text-slate-400 text-sm font-medium">Acesso Exclusivo para Motoristas</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 mb-6 text-xs bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-3"
          >
            <AlertTriangle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}
        
        <div className="space-y-4 mb-8">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
              placeholder="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="password"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
              placeholder="Senha (ou 6 dígitos do CPF)"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
          </div>
        </div>

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
