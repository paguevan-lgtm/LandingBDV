import React from 'react';
import { motion } from 'motion/react';
import { Construction, Clock, ShieldCheck, Mail, MessageCircle } from 'lucide-react';

export default function Error503() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <div className="relative inline-block">
             <motion.div
               animate={{ 
                 y: [0, -10, 0],
                 rotate: [1, -1, 1],
               }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-20"
             >
                <div className="w-56 h-56 md:w-72 md:h-72 mx-auto flex items-center justify-center relative">
                    {/* Van in Garage Image or Icon */}
                    <div className="relative p-10 bg-slate-900 border-4 border-slate-800 rounded-[3rem] shadow-2xl relative">
                       <img 
                         src="/BDV.png" 
                         alt="Van em Manutenção" 
                         className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(59,130,246,0.3)] opacity-40 grayscale"
                         referrerPolicy="no-referrer"
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="text-white"
                          >
                             <Construction size={100} strokeWidth={1} className="opacity-80" />
                          </motion.div>
                       </div>
                    </div>
                </div>
             </motion.div>
             
             {/* 503 Floating Pill */}
             <div className="absolute -top-6 -right-6 bg-blue-600 text-white px-4 py-2 rounded-2xl font-black text-xl shadow-xl z-30">
                503
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-10"
        >
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white leading-tight mb-4 italic">
              NA <span className="text-blue-500">GARAGEM</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed font-medium">
              Estamos fazendo uma revisão completa no sistema para garantir que sua próxima viagem seja ainda mais incrível! 
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
             <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl text-left">
                <Clock className="text-blue-500 mb-3" size={24} />
                <h4 className="text-white font-bold mb-1">Volta Logo</h4>
                <p className="text-xs text-slate-500">Nossa equipe é rápida! Voltaremos ao ar em alguns minutos com melhorias.</p>
             </div>
             <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl text-left">
                <ShieldCheck className="text-blue-500 mb-3" size={24} />
                <h4 className="text-white font-bold mb-1">Sua Segurança</h4>
                <p className="text-xs text-slate-500">Estamos reforçando nossos motores e blindando nosso sistema de reservas.</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <button 
              onClick={() => window.open('https://wa.me/5513997744720', '_blank')}
              className="w-full sm:w-auto px-10 py-5 bg-green-600 hover:bg-green-500 text-white font-black text-lg shadow-2xl shadow-green-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 rounded-[2rem]"
            >
              <MessageCircle size={22} />
              NOSSO WHATSAPP
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 border border-slate-800 rounded-[2rem] text-slate-300 font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              ATUALIZAR PÁGINA
            </button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Traffic Cones (CSS based or simple circles) */}
      <div className="fixed bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-20" />
    </div>
  );
}
