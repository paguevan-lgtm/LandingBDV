import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, Home, ArrowLeft, Ban } from 'lucide-react';

export default function Error403() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center p-8 bg-red-500/10 border-4 border-red-500/20 rounded-full"
            >
              <ShieldAlert size={100} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-4 border-red-500/40 rounded-full"
              />
            </motion.div>
            
            <div className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-2xl shadow-xl animate-bounce">
              <Ban size={30} strokeWidth={3} />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[140px] md:text-[220px] font-black tracking-tighter text-red-500/5 italic">
                 403
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
              ZONA <span className="text-red-500">PROIBIDA!</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
              Sua passsagem não dá acesso a essa cabine. Por favor, use as áreas autorizadas do veículo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-2xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 rounded-[2rem]"
            >
              <Home size={22} />
              VOLTAR AO INÍCIO
            </Link>
            <Link 
              to="/contato" 
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-slate-800 rounded-[2rem] text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              SUGESTÕES OU DÚVIDAS
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
