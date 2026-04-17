import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, ShieldAlert, XCircle, Hand } from 'lucide-react';

export default function Error403() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          <div className="relative inline-block">
             <motion.div
               animate={{ 
                 rotate: [0, -5, 5, -5, 0],
                 x: [0, -2, 2, -2, 0]
               }}
               transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
               className="relative z-20"
             >
                <div className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center bg-slate-900/50 rounded-full p-8 border border-red-900/30">
                    <img 
                      src="/BDV.png" 
                      alt="Acesso Restrito" 
                      className="w-full h-full object-contain opacity-30 grayscale"
                      referrerPolicy="no-referrer"
                    />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 p-4 rounded-3xl shadow-2xl shadow-red-600/30">
                    <Hand size={48} className="text-white" />
                </div>
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[120px] md:text-[180px] font-black text-white/5 select-none">
                   403
                </span>
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-tight">
            Acesso <span className="text-red-500">Restrito!</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
            Opa! Essa área da van é exclusiva para a equipe. Parece que você não tem permissão para entrar por esta porta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              to="/" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white font-extrabold text-lg hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Voltar ao Início
            </Link>
            <Link 
              to="/contato" 
              className="w-full sm:w-auto px-8 py-4 border border-slate-800 rounded-2xl text-slate-400 font-bold hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Pedir Acesso
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
