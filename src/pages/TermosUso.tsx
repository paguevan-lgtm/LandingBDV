import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Bus,
  MapPin,
  CreditCard,
  UserCheck
} from 'lucide-react';

export default function TermosUso() {
  const sections = [
    {
      icon: <Bus className="text-brand-purple" />,
      title: "1. Aceitação dos Termos",
      content: "Ao utilizar os serviços da Bora de Van, você concorda integralmente com estes termos de uso. Nossos serviços destinam-se ao transporte de passageiros entre São Paulo e o Litoral Sul/Baixada Santista."
    },
    {
      icon: <Clock className="text-brand-pink" />,
      title: "2. Reservas e Cancelamentos",
      content: "As reservas devem ser feitas preferencialmente com antecedência. Cancelamentos realizados com menos de 2 horas de antecedência podem estar sujeitos a taxas ou restrições em agendamentos futuros."
    },
    {
      icon: <MapPin className="text-blue-400" />,
      title: "3. Embarque e Desembarque",
      content: "O passageiro deve estar presente no ponto de embarque com pelo menos 10 minutos de antecedência. Não nos responsabilizamos por atrasos causados por fatores externos como trânsito intenso ou condições climáticas."
    },
    {
      icon: <CreditCard className="text-green-400" />,
      title: "4. Pagamentos",
      content: "Os valores das passagens podem sofrer alterações sem aviso prévio. Aceitamos Pix, dinheiro e cartões. O pagamento deve ser confirmado antes ou no momento do embarque."
    },
    {
      icon: <UserCheck className="text-orange-400" />,
      title: "5. Conduta do Passageiro",
      content: "Reservamo-nos o direito de recusar o transporte de passageiros que apresentem comportamento inadequado, agressivo ou que coloquem em risco a segurança dos demais ocupantes e do motorista."
    },
    {
      icon: <ShieldCheck className="text-purple-400" />,
      title: "6. Bagagens",
      content: "Cada passageiro tem direito a uma mala de mão e uma mala média. Bagagens extras ou de grande porte devem ser informadas no ato da reserva e podem ter custo adicional."
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
              Termos de Uso
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
              <FileText size={24} className="text-brand-pink" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documento Legal</p>
              <p className="text-sm font-bold text-white">Versão 2.0</p>
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
        <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-6 mb-16">
          <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={32} className="text-brand-purple" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-2">Importante para sua viagem</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Estes termos visam garantir a melhor experiência e segurança para todos os passageiros. Em caso de dúvidas sobre qualquer ponto, entre em contato com nossa central de atendimento.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-6">Dúvidas sobre os termos?</p>
          <Link 
            to="/central-ajuda"
            className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all border border-slate-800"
          >
            Falar com Suporte
            <ShieldCheck size={20} className="text-brand-pink" />
          </Link>
        </div>
      </div>
    </div>
  );
}
