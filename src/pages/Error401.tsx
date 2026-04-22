import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, Lock, ShieldAlert, UserCheck } from 'lucide-react';

export default function Error401() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-brand-pink/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          <div className="relative inline-block">
             <motion.div
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="relative z-20"
             >
                <div className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center bg-slate-900/50 rounded-full p-8 border border-slate-800">
                    <img 
                      src="/BDV.png" 
                      alt="Login Obrigatório" 
                      className="w-full h-full object-contain opacity-40 grayscale"
                      referrerPolicy="no-referrer"
                    />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-purple p-4 rounded-3xl shadow-2xl">
                    <Lock size={48} className="text-white" />
                </div>
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[120px] md:text-[180px] font-black text-white/5 select-none">
                   401
                </span>
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-tight">
            Parada <span className="text-gradient-brand">Obrigatória!</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
            Para subir nessa van, você precisa se identificar. Faça o login para continuar sua viagem com a gente!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-brand rounded-2xl text-white font-extrabold text-lg shadow-xl shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck size={20} />
              Identificar-se Agora
            </button>
            <Link 
              to="/" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Voltar ao Início
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
