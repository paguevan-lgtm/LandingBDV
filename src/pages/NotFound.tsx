import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, MapPinOff, Construction, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-pink/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-lg w-full">
        {/* Animated Van Area */}
        <motion.div 
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Lost Van Text/Graphic */}
          <div className="relative inline-block">
             <motion.div
               animate={{ 
                 y: [0, -10, 0],
                 rotate: [0, -1, 1, 0]
               }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-20"
             >
                <div className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center">
                    <img 
                      src="/BDV.png" 
                      alt="Van Perdida" 
                      className="w-full h-full object-contain grayscale opacity-60 filter blur-[1px]"
                      referrerPolicy="no-referrer"
                    />
                </div>
             </motion.div>
             
             {/* 404 Numbers */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[120px] md:text-[180px] font-black text-white/5 select-none">
                   404
                </span>
             </div>
          </div>

          {/* Floating Icons */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-4 right-10 text-brand-pink"
          >
            <MapPinOff size={40} />
          </motion.div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-10 text-brand-purple opacity-30"
          >
            <Compass size={60} />
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white leading-tight">
            Vixi! Pegamos a <span className="text-gradient-brand">rua errada.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
            Parece que o GPS se perdeu ou essa página foi para o conserto. Que tal voltarmos para a rota principal?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              to="/" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-brand rounded-2xl text-white font-extrabold text-lg shadow-xl shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Voltar para o Início
            </Link>
            <Link 
              to="/contato" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Central de Ajuda
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative Road Line */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-900 overflow-hidden">
         <motion.div 
           animate={{ x: [-100, 1000] }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           className="w-20 h-full bg-yellow-500/30"
         />
      </div>
    </div>
  );
}
