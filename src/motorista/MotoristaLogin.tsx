import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { MapPin, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MotoristaLogin() {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [requireLocation, setRequireLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'approximate'>('idle');
  const [locationData, setLocationData] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
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
    setShowInstructions(false);

    if (!navigator.geolocation) {
      handleLocationFallback("Navegador incompatível com geolocalização.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { latitude, longitude, type: 'gps' };
        console.log("Localização GPS obtida:", loc);
        setLocationData(loc);
        setLocationStatus('success');
        localStorage.setItem('motorista_location', JSON.stringify(loc));
      },
      (err) => {
        console.warn("Erro ao obter GPS:", err.message);
        setLocationStatus('idle');
        setShowInstructions(true);
        if (err.code === 1) { // Permission Denied
            setError("Permissão de localização negada. Siga as instruções abaixo para ativar.");
        } else {
            setError("Erro ao obter localização precisa. Tente novamente ou siga as instruções.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleLocationFallback = async (reason: string) => {
    // Fallback agora é acionado apenas se o usuário explicitamente desistir ou se houver erro crítico
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
        type: 'ip',
        reason
      };
      
      console.log("Localização aproximada (IP) obtida:", loc);
      setLocationData(loc);
      setLocationStatus('approximate');
      localStorage.setItem('motorista_location', JSON.stringify(loc));
    } catch (fallbackErr) {
      console.error("Erro no fallback de IP:", fallbackErr);
      setError("Não foi possível obter sua localização. Verifique sua conexão.");
      setLocationStatus('idle');
    }
  };

  const handleLogin = async () => {
    if (requireLocation && locationStatus === 'idle') {
      setError('Por favor, ative sua localização antes de entrar.');
      return;
    }

    try {
      const driversRef = db.ref('drivers');
      driversRef.once('value', (snapshot: any) => {
        const driversData = snapshot.val();
        const drivers = driversData ? Object.values(driversData) : [];
        console.log('Fetched drivers:', drivers);
        
        const sanitizedInputCpf = cpf.replace(/\D/g, '');
        const driver = drivers.find((d: any) => {
          console.log('Checking driver object:', d);
          const sanitizedStoredCpf = (d.cpf || '').replace(/\D/g, '');
          console.log('Comparing:', d.name, 'with', name, '| CPF:', sanitizedStoredCpf, 'with', sanitizedInputCpf);
          return d.name === name && sanitizedStoredCpf.substring(0, 6) === sanitizedInputCpf;
        });
        
        if (driver) {
          const sessionData = { ...driver, lastLocation: locationData };
          localStorage.setItem('motorista_session', JSON.stringify(sessionData));
          navigate('/motorista/dashboard');
        } else {
          setError('Nome ou CPF inválido.');
        }
      });
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
                <p className="text-sm text-green-300">Localização obtida com sucesso</p>
              </div>
            )}

            {locationStatus === 'approximate' && (
              <div className="bg-amber-500/10 p-4 rounded-xl flex flex-col gap-3 border border-amber-500/20">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-amber-300 leading-tight">Não foi possível acessar sua localização precisa, exibindo dados aproximados ({locationData?.city})</p>
                </div>
                <button 
                  onClick={getUserLocation}
                  className="text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 underline text-left"
                >
                  Tentar obter localização precisa novamente
                </button>
              </div>
            )}

            {showInstructions && (
              <div className="mt-4 space-y-4">
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-white/10 shadow-inner">
                  <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Icons.Info size={14} className="text-blue-400" /> Como ativar a localização:
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">PC</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Clique no ícone de <span className="text-white font-bold">cadeado</span> ao lado do endereço do site (URL) e mude "Localização" para <span className="text-green-400 font-bold">Permitir</span>.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400 shrink-0">AND</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Toque no ícone de <span className="text-white font-bold">cadeado</span> ou nos <span className="text-white font-bold">três pontos</span> {'>'} Configurações {'>'} Configurações do site {'>'} Localização {'>'} Permitir.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">iOS</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Ajustes {'>'} Privacidade {'>'} Serv. Localização {'>'} Safari {'>'} <span className="text-white font-bold">Durante o Uso</span>. No Safari, toque em <span className="text-white font-bold">Aa</span> {'>'} Ajustes do Site {'>'} Localização.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleLocationFallback("Usuário optou por usar localização aproximada")}
                  className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Continuar com localização aproximada (IP)
                </button>
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
