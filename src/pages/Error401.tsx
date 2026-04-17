import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Home, ArrowLeft, Key } from 'lucide-react';

export default function Error401() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-brand-pink/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                rotateY: [0, 180, 360],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center"
            >
              <div className="p-8 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-[3rem] shadow-2xl relative">
                <Lock size={80} className="text-white drop-shadow-lg" />
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white text-brand-pink p-3 rounded-2xl shadow-xl"
                >
                  <Key size={30} strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[140px] md:text-[220px] font-black tracking-tighter text-white/[0.03] italic">
                 401
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white leading-tight mb-4 italic">
              ACESSO <span className="text-gradient-brand">RESTRITO!</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
              O motorista precisa ver sua passagem! Por favor, faça login para continuar sua viagem com a gente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link 
              to="/painel/login" 
              className="w-full sm:w-auto px-10 py-5 bg-gradient-brand rounded-[2rem] text-white font-black text-lg shadow-2xl shadow-brand-purple/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              FAZER LOGIN
            </Link>
            <Link 
              to="/" 
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-slate-800 rounded-[2rem] text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <Home size={22} />
              VOLTAR AO INÍCIO
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
