import { motion } from 'motion/react';
import { Instagram, MessageCircle, Phone, ArrowLeft, Bus, MapPin, Navigation } from 'lucide-react';

export default function Contato() {
  const contacts = [
    {
      title: "Viajar para Baixada",
      subtitle: "Saindo de São Paulo (Jabaquara)",
      phone: "11956733789",
      icon: <Navigation className="text-blue-400" />,
      color: "from-blue-600 to-blue-400"
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

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand-pink/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-pink/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 flex flex-col items-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-purple/20 rotate-3">
            <Bus size={48} className="text-white -rotate-3" />
          </div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2">Bora de Van</h1>
          <p className="text-slate-400 font-medium">Escolha o canal de atendimento ideal para você</p>
        </motion.div>

        {/* Links Grid */}
        <div className="w-full space-y-4">
          {contacts.map((contact, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleWhatsApp(contact.phone)}
              className="group relative w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800/80 hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-95 text-left overflow-hidden"
            >
              <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {contact.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-tight">{contact.title}</h3>
                <p className="text-slate-400 text-sm">{contact.subtitle}</p>
              </div>
              <MessageCircle className="text-slate-600 group-hover:text-green-400 transition-colors" size={24} />
              
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
            transition={{ delay: contacts.length * 0.1 }}
            className="group relative w-full bg-gradient-to-r from-purple-600 to-pink-600 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-95 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Instagram size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight">Siga no Instagram</h3>
              <p className="text-white/70 text-sm">@bora_devan</p>
            </div>
            <ArrowLeft className="text-white/40 group-hover:text-white transition-colors rotate-180" size={24} />
          </motion.a>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Voltar para o site
          </a>
          <p className="mt-8 text-slate-600 text-xs font-medium">
            © {new Date().getFullYear()} Bora de Van. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
