import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, MapPinOff, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-pink/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 max-w-lg w-full">
        {/* Animated Van Area */}
        <div className="relative mb-12">
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: "backOut" }}
            className="relative"
          >
             <motion.div
               animate={{ 
                 y: [0, -8, 0],
                 rotate: [2, -2, 2],
               }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-20"
             >
                <div className="w-56 h-56 md:w-72 md:h-72 mx-auto flex items-center justify-center relative">
                    <img 
                      src="/BDV.png" 
                      alt="Van Perdida" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(236,72,153,0.3)] transform -scale-x-100"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Shadow underneath */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-4 bg-black/40 blur-xl rounded-full" />
                </div>
             </motion.div>
             
             {/* Large 404 Background */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[140px] md:text-[220px] font-black tracking-tighter text-white/[0.03] italic">
                   404
                </span>
             </div>
          </motion.div>

          {/* Floating Warning Icons */}
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6] 
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -top-10 right-4 text-brand-pink drop-shadow-lg"
          >
            <MapPinOff size={48} />
          </motion.div>
          
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-8 left-4 text-brand-purple opacity-20"
          >
            <Compass size={80} />
          </motion.div>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white leading-tight mb-4 italic">
              VIXI! <span className="text-gradient-brand">SAÍMOS DA ROTA?</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
              Parece que o GPS se perdeu ou essa página pegou um atalho que não existe. O motorista já está recalculando!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto px-10 py-5 bg-gradient-brand rounded-[2rem] text-white font-black text-lg shadow-2xl shadow-brand-purple/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Home size={22} strokeWidth={2.5} />
              VOLTAR PARA A BASE
            </Link>
            <Link 
              to="/central-ajuda" 
              className="w-full sm:w-auto px-10 py-5 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-[2rem] text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <ArrowLeft size={22} />
              ME AJUDA AÍ
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative Road Line with Animation */}
      <div className="absolute bottom-16 left-0 w-full h-3 bg-slate-900/50 backdrop-blur-sm overflow-hidden flex items-center">
         <div className="flex gap-20 w-[200%] animate-road">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-24 h-1 bg-yellow-500/20 rounded-full" />
            ))}
         </div>
      </div>

      <style>{`
        @keyframes road-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-road {
          animation: road-scroll 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
