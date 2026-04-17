import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Settings, Home, HardDrive, AlertOctagon } from 'lucide-react';

export default function Error500() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <div className="w-56 h-56 md:w-72 md:h-72 mx-auto bg-slate-900 border-4 border-slate-800 rounded-[3rem] p-4 flex items-center justify-center relative overflow-hidden">
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 className="text-orange-500 opacity-20"
               >
                  <Settings size={180} />
               </motion.div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                     <AlertOctagon size={60} className="text-orange-500 animate-pulse" />
                     <span className="text-white font-black text-2xl">PANE GERAL</span>
                  </div>
               </div>
            </div>
            
            <motion.div
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 0.2, repeat: Infinity }}
              className="absolute -bottom-4 -right-4 bg-orange-600 text-white p-4 rounded-2xl shadow-xl border-4 border-slate-950"
            >
              <HardDrive size={32} />
            </motion.div>
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
              MOTOR <span className="text-orange-500">FUNDIU!</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
              O motor da nossa van teve um problema técnico inesperado. Nossos mecânicos já estão trabalhando no conserto.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg shadow-2xl shadow-orange-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 rounded-[2rem]"
            >
              TENTAR NOVAMENTE
            </button>
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
