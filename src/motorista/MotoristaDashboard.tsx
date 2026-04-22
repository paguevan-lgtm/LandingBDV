import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './components/MotoristaShared';
import DashboardView from './DashboardView';
import CadastroView from './CadastroView';
import HistoricoView from './HistoricoView';
import ConfiguracoesView from './ConfiguracoesView';
import { db } from '../firebase';
import fpPromise from '@fingerprintjs/fingerprintjs';

export default function MotoristaDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const driver = JSON.parse(localStorage.getItem('motorista_session') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('motorista_session');
    navigate('/motorista');
  };

  useEffect(() => {
    let unsubscribe: any = null;

    const setupBlockListener = async () => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        const deviceId = result.visitorId;

        const blockRef = db.ref(`blocked_devices/${deviceId}`);
        const callback = blockRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            console.warn("Dispositivo banido em tempo real. Deslogando motorista...");
            handleLogout();
          }
        });

        unsubscribe = () => blockRef.off('value', callback);
      } catch (e) {
        console.error("Erro ao configurar listener de bloqueio do motorista:", e);
      }
    };

    setupBlockListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'cadastro': return <CadastroView onFinish={() => setActiveTab('dashboard')} />;
      case 'historico': return <HistoricoView />;
      case 'config': return <ConfiguracoesView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-xl">Olá, {driver.nome || 'Motorista'}</h1>
          <p className="text-xs text-slate-400">Controle Diário</p>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white transition-colors">
          <Icons.LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-20">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icons.Home size={24} />
            <span className="text-[10px] mt-1 font-bold">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('cadastro')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'cadastro' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-3 rounded-full -mt-6 shadow-lg ${activeTab === 'cadastro' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Icons.Plus size={24} />
            </div>
            <span className="text-[10px] mt-1 font-bold">Novo Dia</span>
          </button>

          <button 
            onClick={() => setActiveTab('historico')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'historico' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icons.List size={24} />
            <span className="text-[10px] mt-1 font-bold">Histórico</span>
          </button>

          <button 
            onClick={() => setActiveTab('config')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'config' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icons.Settings size={24} />
            <span className="text-[10px] mt-1 font-bold">Config</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
