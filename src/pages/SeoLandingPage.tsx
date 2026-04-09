import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Clock, ShieldCheck, Star, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SeoLandingPageProps {
  destino: string;
  origem: string;
  title: string;
  description: string;
  h1: string;
  seoText: string;
  whatsappMessage: string;
}

export default function SeoLandingPage({
  destino,
  origem,
  title,
  description,
  h1,
  seoText,
  whatsappMessage
}: SeoLandingPageProps) {
  
  useEffect(() => {
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [title, description]);

  const handleWhatsApp = () => {
    const phone = '551334711830';
    const text = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden text-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md shadow-lg shadow-black/20 py-3 border-b border-slate-800">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center shadow-lg transform -rotate-6">
              <Bus className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-extrabold tracking-tight text-white">
              Bora de <span className="text-brand-pink">Van</span>
            </span>
          </Link>
          <button onClick={handleWhatsApp} className="bg-gradient-brand text-white px-6 py-2.5 rounded-full font-bold shadow-md shadow-brand-purple/20 hover:shadow-lg hover:shadow-brand-purple/40 hover:scale-105 transition-all">
            Agendar Agora
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-10 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-brand-purple rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-pink rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-1 bg-brand-purple/20 text-brand-pink rounded-full font-bold text-sm mb-6 uppercase tracking-wider border border-brand-purple/30">
              Transporte Rápido e Seguro
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white leading-[1.1] mb-6">
              {h1}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10">
              {seoText}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <button onClick={handleWhatsApp} className="w-full sm:w-auto bg-gradient-brand text-white px-8 py-4 rounded-2xl font-extrabold text-lg shadow-xl shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:scale-105 transition-all flex items-center justify-center gap-2">
                Agendar Agora <ChevronRight size={20} />
              </button>
              <button onClick={handleWhatsApp} className="w-full sm:w-auto bg-[#25D366] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg hover:bg-[#20ba5a] transition-all flex items-center justify-center gap-2">
                Falar no WhatsApp
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-4">
              Por que escolher nosso transporte para {destino}?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: <Clock className="text-purple-400" />, title: "Transporte rápido", desc: "Rotas otimizadas para você chegar ao seu destino no menor tempo possível." },
              { icon: <ShieldCheck className="text-pink-400" />, title: "Segurança", desc: "Veículos revisados constantemente e motoristas altamente capacitados." },
              { icon: <Star className="text-yellow-400" />, title: "Conforto", desc: "Vans modernas com ar-condicionado e poltronas confortáveis." },
              { icon: <Bus className="text-blue-400" />, title: "Saídas frequentes", desc: "Diversos horários disponíveis todos os dias para sua conveniência." },
              { icon: <CheckCircle2 className="text-green-400" />, title: "Motoristas experientes", desc: "Profissionais que conhecem o trajeto e garantem uma viagem tranquila." },
              { icon: <MapPin className="text-brand-pink" />, title: "Ponto a ponto", desc: `Saídas convenientes de ${origem} direto para ${destino}.` },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule & Info Section */}
      <section className="py-16 bg-slate-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-extrabold text-white mb-8 text-center">
                Informações da Viagem
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="text-brand-pink" size={24} />
                    <h3 className="text-xl font-bold text-white">Local de Saída</h3>
                  </div>
                  <p className="text-slate-300">
                    Saídas diárias de <strong className="text-white">{origem}</strong>. 
                    Entre em contato para confirmar o ponto exato de embarque mais próximo de você.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="text-brand-purple" size={24} />
                    <h3 className="text-xl font-bold text-white">Horários</h3>
                  </div>
                  <p className="text-slate-300">
                    Temos saídas frequentes ao longo do dia. 
                    <br/><br/>
                    <span className="text-brand-pink font-bold">Consulte a disponibilidade imediata pelo WhatsApp!</span>
                  </p>
                </div>
              </div>

              <div className="mt-10 text-center">
                <button onClick={handleWhatsApp} className="w-full md:w-auto bg-gradient-brand text-white px-10 py-4 rounded-2xl font-extrabold text-lg shadow-xl shadow-brand-purple/20 hover:scale-105 transition-all">
                  Reservar Vaga Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-10 border-t border-slate-900 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bus className="text-brand-pink w-6 h-6" />
            <span className="text-xl font-display font-extrabold tracking-tight">
              Bora de <span className="text-brand-pink">Van</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Bora de Van. Transporte seguro e confortável para {destino}.
          </p>
        </div>
      </footer>
    </div>
  );
}
