import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  Clock, 
  ShieldCheck,
  Search,
  Bus,
  MapPin,
  CreditCard,
  AlertCircle,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function CentralAjuda() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { icon: <Bus className="text-brand-purple" />, title: "Reservas", description: "Como agendar, alterar ou cancelar sua viagem." },
    { icon: <CreditCard className="text-brand-pink" />, title: "Pagamentos", description: "Métodos aceitos e comprovantes." },
    { icon: <MapPin className="text-blue-400" />, title: "Embarque", description: "Localização dos pontos e horários." },
    { icon: <ShieldCheck className="text-green-400" />, title: "Segurança", description: "Protocolos e seguro passageiro." },
  ];

  const faqs = [
    { q: "Onde é o ponto de encontro no Jabaquara?", a: "Nosso ponto principal é no Pão de Açúcar do Jabaquara, ao lado do metrô. Procure pelas vans identificadas ou pergunte por 'Bora de Van'." },
    { q: "Posso levar malas grandes?", a: "Sim, porém pedimos que informe no momento da reserva para garantirmos espaço no bagageiro. Malas pequenas e mochilas são liberadas." },
    { q: "Quais os horários de saída?", a: "As vans saem diariamente das 06:00 até as 21:00. O intervalo depende da demanda, mas geralmente temos saídas a cada 40-60 minutos." },
    { q: "Como funciona o pagamento?", a: "O pagamento pode ser feito via Pix antecipado ou diretamente com o motorista em dinheiro ou cartão (crédito/débito)." },
    { q: "Como faço para cancelar uma reserva?", a: "Para cancelar, entre em contato com a central pelo WhatsApp com pelo menos 2 horas de antecedência." },
    { q: "As vans possuem ar-condicionado?", a: "Sim, todas as nossas vans são equipadas com ar-condicionado para o seu conforto." },
    { q: "Vocês fazem transporte para o aeroporto?", a: "Sim, realizamos trajetos que passam próximos aos principais pontos de conexão, consulte a central para detalhes." },
  ];

  const filteredCategories = categories.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand-pink/30 pb-20 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-pink/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest mb-4 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Link>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Central de Ajuda
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Como podemos ajudar você hoje?</p>
          </div>
          <div className="bg-brand-purple/20 p-4 rounded-3xl border border-brand-purple/30 flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-purple rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <HelpCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">Suporte Jabaquara</p>
              <p className="text-sm font-bold text-white">06:00 - 21:00</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-16 max-w-2xl mx-auto group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-purple transition-colors pointer-events-none">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Como podemos ajudar?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl py-4 pl-14 pr-12 text-white text-base focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple/50 outline-none transition-all placeholder:text-slate-500 shadow-lg"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            {filteredCategories.map((cat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{cat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{cat.description}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-extrabold text-white mb-8 flex items-center gap-3">
            <AlertCircle className="text-brand-pink" />
            Dúvidas Frequentes
          </h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 hover:bg-slate-900/50 transition-all"
              >
                <h4 className="font-bold text-white mb-2 flex items-start gap-3">
                  <span className="text-brand-purple">Q:</span>
                  {faq.q}
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed pl-7">
                  {faq.a}
                </p>
              </motion.div>
            )) : (
              <p className="text-slate-500 text-center py-12">Nenhum resultado encontrado para sua busca.</p>
            )}
          </div>
        </div>

        {/* Contact CTA - Jabaquara Number Focus */}
        <div className="bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 border border-white/10 rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 blur-[80px] -mr-32 -mt-32" />
          
          <h2 className="text-3xl font-display font-extrabold text-white mb-4">Ainda precisa de ajuda?</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto">
            Nossa equipe de suporte está pronta para atender você. Fale diretamente com a central do Jabaquara.
          </p>

          <div className="flex justify-center">
            <a 
              href="https://wa.me/5511956733789"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 px-8 rounded-xl font-bold text-base shadow-lg shadow-green-500/10 transition-all hover:scale-[1.02] active:scale-95 min-h-[64px] w-full md:w-auto md:min-w-[280px]"
            >
              <MessageCircle size={20} className="flex-shrink-0" />
              <span className="text-center">WhatsApp Jabaquara</span>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-brand-pink" />
                <span className="text-xs font-bold uppercase tracking-widest">Jabaquara: 06:00 - 21:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-brand-purple" />
                <span className="text-xs font-bold uppercase tracking-widest">Litoral: 06:00 - 20:00</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-purple" />
              <span className="text-xs font-bold uppercase tracking-widest">Suporte Verificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
