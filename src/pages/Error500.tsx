import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { RefreshCw, Home, Wrench, AlertTriangle, CloudOff } from 'lucide-react';

export default function Error500() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-orange-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          {/* Smoking Van Animation */}
          <div className="relative inline-block">
             <motion.div
               animate={{ 
                 y: [0, -2, 0, 2, 0],
                 x: [0, 1, -1, 1, 0]
               }}
               transition={{ duration: 0.2, repeat: Infinity }}
               className="relative z-20"
             >
                <div className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center">
                    <img 
                      src="/BDV.webp" 
                      alt="Erro no Motor" 
                      className="w-full h-full object-contain opacity-50 grayscale contrast-125"
                      referrerPolicy="no-referrer"
                    />
                </div>
             </motion.div>
             
             {/* Smoke Particles */}
             {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, y: 0, x: 0 }}
                  animate={{ 
                    opacity: [0, 0.4, 0], 
                    scale: [1, 2, 3],
                    y: -100 - (i * 20),
                    x: (i % 2 === 0 ? 20 : -20) + (Math.random() * 20 - 10)
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.4,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 w-8 h-8 bg-slate-400/20 rounded-full blur-xl z-10"
                />
             ))}

             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[120px] md:text-[180px] font-black text-white/5 select-none text-orange-500/10">
                   500
                </span>
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-widest">
            <AlertTriangle size={14} /> Erro de Sistema
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-tight">
            Motor <span className="text-orange-500">Pifou!</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
            Houve um problema interno e a van parou no acostamento. Nossa equipe já está com as ferramentas na mão para voltarmos à estrada!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-8 py-4 bg-orange-600 rounded-2xl text-white font-extrabold text-lg shadow-xl shadow-orange-900/20 hover:bg-orange-50 hover:text-orange-950 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Tentar Novamente
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
