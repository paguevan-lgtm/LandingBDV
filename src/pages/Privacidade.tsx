import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  Mail,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function Privacidade() {
  const sections = [
    {
      icon: <Database className="text-brand-purple" />,
      title: "1. Coleta de Dados",
      content: "Coletamos apenas as informações necessárias para realizar sua reserva e garantir sua segurança, como nome, telefone, endereço de embarque e destino. Não coletamos dados sensíveis sem seu consentimento explícito."
    },
    {
      icon: <Lock className="text-brand-pink" />,
      title: "2. Segurança das Informações",
      content: "Seus dados são armazenados em servidores seguros e protegidos por criptografia. Somente pessoal autorizado tem acesso às informações necessárias para a prestação do serviço de transporte."
    },
    {
      icon: <Eye className="text-blue-400" />,
      title: "3. Uso dos Dados",
      content: "Utilizamos suas informações exclusivamente para: processar reservas, entrar em contato para confirmações, enviar atualizações sobre sua viagem e melhorar nossos serviços. Não vendemos seus dados para terceiros."
    },
    {
      icon: <UserCheck className="text-green-400" />,
      title: "4. Seus Direitos",
      content: "De acordo com a LGPD, você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais a qualquer momento. Para isso, basta entrar em contato com nossa central de atendimento."
    },
    {
      icon: <Mail className="text-orange-400" />,
      title: "5. Comunicações",
      content: "Podemos enviar mensagens via WhatsApp ou SMS para confirmar horários ou informar sobre alterações na sua viagem. Você pode optar por não receber comunicações de marketing a qualquer momento."
    },
    {
      icon: <ShieldCheck className="text-purple-400" />,
      title: "6. Compartilhamento",
      content: "Compartilhamos seus dados apenas com os motoristas responsáveis pela sua viagem e com autoridades competentes quando exigido por lei ou para garantir a segurança do transporte."
    }
  ];

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest mb-4 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Link>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Privacidade
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Protegendo seus dados com transparência</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
              <Lock size={24} className="text-brand-purple" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Segurança</p>
              <p className="text-sm font-bold text-white">LGPD Compliant</p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 gap-8 mb-16">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2.5rem] hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">{section.title}</h3>
                  <p className="text-slate-400 text-base leading-relaxed">{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Important Alert */}
        <div className="bg-brand-pink/10 border border-brand-pink/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-6 mb-16">
          <div className="w-16 h-16 bg-brand-pink/20 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={32} className="text-brand-pink" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-2">Sua privacidade é prioridade</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tratamos suas informações com o máximo respeito e cuidado. Se você tiver qualquer dúvida sobre como seus dados são processados, nossa equipe está à disposição para esclarecer.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-6">Dúvidas sobre privacidade?</p>
          <Link 
            to="/central-ajuda"
            className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all border border-slate-800"
          >
            Falar com Suporte
            <Clock size={20} className="text-brand-purple" />
          </Link>
        </div>
      </div>
    </div>
  );
}
