import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  MessageCircle, 
  ArrowLeft, 
  Bus, 
  MapPin, 
  Navigation, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Share2,
  CheckCircle2,
  Star,
  Phone,
  UserPlus,
  ChevronDown,
  HelpCircle,
  Wifi,
  Wind,
  Tv,
  Quote
} from 'lucide-react';

export default function Contato() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const contacts = [
    {
      title: "Viajar para Baixada",
      subtitle: "Saindo de São Paulo (Jabaquara)",
      phone: "11956733789",
      icon: <Navigation className="text-blue-400" />,
      color: "from-blue-600 to-blue-400",
      badge: "Mais Rápido"
    },
    {
      title: "Subir de Praia Grande",
      subtitle: "Para São Paulo (Jabaquara)",
      phone: "1334711830",
      icon: <MapPin className="text-green-400" />,
      color: "from-green-600 to-green-400"
    },
    {
      title: "Subir de Mongaguá e Itanhaém",
      subtitle: "Para São Paulo (Jabaquara)",
      phone: "13981244669",
      icon: <MapPin className="text-orange-400" />,
      color: "from-orange-600 to-orange-400"
    },
    {
      title: "Subir de Santos, SV, Cubatão, Guarujá",
      subtitle: "Para São Paulo (Jabaquara)",
      phone: "1334711830",
      icon: <MapPin className="text-purple-400" />,
      color: "from-purple-600 to-purple-400"
    }
  ];

  const faqs = [
    {
      q: "Onde é o ponto de encontro em SP?",
      a: "Nosso ponto principal é no Pão de Açúcar do Jabaquara, localizado ao lado do metrô."
    },
    {
      q: "Quais os horários de saída?",
      a: "As vans saem diariamente das 06:00 até as 21:00, com intervalos regulares."
    },
    {
      q: "Como faço o pagamento?",
      a: "Aceitamos Pix, Cartão de Crédito e Débito diretamente com o motorista ou pelo site."
    }
  ];

  const testimonials = [
    { name: "Ricardo S.", text: "Melhor van da região, pontual e muito confortável.", rating: 5 },
    { name: "Ana Paula", text: "Sempre viajo com eles, motoristas educados e seguros.", rating: 5 },
    { name: "Marcos V.", text: "O ar condicionado gela de verdade! Recomendo.", rating: 5 }
  ];

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleCall = () => {
    window.open('tel:1334711830', '_self');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Bora de Van - Contatos',
        text: 'Confira os canais de atendimento da Bora de Van!',
        url: window.location.href,
      });
    }
  };

  const handleSaveContact = () => {
    const vcard = "BEGIN:VCARD\nVERSION:3.0\nFN:Bora de Van\nTEL;TYPE=CELL:1334711830\nURL:https://boradevan.com.br\nEND:VCARD";
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "BoraDeVan.vcf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand-pink/30 pb-20 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-pink/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 flex flex-col items-center">
        {/* Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Atendimento Online</span>
        </motion.div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-10"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-brand rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-purple/30 rotate-3 group">
              <Bus size={48} className="text-white -rotate-3 transition-transform group-hover:scale-110" />
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="absolute -top-2 -right-2 bg-brand-pink p-2 rounded-xl shadow-lg"
            >
              <Star size={16} className="text-white fill-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Bora de Van</h1>
          <p className="text-slate-400 font-medium max-w-[280px] mx-auto">Sua conexão segura entre São Paulo e o Litoral</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCall}
            className="flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-800 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
          >
            <Phone size={18} className="text-brand-purple" />
            Ligar Agora
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveContact}
            className="flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-800 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
          >
            <UserPlus size={18} className="text-brand-pink" />
            Salvar Contato
          </motion.button>
        </div>

        {/* Bento Grid Info */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-3xl relative overflow-hidden group"
          >
            <div className="w-8 h-8 bg-brand-purple/20 rounded-lg flex items-center justify-center mb-3">
              <Clock size={18} className="text-brand-purple" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Horários</h4>
            <p className="text-sm font-bold text-white">06:00 às 21:00</p>
            <p className="text-[10px] text-slate-500 mt-1">Todos os dias</p>
            <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock size={64} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-3xl relative overflow-hidden group"
          >
            <div className="w-8 h-8 bg-brand-pink/20 rounded-lg flex items-center justify-center mb-3">
              <ShieldCheck size={18} className="text-brand-pink" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Segurança</h4>
            <p className="text-sm font-bold text-white">Vans Revisadas</p>
            <p className="text-[10px] text-slate-500 mt-1">Seguro Passageiro</p>
            <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={64} />
            </div>
          </motion.div>
        </div>

        {/* Fleet Features */}
        <div className="w-full mb-8">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-3xl flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <Wind size={20} className="text-blue-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Ar Cond.</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col items-center gap-1">
              <Wifi size={20} className="text-green-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Wi-Fi Grátis</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col items-center gap-1">
              <Tv size={20} className="text-purple-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">TV/DVD</span>
            </div>
          </div>
        </div>

        {/* Main Departure Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-md border border-slate-800 p-5 rounded-[2rem] mb-8 flex items-center justify-between group cursor-pointer hover:border-brand-pink/30 transition-all shadow-xl"
          onClick={() => window.open('https://maps.app.goo.gl/YourGoogleMapsLink', '_blank')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-brand-pink/50 transition-colors">
              <MapPin size={24} className="text-brand-pink" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-brand-pink transition-colors">Pão de Açúcar Jabaquara</h3>
              <p className="text-xs text-slate-500">Ponto principal de embarque em SP</p>
            </div>
          </div>
          <ExternalLink size={18} className="text-slate-600 group-hover:text-white transition-colors" />
        </motion.div>

        {/* Links Grid */}
        <div className="w-full space-y-4 mb-12">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Canais de Atendimento</h3>
            <button onClick={handleShare} className="text-slate-500 hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
          </div>

          {contacts.map((contact, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1) }}
              onClick={() => handleWhatsApp(contact.phone)}
              className="group relative w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-[1.5rem] flex items-center gap-4 hover:bg-slate-800/80 hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-95 text-left overflow-hidden shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform relative`}>
                {contact.icon}
                {contact.badge && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg leading-tight">{contact.title}</h3>
                  {contact.badge && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase">{contact.badge}</span>}
                </div>
                <p className="text-slate-400 text-sm">{contact.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <MessageCircle className="text-slate-600 group-hover:text-green-400 transition-colors" size={24} />
                <span className="text-[9px] text-slate-600 font-bold group-hover:text-slate-400">WHATSAPP</span>
              </div>
              
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-r ${contact.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </motion.button>
          ))}

          {/* Instagram */}
          <motion.a
            href="https://www.instagram.com/bora_devan?igsh=MXMxeTMxa2FwdnVteQ=="
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="group relative w-full bg-gradient-to-r from-purple-600 to-pink-600 p-5 rounded-[1.5rem] flex items-center gap-4 hover:shadow-lg hover:shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-95 text-left shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Instagram size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight text-white">Siga no Instagram</h3>
              <p className="text-white/70 text-sm">Acompanhe nossas viagens diárias</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ArrowLeft className="text-white/40 group-hover:text-white transition-colors rotate-180" size={24} />
              <span className="text-[9px] text-white/40 font-bold group-hover:text-white/60">@BORA_DEVAN</span>
            </div>
          </motion.a>
        </div>

        {/* Testimonials */}
        <div className="w-full mb-12">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
            <Quote size={14} />
            O que dizem nossos passageiros
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
            {testimonials.map((t, i) => (
              <div key={i} className="min-w-[260px] bg-slate-900/40 border border-slate-800 p-5 rounded-3xl snap-center">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
                </div>
                <p className="text-xs text-slate-300 italic mb-4">"{t.text}"</p>
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">{t.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="w-full mb-12">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Como Funciona</h3>
          <div className="space-y-3">
            {[
              { icon: <CheckCircle2 size={16} />, text: "Escolha seu destino e horário" },
              { icon: <MessageCircle size={16} />, text: "Fale com o atendente no WhatsApp" },
              { icon: <Bus size={16} />, text: "Embarque com conforto e segurança" }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + (i * 0.1) }}
                className="flex items-center gap-3 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50"
              >
                <div className="text-brand-pink">{step.icon}</div>
                <span className="text-sm font-medium text-slate-300">{step.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full mb-12">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
            <HelpCircle size={14} />
            Dúvidas Frequentes
          </h3>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-200">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full flex items-center justify-center gap-8 py-8 border-y border-slate-900/50 mb-12"
        >
          <div className="text-center">
            <p className="text-2xl font-extrabold text-white">10k+</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Viagens</p>
          </div>
          <div className="w-px h-8 bg-slate-900" />
          <div className="text-center">
            <p className="text-2xl font-extrabold text-white">4.9</p>
            <div className="flex items-center justify-center gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} size={8} className="text-yellow-500 fill-yellow-500" />)}
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Avaliação</p>
          </div>
          <div className="w-px h-8 bg-slate-900" />
          <div className="text-center">
            <p className="text-2xl font-extrabold text-white">24/7</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Suporte</p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center"
        >
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o site
          </a>
          
          <div className="flex items-center justify-center gap-2 text-slate-600 mb-4">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Empresa Registrada e Segura</span>
          </div>
          
          <p className="text-slate-700 text-[9px] font-bold uppercase tracking-tighter">
            © {new Date().getFullYear()} Bora de Van • CNPJ: 00.000.000/0001-00
          </p>
        </motion.div>
      </div>
    </div>
  );
}
