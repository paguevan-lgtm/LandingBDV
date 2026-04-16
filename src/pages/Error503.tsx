import React from 'react';
import { motion } from 'motion/react';
import { Settings, Wrench, Clock, Hammer, Construction } from 'lucide-react';

export default function Error503() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl w-full">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-12"
        >
          {/* Construction Van Graphic */}
          <div className="relative inline-block">
             <motion.div
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-20"
             >
                <div className="w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center relative">
                    {/* The Van */}
                    <img 
                      src="/BDV.png" 
                      alt="Van em Manutenção" 
                      className="w-full h-full object-contain filter invert opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Jack Stands / Lift effect */}
                    <div className="absolute -bottom-4 left-1/4 w-8 h-8 border-b-4 border-slate-700" />
                    <div className="absolute -bottom-4 right-1/4 w-8 h-8 border-b-4 border-slate-700" />
                </div>
             </motion.div>

             {/* Rotating Gears */}
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
               className="absolute -top-10 -right-10 text-yellow-500/20"
             >
                <Settings size={120} />
             </motion.div>
             <motion.div 
               animate={{ rotate: -360 }}
               transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
               className="absolute -bottom-10 -left-10 text-slate-800"
             >
                <Settings size={160} />
             </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-center gap-4">
             <div className="h-[2px] w-12 bg-yellow-500/50" />
             <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-[0.2em] text-sm">
                <Construction size={18} /> Manutenção
             </div>
             <div className="h-[2px] w-12 bg-yellow-500/50" />
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white leading-tight">
            Van no <span className="text-yellow-500">Mecânico!</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
            Estamos fazendo uma revisão completa para garantir que sua próxima viagem seja ainda melhor. Estaremos de volta em alguns minutos!
          </p>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] inline-flex flex-col items-center gap-4 shadow-2xl">
             <div className="flex items-center gap-3 text-slate-400 font-bold">
                <Clock size={20} className="text-yellow-500" />
                <span>TEMPO ESTIMADO</span>
             </div>
             <div className="flex gap-4">
                <div className="text-center">
                   <p className="text-3xl font-black text-white">15</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Minutos</p>
                </div>
                <div className="text-3xl font-black text-slate-700">:</div>
                <div className="text-center">
                   <p className="text-3xl font-black text-white">45</p>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Segundos</p>
                </div>
             </div>
          </div>

          <div className="pt-8">
             <p className="text-slate-500 font-medium">Acompanhe as novidades no nosso Instagram:</p>
             <a 
               href="https://www.instagram.com/bora_devan" 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-block mt-4 text-brand-pink font-bold text-lg hover:underline underline-offset-8 transition-all"
             >
               @bora_devan
             </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
