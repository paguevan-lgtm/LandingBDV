import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import MotoristaApp from './motorista/MotoristaApp';
import Contato from './pages/Contato';
import CentralAjuda from './pages/CentralAjuda';
import TermosUso from './pages/TermosUso';
import Privacidade from './pages/Privacidade';
import SeoLandingPage from './pages/SeoLandingPage';
import NotFound from './pages/NotFound';
import Error401 from './pages/Error401';
import Error403 from './pages/Error403';
import Error500 from './pages/Error500';
import Error503 from './pages/Error503';
import { getDeviceFingerprint, setPoisonPill } from './lib/security';
import { 
  MapPin, 
  Calendar, 
  Users, 
  ChevronRight, 
  Menu, 
  X, 
  Star, 
  ShieldCheck, 
  Clock, 
  Mail,
  Map as MapIcon,
  Bus,
  ArrowRight,
  CheckCircle2,
  ArrowLeftRight,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomSelect } from './components/CustomSelect';
import { CustomDatePicker } from './components/CustomDatePicker';
import { db } from './firebase';

const BAIRROS = [ "Forte / Canto do Forte", "Tude Bastos / Chico de Paula", "Boqueirao", "Guilhermina", "Aviação", "Tupi", "Tupiry", "Ocian", "Gloria", "Vila Antartica", "Vila Sonia", "Quietude", "Mirim", "Anhanguera", "Maracana", "Ribeiropolis", "Esmeralda", "Samambaia", "Melvi", "Caiçara", "Imperador", "Real", "Princesa", "Florida", "Cidade das Crianças", "Solemar" ];

const BAIRROS_MIP = [
    "Agenor de Campos", "Balneário Agenor de Campos", "Regina Maria", "Balneário Regina Maria", "Jardim Primavera", "Parque Verde Mar",
    "Balneário Umuarama", "Umuarama", "Balneário Triesse", "Balneário Samas", "Balneário Marinho", "Jardim Santana", "Jardim Leonor",
    "Santa Eugênia", "Balneário Santa Eugênia", "Jussara", "Balneário Jussara", "Flórida Mirim", "Balneário Flórida Mirim", "Parque Marinho",
    "Jardim Marina", "Jardim Samoa", "Jardim Caiahu", "Jardim Guanabara", "Jardim Aguapeú", "Aguapeú", "Itaguaí", "Balneário Itaguaí",
    "Jardim Itaguaí", "Jardim Marabá", "Jardim Luciana", "Jardim Maria Luiza", "Jardim Cascata", "Jardim Silveira", "Plataforma",
    "Balneário Plataforma", "Centro", "Vila Atlântica", "Vila São Paulo", "Vila Seabra", "Vila Arens", "Vila Anhanguera", "Vila Nova",
    "Vila São José", "Vera Cruz", "Vila Vera Cruz", "Balneário Vera Cruz", "Oceanópolis", "Vila Oceanópolis", "Jardim Oceanópolis",
    "Pedreira", "Jardim Santana II", "Chácara São João", "Chácara São José", "Conjunto Mazzeo", "CDHU Vila Atlântica", "Jardim Praia Grande",
    "Jardim Itapoan", "Copacabana Paulista", "Balneário Verde Mar", "Balneário Barigui", "Estância Balneária Barigui", "Balneário Mar e Sol",
    "Balneário Europa", "Balneário Palmeiras", "Itaóca", "Balneário Itaóca", "Balneário Anchieta", "Balneário América", "Balneário Cascais"
];

const destinationOptions = [
  { value: 'jabaquara', label: 'Jabaquara' },
  { value: 'praia_grande', label: 'Praia Grande' },
  { value: 'mongagua', label: 'Mongaguá' },
  { value: 'itanhaem', label: 'Itanhaém' },
  { value: 'cubatao', label: 'Cubatão' },
  { value: 'sao_vicente', label: 'São Vicente' },
  { value: 'santos', label: 'Santos' },
  { value: 'guaruja', label: 'Guarujá' },
];

const originOptions = [
  { value: 'praia_grande', label: 'Praia Grande' },
  { value: 'mongagua', label: 'Mongaguá' },
  { value: 'itanhaem', label: 'Itanhaém' },
  { value: 'cubatao', label: 'Cubatão' },
  { value: 'sao_vicente', label: 'São Vicente' },
  { value: 'santos', label: 'Santos' },
  { value: 'guaruja', label: 'Guarujá' },
];

const tripTypeOptions = [
  { value: 'ida_volta', label: 'Ida e Volta' },
  { value: 'so_ida', label: 'Somente Ida' },
  { value: 'so_volta', label: 'Somente Volta' },
];

const allDestinationsList = [
  { value: 'praia_grande', name: "Praia Grande", price: "R$ 45", img: "https://images.unsplash.com/photo-1596423735880-5c6fa7f0170a?auto=format&fit=crop&w=800&q=80" },
  { value: 'mongagua', name: "Mongaguá", price: "R$ 50", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { value: 'itanhaem', name: "Itanhaém", price: "R$ 55", img: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80" },
  { value: 'cubatao', name: "Cubatão", price: "R$ 50", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80" },
  { value: 'sao_vicente', name: "São Vicente", price: "R$ 50", img: "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?auto=format&fit=crop&w=800&q=80" },
  { value: 'santos', name: "Santos", price: "R$ 50", img: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?auto=format&fit=crop&w=800&q=80" },
  { value: 'guaruja', name: "Guarujá", price: "R$ 50", img: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=800&q=80" },
];

const generateTimeSlots = (selectedDate: Date | null) => {
  if (!selectedDate) return [];
  
  const isSunday = selectedDate.getDay() === 0;
  
  const slots = [];
  let currentHour = 7;
  let currentMinute = 0;

  while (currentHour < 20 || (currentHour === 20 && currentMinute === 0)) {
    const startHourStr = currentHour.toString().padStart(2, '0');
    const startMinStr = currentMinute.toString().padStart(2, '0');
    
    let endHour = currentHour;
    let endMinute = currentMinute + 45;
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    const endHourStr = endHour.toString().padStart(2, '0');
    const endMinStr = endMinute.toString().padStart(2, '0');

    slots.push({
      startHour: currentHour,
      startMinute: currentMinute,
      label: `${startHourStr}:${startMinStr} - ${endHourStr}:${endMinStr}`,
      value: `${startHourStr}:${startMinStr}-${endHourStr}:${endMinStr}`
    });

    currentMinute += 30;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
  }

  if (isSunday) {
    slots.push({
      startHour: 20,
      startMinute: 30,
      label: `20:30 - 21:15`,
      value: `20:30-21:15`
    });
  }

  return slots;
};

const isSlotPast = (selectedDate: Date, slotHour: number, slotMinute: number) => {
  const now = new Date();
  const brasiliaTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const brasiliaNow = new Date(brasiliaTimeStr);

  if (
    selectedDate.getFullYear() === brasiliaNow.getFullYear() &&
    selectedDate.getMonth() === brasiliaNow.getMonth() &&
    selectedDate.getDate() === brasiliaNow.getDate()
  ) {
    if (brasiliaNow.getHours() > slotHour) return true;
    if (brasiliaNow.getHours() === slotHour && brasiliaNow.getMinutes() >= slotMinute) return true;
  } else {
     const todayMidnight = new Date(brasiliaNow.getFullYear(), brasiliaNow.getMonth(), brasiliaNow.getDate());
     if (selectedDate < todayMidnight) return true;
  }
  
  return false;
};

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isAllDestinationsModalOpen, setIsAllDestinationsModalOpen] = useState(false);
  const [beachInfoModal, setBeachInfoModal] = useState<{isOpen: boolean, destValue: string}>({isOpen: false, destValue: ''});
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [autoSchedulingEnabled, setAutoSchedulingEnabled] = useState<any>({ Pg: true, Mip: true, Sv: true });

  // Form State
  const [tripType, setTripType] = useState('so_ida');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('jabaquara');
  const [date, setDate] = useState<Date | null>(null);
  const [passengers, setPassengers] = useState('1');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [widgetErrors, setWidgetErrors] = useState<string[]>([]);

  // Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPhoneConfirmationModalOpen, setIsPhoneConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [confirmedPhone, setConfirmedPhone] = useState('');
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [visitorId, setVisitorId] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [lastBookingInfo, setLastBookingInfo] = useState<{name: string, date: string, time: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    reference: '',
    observation: '',
    luggageS: '0',
    luggageM: '0',
    luggageL: '0',
    time: '',
    paymentMethod: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Track visit
    try {
      const today = new Date().toISOString().split('T')[0];
      db.ref(`site_analytics/visits/${today}`).push({
        timestamp: Date.now(),
        path: window.location.pathname
      });
    } catch (e) {
      console.error("Error tracking visit:", e);
    }

    // Initialize Fingerprint
    const initFingerprint = async () => {
      try {
        const id = await getDeviceFingerprint();
        setVisitorId(id);
      } catch (error) {
        console.error("Error loading fingerprint:", error);
      }
    };
    initFingerprint();

    // Listen to auto-scheduling settings
    const refs = ['Pg', 'Mip', 'Sv'].map(sys => db.ref(`system_settings/${sys}/autoSchedulingEnabled`));
    const listeners = refs.map((ref, idx) => {
      const sys = ['Pg', 'Mip', 'Sv'][idx];
      return ref.on('value', (snap) => {
        setAutoSchedulingEnabled((prev: any) => ({ ...prev, [sys]: snap.val() !== false }));
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      refs.forEach((ref, idx) => ref.off('value', listeners[idx]));
    };
  }, []);

  const currentSystem = useMemo(() => {
    if (origin === 'mongagua' || origin === 'itanhaem') return 'Mip';
    if (origin === 'santos' || origin === 'sao_vicente' || origin === 'cubatao' || origin === 'guaruja') return 'Sv';
    return 'Pg';
  }, [origin]);

  const isAutoSchedulingDisabled = !autoSchedulingEnabled[currentSystem];

  const handleAction = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden text-slate-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border min-w-[300px] ${
              toast.type === 'error' 
                ? 'bg-red-950/90 border-red-500/50 text-red-200 backdrop-blur-md' 
                : 'bg-slate-900/90 border-brand-purple/50 text-white backdrop-blur-md'
            }`}
          >
            {toast.type === 'error' ? (
              <X className="text-red-500 w-6 h-6 shrink-0" />
            ) : (
              <CheckCircle2 className="text-brand-pink w-6 h-6 shrink-0" />
            )}
            <span className="font-bold text-sm md:text-base">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md shadow-lg shadow-black/20 py-3 border-b border-slate-800' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-16 h-12 flex items-center justify-center">
              <img src="/BDV.png" alt="Bora de Van Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-display font-extrabold tracking-tight text-white">
              Bora de <span className="text-brand-pink">Van</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[{id: 'destinos', label: 'Destinos'}, {id: 'como-funciona', label: 'Como Funciona'}, {id: 'sobre', label: 'Sobre'}].map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }} className="text-slate-300 hover:text-brand-pink font-medium transition-colors">
                {item.label}
              </a>
            ))}
            <Link to="/contato" className="text-slate-300 hover:text-brand-pink font-medium transition-colors">
              Contato
            </Link>
            <button onClick={() => scrollToSection('reserva')} className="bg-gradient-brand text-white px-6 py-2.5 rounded-full font-bold shadow-md shadow-brand-purple/20 hover:shadow-lg hover:shadow-brand-purple/40 hover:scale-105 transition-all">
              Reserve Agora
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-slate-950 pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              {[{id: 'destinos', label: 'Destinos'}, {id: 'como-funciona', label: 'Como Funciona'}, {id: 'sobre', label: 'Sobre'}].map((item) => (
                <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }} className="text-2xl font-display font-bold text-white">
                  {item.label}
                </a>
              ))}
              <Link to="/contato" onClick={() => setIsMenuOpen(false)} className="text-2xl font-display font-bold text-white">
                Contato
              </Link>
              <button onClick={() => scrollToSection('reserva')} className="bg-gradient-brand text-white py-4 rounded-2xl font-bold text-xl shadow-xl mt-4">
                Reserve sua viagem agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-10 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-brand-purple rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-pink rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-1 bg-brand-purple/20 text-brand-pink rounded-full font-bold text-sm mb-6 uppercase tracking-wider border border-brand-purple/30">
                  Aventura & Conforto
                </span>
                <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white leading-[1.1] mb-6">
                  Bora de Van – <br />
                  <span className="text-gradient-brand">Reserve sua viagem agora!</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0">
                  Descubra destinos incríveis com a segurança e o conforto que você merece. Viagens rápidas, práticas e cheias de diversão.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <button onClick={() => scrollToSection('reserva')} className="w-full sm:w-auto bg-gradient-brand text-white px-8 py-4 rounded-2xl font-extrabold text-lg shadow-xl shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:scale-105 transition-all flex items-center justify-center gap-2">
                    Reserve sua viagem agora <ChevronRight size={20} />
                  </button>
                  <button onClick={() => scrollToSection('destinos')} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all border border-slate-800 hover:border-slate-700">
                    Veja destinos
                  </button>
                </div>
              </motion.div>
            </div>

            <div className="flex-1 relative w-full max-w-2xl">
              {/* Animated Van Illustration Area */}
              <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
              >
                {/* Road Shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/40 blur-xl rounded-full" />
                
                {/* Stylized Van (Placeholder Area) */}
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-full aspect-[4/3] md:aspect-[16/10] bg-transparent flex flex-col items-center justify-center relative mt-8 md:mt-0">
                       {/* A imagem fica aqui, mas como o arquivo pode estar ausente, o box acima serve de guia */}
                       <img 
                         src="/BDV.png" 
                         alt="Bora de Van" 
                         className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl z-10 scale-[1.2] md:scale-125" 
                         onError={(e) => (e.currentTarget.style.display = 'none')}
                         referrerPolicy="no-referrer" 
                       />
                    </div>
                  </motion.div>
                </div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-4 -right-2 md:top-4 md:right-4 bg-slate-900 border border-slate-800 p-3 md:p-4 rounded-2xl shadow-2xl flex items-center gap-2 md:gap-3 z-20 scale-75 md:scale-100 origin-top-right"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                    <ShieldCheck size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase">Segurança</p>
                    <p className="text-sm md:text-base font-bold text-white">100% Garantida</p>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-4 -left-2 md:bottom-4 md:left-4 bg-slate-900 border border-slate-800 p-3 md:p-4 rounded-2xl shadow-2xl flex items-center gap-2 md:gap-3 z-20 scale-75 md:scale-100 origin-bottom-left"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center">
                    <Star size={20} className="md:w-6 md:h-6" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase">Avaliação</p>
                    <p className="text-sm md:text-base font-bold text-white">4.9/5 Estrelas</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Widget */}
      <section id="reserva" className="container mx-auto px-4 -mt-12 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-400 font-bold text-sm ml-1">
                <ArrowLeftRight size={16} className="text-brand-pink" /> TIPO DE VIAGEM
              </label>
              <CustomSelect 
                options={tripTypeOptions}
                value={tripType}
                onChange={setTripType}
                placeholder="Selecione o tipo"
                disabled={true}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-400 font-bold text-sm ml-1">
                <MapPin size={16} className="text-brand-pink" /> ORIGEM
              </label>
              <CustomSelect 
                options={originOptions}
                value={origin}
                onChange={(val) => {
                  setOrigin(val);
                  setFormData(prev => ({ ...prev, neighborhood: '' }));
                  setWidgetErrors(prev => prev.filter(e => e !== 'origin'));
                }}
                placeholder="De onde saímos?"
                error={widgetErrors.includes('origin')}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-400 font-bold text-sm ml-1">
                <MapPin size={16} className="text-brand-pink" /> DESTINO
              </label>
              <CustomSelect 
                options={destinationOptions}
                value={destination}
                onChange={(val) => {
                  setDestination(val);
                  setWidgetErrors(prev => prev.filter(e => e !== 'destination'));
                }}
                placeholder="Para onde vamos?"
                disabled={true}
                error={widgetErrors.includes('destination')}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-400 font-bold text-sm ml-1">
                <Calendar size={16} className="text-brand-pink" /> DATA
              </label>
              <CustomDatePicker 
                value={date}
                onChange={(val) => {
                  setDate(val);
                  setWidgetErrors(prev => prev.filter(e => e !== 'date'));
                }}
                placeholder="Escolha a data"
                error={widgetErrors.includes('date')}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-400 font-bold text-sm ml-1">
                <Users size={16} className="text-brand-pink" /> PASSAGEIROS
              </label>
              <input 
                type="number" 
                min="1"
                value={passengers}
                onChange={(e) => {
                  setPassengers(e.target.value);
                  setWidgetErrors(prev => prev.filter(e => e !== 'passengers'));
                }}
                placeholder="Ex: 2"
                className={`w-full bg-slate-950 border rounded-2xl px-5 py-4 font-bold text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all placeholder:text-slate-500 ${widgetErrors.includes('passengers') ? 'border-red-500/50' : 'border-slate-800'}`}
              />
            </div>

            <div className="flex items-end">
              {isAutoSchedulingDisabled ? (
                <a 
                  href={`https://wa.me/5513997744720?text=${encodeURIComponent(`Olá, gostaria de consultar uma viagem saindo de ${origin || '...'} para ${destination === 'jabaquara' ? 'São Paulo' : destination}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-extrabold text-lg shadow-lg shadow-green-900/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} /> Chamar no WhatsApp
                </a>
              ) : (
                <button 
                  onClick={() => {
                    const errors: string[] = [];
                    if (!origin) errors.push('origin');
                    if (!destination) errors.push('destination');
                    if (!date) errors.push('date');
                    if (!passengers) errors.push('passengers');

                    if (errors.length > 0) {
                      setWidgetErrors(errors);
                      handleAction('Por favor, preencha todos os campos destacados!', 'error');
                      return;
                    }
                    setWidgetErrors([]);
                    setIsInitialLoading(true);
                    setTimeout(() => {
                      setIsInitialLoading(false);
                      setIsBookingModalOpen(true);
                    }, 3500);
                  }} 
                  className="w-full bg-gradient-brand text-white py-4 rounded-2xl font-extrabold text-lg shadow-lg shadow-brand-purple/20 hover:shadow-brand-pink/40 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
              Por que viajar com a <span className="text-gradient-brand">Bora de Van</span>?
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Oferecemos a melhor experiência de viagem em grupo, focada no que realmente importa para você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Clock className="text-purple-400" />, title: "Rapidez", desc: "Sinais visuais de velocidade e rotas otimizadas para você chegar logo.", color: "bg-purple-900/10 border-purple-900/30" },
              { icon: <ShieldCheck className="text-pink-400" />, title: "Segurança", desc: "Vans revisadas e motoristas profissionais para sua tranquilidade.", color: "bg-pink-900/10 border-pink-900/30" },
              { icon: <Star className="text-yellow-400" />, title: "Conforto", desc: "Ar-condicionado, poltronas reclináveis e espaço de sobra.", color: "bg-yellow-900/10 border-yellow-900/30" },
              { icon: <MapIcon className="text-blue-400" />, title: "Diversão", desc: "Destinos incríveis e a melhor vibe para sua viagem ser inesquecível.", color: "bg-blue-900/10 border-blue-900/30" },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className={`${feature.color} p-8 rounded-[2rem] border hover:border-slate-700 transition-all backdrop-blur-sm`}
              >
                <div className="w-14 h-14 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Preview */}
      <section id="destinos" className="py-24 bg-slate-900 overflow-hidden border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
                Destinos <span className="text-gradient-brand">Populares</span>
              </h2>
              <p className="text-slate-400 text-lg">
                Escolha o seu próximo destino e prepare as malas. A aventura começa aqui!
              </p>
            </div>
            <button onClick={() => setIsAllDestinationsModalOpen(true)} className="flex items-center gap-2 text-brand-pink font-bold text-lg hover:gap-4 transition-all">
              Ver todos os destinos <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: 'santos', name: "Santos", price: "R$ 50", img: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?auto=format&fit=crop&w=800&q=80" },
              { value: 'praia_grande', name: "Praia Grande", price: "R$ 45", img: "https://images.unsplash.com/photo-1596423735880-5c6fa7f0170a?auto=format&fit=crop&w=800&q=80" },
              { value: 'guaruja', name: "Guarujá", price: "R$ 50", img: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=800&q=80" },
            ].map((dest, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="group relative h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-slate-800"
              >
                <img 
                  src={dest.img} 
                  alt={dest.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center justify-between items-end mb-2">
                    <div>
                      <p className="text-slate-300 font-bold text-sm uppercase tracking-widest mb-1">Destino</p>
                      <h3 className="text-3xl font-display font-extrabold text-white">{dest.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-pink font-bold text-sm uppercase">A partir de</p>
                      <p className="text-2xl font-extrabold text-white">{dest.price}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right mb-4">*Valor sujeito a mudança sem aviso prévio</p>
                  <button 
                    onClick={() => {
                      setBeachInfoModal({ isOpen: true, destValue: dest.value });
                    }} 
                    className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 py-3 rounded-xl font-bold hover:bg-gradient-brand hover:border-transparent transition-all shadow-lg"
                  >
                    Agende sua van
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-brand rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-brand-purple/20 border border-slate-800">
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-display font-extrabold mb-8">
                Pronto para sua próxima aventura?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-12 font-medium">
                Não perca tempo! Garanta seu lugar agora e viaje com quem entende de diversão e segurança.
              </p>
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                <button onClick={() => scrollToSection('reserva')} className="w-full sm:w-auto bg-slate-950 text-white px-10 py-5 rounded-2xl font-extrabold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all border border-slate-800 hover:border-brand-pink">
                  Reserve sua viagem agora
                </button>
                <button 
                  onClick={() => window.open('https://wa.me/551334711830', '_blank')} 
                  className="w-full sm:w-auto bg-brand-purple/20 backdrop-blur-md border border-white/30 text-white px-10 py-5 rounded-2xl font-extrabold text-xl hover:bg-white/10 transition-all"
                >
                  Falar com consultor
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="sobre" className="bg-slate-950 text-white pt-20 pb-10 border-t border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-16 h-12 flex items-center justify-center">
                  <img src="/BDV.png" alt="Bora de Van Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-2xl font-display font-extrabold tracking-tight">
                  Bora de <span className="text-brand-pink">Van</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                A sua agência de viagens especializada em transporte de van. Conforto, segurança e diversão em cada quilômetro.
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Links Rápidos</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#destinos" onClick={(e) => { e.preventDefault(); scrollToSection('destinos'); }} className="hover:text-brand-pink transition-colors">Destinos</a></li>
                <li><a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollToSection('como-funciona'); }} className="hover:text-brand-pink transition-colors">Como Funciona</a></li>
                <li><a href="#sobre" onClick={(e) => { e.preventDefault(); scrollToSection('sobre'); }} className="hover:text-brand-pink transition-colors">Sobre Nós</a></li>
                <li><a href="#reserva" onClick={(e) => { e.preventDefault(); scrollToSection('reserva'); }} className="hover:text-brand-pink transition-colors">Agendamento</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Suporte</h4>
              <ul className="space-y-4 text-slate-400">
                <li><Link to="/central-ajuda" className="hover:text-brand-pink transition-colors">Central de Ajuda</Link></li>
                <li><Link to="/termos-uso" className="hover:text-brand-pink transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-brand-pink transition-colors">Privacidade</Link></li>
                <li><Link to="/contato" className="hover:text-brand-pink transition-colors">Contato</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6">Newsletter</h4>
              <p className="text-slate-400 mb-6 text-sm">Inscreva-se para receber novidades e promoções exclusivas.</p>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all"
                  />
                </div>
                <button className="w-full bg-gradient-brand text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-brand-purple/20 transition-all">
                  Inscrever-se
                </button>
              </form>
            </div>
          </div>
          
          <div className="pt-10 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} Bora de Van. Todos os direitos reservados. Viaje com diversão e segurança.</p>
            <div className="flex gap-4">
              <a 
                href="https://www.instagram.com/bora_devan?igsh=MXMxeTMxa2FwdnVteQ==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-500 hover:text-brand-pink transition-colors text-sm font-medium"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-800 flex-shrink-0 relative">
                <button 
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    setFormErrors([]);
                  }} 
                  className="absolute top-6 md:top-8 right-6 md:right-8 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white mb-2 pr-8">Complete sua reserva</h3>
                <p className="text-slate-400 text-sm md:text-base">Falta pouco! Preencha os dados abaixo para confirmar sua viagem.</p>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto space-y-5">
                {destination !== 'jabaquara' ? (
                  <div className="mb-2">
                    <label className="block text-sm font-bold text-slate-400 mb-3">Informação de Saída</label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300 text-sm leading-relaxed flex items-start gap-3">
                      <Clock className="text-brand-pink shrink-0 mt-0.5" size={20} />
                      <p>
                        Carros e Vans Saindo todos os dias de domingo a domingo de 30 em 30 minutos. A partir das 6:00 da manhã no Mercado Pão de açúcar - Jabaquara
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <label className={`block text-sm font-bold mb-3 ${formErrors.includes('time') ? 'text-red-400' : 'text-slate-400'}`}>Horário de Saída</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {generateTimeSlots(date).map((slot) => {
                        const isPast = date ? isSlotPast(date, slot.startHour, slot.startMinute) : false;
                        const isSelected = formData.time === slot.value;
                        
                        return (
                          <button
                            key={slot.value}
                            disabled={isPast}
                            onClick={() => {
                              setFormData({ ...formData, time: slot.value });
                              setFormErrors(prev => prev.filter(e => e !== 'time'));
                            }}
                            className={`
                              py-2 px-1 rounded-xl text-xs sm:text-sm font-bold border transition-all
                              ${isPast 
                                ? 'bg-slate-900/50 border-slate-800/50 text-slate-600 line-through cursor-not-allowed' 
                                : isSelected
                                  ? 'bg-brand-purple border-brand-pink text-white shadow-lg shadow-brand-purple/20'
                                  : formErrors.includes('time')
                                    ? 'bg-red-950/20 border-red-500/50 text-red-200'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-brand-purple hover:text-white'
                              }
                            `}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${formErrors.includes('name') ? 'text-red-400' : 'text-slate-400'}`}>Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value});
                        setFormErrors(prev => prev.filter(err => err !== 'name'));
                      }}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all ${formErrors.includes('name') ? 'border-red-500/50' : 'border-slate-800'}`} 
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${formErrors.includes('phone') ? 'text-red-400' : 'text-slate-400'}`}>Telefone / WhatsApp</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({...formData, phone: e.target.value});
                        setFormErrors(prev => prev.filter(err => err !== 'phone'));
                      }}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all ${formErrors.includes('phone') ? 'border-red-500/50' : 'border-slate-800'}`} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${formErrors.includes('address') ? 'text-red-400' : 'text-slate-400'}`}>Endereço</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({...formData, address: e.target.value});
                        setFormErrors(prev => prev.filter(err => err !== 'address'));
                      }}
                      className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all ${formErrors.includes('address') ? 'border-red-500/50' : 'border-slate-800'}`} 
                      placeholder="Rua, Número"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${formErrors.includes('neighborhood') ? 'text-red-400' : 'text-slate-400'}`}>Bairro</label>
                    <CustomSelect 
                      options={(['mongagua', 'itanhaem'].includes(origin) ? BAIRROS_MIP : BAIRROS).map(b => ({ value: b, label: b }))}
                      value={formData.neighborhood}
                      onChange={(val) => {
                        setFormData({...formData, neighborhood: val});
                        setFormErrors(prev => prev.filter(err => err !== 'neighborhood'));
                      }}
                      placeholder="Selecione o Bairro"
                      error={formErrors.includes('neighborhood')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">Ponto de Referência</label>
                    <input 
                      type="text" 
                      value={formData.reference}
                      onChange={(e) => setFormData({...formData, reference: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all" 
                      placeholder="Ex: Próximo ao mercado"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-400 mb-2">Quantidade de Malas</label>
                   <div className="grid grid-cols-3 gap-4">
                     <div>
                       <label className="block text-xs text-slate-500 mb-1">Pequena (P)</label>
                       <input 
                         type="number" 
                         min="0" 
                         value={formData.luggageS}
                         onChange={(e) => setFormData({...formData, luggageS: e.target.value})}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all" 
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-slate-500 mb-1">Média (M)</label>
                       <input 
                         type="number" 
                         min="0" 
                         value={formData.luggageM}
                         onChange={(e) => setFormData({...formData, luggageM: e.target.value})}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all" 
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-slate-500 mb-1">Grande (GG)</label>
                       <input 
                         type="number" 
                         min="0" 
                         value={formData.luggageL}
                         onChange={(e) => setFormData({...formData, luggageL: e.target.value})}
                         className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all" 
                       />
                     </div>
                   </div>
                </div>

                <div>
                  <label className={`block text-sm font-bold mb-2 ${formErrors.includes('paymentMethod') ? 'text-red-400' : 'text-slate-400'}`}>Forma de Pagamento</label>
                  <CustomSelect 
                    options={[
                      { value: 'Dinheiro', label: 'Dinheiro' },
                      { value: 'Pix', label: 'Pix' },
                      { value: 'Cartão', label: 'Cartão' }
                    ]}
                    value={formData.paymentMethod}
                    onChange={(value) => {
                      setFormData({...formData, paymentMethod: value});
                      setFormErrors(prev => prev.filter(err => err !== 'paymentMethod'));
                    }}
                    placeholder="Selecione uma forma de pagamento"
                    error={formErrors.includes('paymentMethod')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Observação (Opcional)</label>
                  <textarea 
                    rows={3} 
                    value={formData.observation}
                    onChange={(e) => setFormData({...formData, observation: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all resize-none"
                    placeholder="Alguma necessidade especial ou detalhe importante?"
                  ></textarea>
                </div>

                <button 
                  onClick={async () => { 
                    const errors: string[] = [];
                    if (destination === 'jabaquara' && !formData.time) errors.push('time');
                    if (!formData.name) errors.push('name');
                    if (!formData.phone) errors.push('phone');
                    if (!formData.address) errors.push('address');
                    if (!formData.neighborhood) errors.push('neighborhood');
                    if (!formData.paymentMethod) errors.push('paymentMethod');

                    if (errors.length > 0) {
                      setFormErrors(errors);
                      return handleAction('Por favor, preencha todos os campos destacados em vermelho!', 'error');
                    }

                    try {
                      let formattedDate = '';
                      if (date) {
                        const d = new Date(date);
                        formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      }

                      let timeToSave = formData.time;
                      if (!timeToSave) {
                        timeToSave = ''; 
                      } else {
                        timeToSave = formData.time.split('-')[0];
                      }

                      const passengerData = {
                        name: formData.name,
                        phone: formData.phone,
                        address: formData.address || '',
                        reference: formData.reference || '',
                        neighborhood: formData.neighborhood || '',
                        targetCity: destination === 'jabaquara' ? origin : destination,
                        date: formattedDate,
                        time: timeToSave,
                        passengerCount: parseInt(passengers) || 1,
                        luggageCount: (parseInt(formData.luggageS) || 0) + (parseInt(formData.luggageM) || 0) + (parseInt(formData.luggageL) || 0),
                        luggageDetails: `${formData.luggageS}P, ${formData.luggageM}M, ${formData.luggageL}G`,
                        status: 'Ativo',
                        source: 'Site',
                        payment: formData.paymentMethod || 'Pendente',
                        paymentMethod: '',
                        createdAt: new Date().toISOString(),
                        observation: formData.observation || '',
                        fingerprint: visitorId
                      };

                      setPendingBookingData(passengerData);
                      setLastBookingInfo({
                        name: formData.name,
                        date: date ? new Date(date).toLocaleDateString('pt-BR') : '',
                        time: timeToSave
                      });
                      setConfirmedPhone(formData.phone);
                      setIsBookingModalOpen(false); 
                      setIsPhoneConfirmationModalOpen(true);
                    } catch (error) {
                      console.error("Error preparing booking:", error);
                      handleAction('Erro ao preparar reserva. Tente novamente.', 'error');
                    }
                  }} 
                  className="w-full bg-gradient-brand text-white py-4 rounded-xl font-bold text-lg mt-4 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-purple/20"
                >
                  Finalizar Reserva
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPhoneConfirmationModalOpen && lastBookingInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="p-8 md:p-10 text-center">
                <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-brand-pink" size={32} />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white mb-4">
                  {lastBookingInfo.name.split(' ')[0]}!
                </h3>
                
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  Por favor verifique seu número de telefone se caso ele estiver incorreto não iremos conseguir entrar em contato para confirmar sua viagem. Se caso seu número de telefone não for whatsapp favor ligar neste número para confirmar sua viagem: <strong className="text-white">1334711830</strong>.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2 text-left">Seu Telefone / WhatsApp</label>
                    <input 
                      type="tel" 
                      value={confirmedPhone}
                      onChange={(e) => setConfirmedPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white text-lg font-bold focus:ring-2 focus:ring-brand-purple/50 outline-none transition-all text-center" 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  
                  <button 
                    onClick={async () => {
                      if (!confirmedPhone) {
                        handleAction('Por favor, informe seu telefone!', 'error');
                        return;
                      }

                      // Try to get location before submitting
                      let finalLocation = userLocation;
                      if (!finalLocation && navigator.geolocation) {
                        try {
                          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                          });
                          finalLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                          };
                          setUserLocation(finalLocation);
                        } catch (e) {
                          console.warn("Geolocation denied or failed:", e);
                        }
                      }

                      try {
                        const finalBookingData = {
                          ...pendingBookingData,
                          phone: confirmedPhone,
                          location: finalLocation
                        };

                        const response = await fetch('/api/create-booking', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(finalBookingData)
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          if (errorData.isBlocked) {
                            setPoisonPill(visitorId);
                          }
                          throw new Error(errorData.error || 'Failed to create booking');
                        }

                        setIsPhoneConfirmationModalOpen(false);
                        setIsSuccessModalOpen(true);

                        // Reset form
                        setFormData({
                          name: '', phone: '', address: '', neighborhood: '', reference: '', observation: '', luggageS: '0', luggageM: '0', luggageL: '0', time: '', paymentMethod: ''
                        });
                        setOrigin('');
                        setDestination('jabaquara');
                        setDate(null);
                        setPassengers('1');
                        setPendingBookingData(null);
                      } catch (err: any) {
                        console.error("Error creating booking:", err);
                        handleAction(err.message || 'Erro ao finalizar reserva. Tente novamente.', 'error');
                      }
                    }}
                    className="w-full bg-gradient-brand text-white py-4 rounded-2xl font-extrabold text-lg shadow-xl shadow-brand-purple/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Confirmar Número
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuccessModalOpen && lastBookingInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="text-green-400" size={48} />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-6">Reserva Recebida!</h3>
                
                <p className="text-slate-300 text-lg leading-relaxed mb-10">
                  Em minutos um de nossos atendentes vai chamar para confirmar disponibilidade e dar andamento na viagem.
                </p>

                <div className="space-y-4">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Caso queira adiantar o processo chame nossa equipe no whatsapp</p>
                  
                  <a 
                    href={`https://wa.me/551334711830`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-5 rounded-2xl font-extrabold text-xl shadow-xl shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Chamar no WhatsApp
                  </a>

                  <button 
                    onClick={() => setIsSuccessModalOpen(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Destinations Modal */}
      <AnimatePresence>
        {beachInfoModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="p-6 md:p-8 text-center">
                <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-brand-pink" size={32} />
                </div>
                <h3 className="text-2xl font-display font-extrabold text-white mb-4">Informação de Embarque</h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">
                  As vans saem do <strong className="text-white">Pão de Açúcar Jabaquara</strong> todo dia a partir das <strong className="text-brand-pink">6:00 até ~21:00</strong>.
                </p>
                <button 
                  onClick={() => {
                    setBeachInfoModal({ isOpen: false, destValue: '' });
                    setIsAllDestinationsModalOpen(false);
                    setOrigin(beachInfoModal.destValue);
                    setFormData(prev => ({ ...prev, neighborhood: '' }));
                    scrollToSection('reserva');
                  }} 
                  className="w-full bg-gradient-brand text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-purple/25 transition-all"
                >
                  Entendido, continuar reserva
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAllDestinationsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-6xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-800 flex-shrink-0 relative flex justify-between items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white mb-2">Todos os Destinos</h3>
                  <p className="text-slate-400 text-sm md:text-base">Escolha a praia perfeita para sua próxima viagem.</p>
                </div>
                <button onClick={() => setIsAllDestinationsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allDestinationsList.map((dest, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="group relative h-[350px] rounded-3xl overflow-hidden shadow-xl border border-slate-800"
                    >
                      <img 
                        src={dest.img} 
                        alt={dest.name} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center justify-between items-end mb-2">
                          <div>
                            <h3 className="text-2xl font-display font-extrabold text-white">{dest.name}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-brand-pink font-bold text-[10px] uppercase">A partir de</p>
                            <p className="text-xl font-extrabold text-white">{dest.price}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right mb-4">*Valor sujeito a mudança sem aviso prévio</p>
                        <button 
                          onClick={() => {
                            setBeachInfoModal({ isOpen: true, destValue: dest.value });
                          }} 
                          className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 py-3 rounded-xl font-bold hover:bg-gradient-brand hover:border-transparent transition-all shadow-lg"
                        >
                          Agende sua van
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Video Modal */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden relative"
            >
              <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 border border-slate-800 shadow-2xl">
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/BDVIDEO.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full mb-2">
                  <div className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
                  <span className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">Processando</span>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white leading-tight">
                  Buscando as melhores <span className="text-gradient-brand">opções</span>...
                </h3>
                
                <p className="text-slate-400 font-medium text-sm md:text-base">
                  Aguarde um momento enquanto preparamos o formulário de reserva para você.
                </p>
                
                <div className="flex justify-center gap-2 pt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                        y: [0, -4, 0]
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity, 
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className="w-2.5 h-2.5 rounded-full bg-brand-pink shadow-[0_0_10px_rgba(219,39,119,0.5)]"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const seoRoutesData = [
  // Originais
  { path: '/van-jabaquara', destino: 'Jabaquara', origem: 'Litoral SP', prefix: 'Van' },
  { path: '/van-santos-sp', destino: 'Santos', origem: 'São Paulo', prefix: 'Van' },
  { path: '/van-sao-vicente-sp', destino: 'São Vicente', origem: 'São Paulo', prefix: 'Van' },
  { path: '/van-litoral-sp', destino: 'Litoral SP', origem: 'São Paulo', prefix: 'Van' },
  { path: '/van-aeroporto-guarulhos', destino: 'Aeroporto de Guarulhos', origem: 'Litoral SP', prefix: 'Van' },
  
  // Praia Grande
  { path: '/van-praia-grande', destino: 'Praia Grande', origem: 'São Paulo', prefix: 'Van' },
  { path: '/transporte-praia-grande', destino: 'Praia Grande', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-praia-grande', destino: 'Praia Grande', origem: 'São Paulo', prefix: 'Lotação' },
  
  // Mongaguá
  { path: '/van-mongagua', destino: 'Mongaguá', origem: 'São Paulo', prefix: 'Van' },
  { path: '/transporte-mongagua', destino: 'Mongaguá', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-mongagua', destino: 'Mongaguá', origem: 'São Paulo', prefix: 'Lotação' },
  
  // Itanhaém
  { path: '/van-itanhaem', destino: 'Itanhaém', origem: 'São Paulo', prefix: 'Van' },
  { path: '/transporte-itanhaem', destino: 'Itanhaém', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-itanhaem', destino: 'Itanhaém', origem: 'São Paulo', prefix: 'Lotação' },
  
  // Peruíbe
  { path: '/van-peruibe', destino: 'Peruíbe', origem: 'São Paulo', prefix: 'Van' },
  { path: '/transporte-peruibe', destino: 'Peruíbe', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-peruibe', destino: 'Peruíbe', origem: 'São Paulo', prefix: 'Lotação' },
  
  // Cubatão
  { path: '/van-cubatao', destino: 'Cubatão', origem: 'São Paulo', prefix: 'Van' },
  { path: '/transporte-cubatao', destino: 'Cubatão', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-cubatao', destino: 'Cubatão', origem: 'São Paulo', prefix: 'Lotação' },
  
  // Guarujá
  { path: '/van-guaruja', destino: 'Guarujá', origem: 'São Paulo', prefix: 'Van' },
  { path: '/transporte-guaruja', destino: 'Guarujá', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-guaruja', destino: 'Guarujá', origem: 'São Paulo', prefix: 'Lotação' },

  // Santos & São Vicente (Variations)
  { path: '/transporte-santos', destino: 'Santos', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-santos', destino: 'Santos', origem: 'São Paulo', prefix: 'Lotação' },
  { path: '/transporte-sao-vicente', destino: 'São Vicente', origem: 'São Paulo', prefix: 'Transporte' },
  { path: '/lotacao-sao-vicente', destino: 'São Vicente', origem: 'São Paulo', prefix: 'Lotação' },
  
  // Outros
  { path: '/van-bertioga', destino: 'Bertioga', origem: 'São Paulo', prefix: 'Van' },
  { path: '/van-sao-sebastiao', destino: 'São Sebastião', origem: 'São Paulo', prefix: 'Van' },
  { path: '/viagem-barata', destino: 'Baixada Santista e São Paulo', origem: 'Várias Cidades', prefix: 'Viagem Barata' },
  { path: '/carona-compartilhada', destino: 'Baixada Santista e São Paulo', origem: 'Várias Cidades', prefix: 'Carona Compartilhada' },
  
  // Temas Específicos
  { path: '/borade', destino: 'Litoral SP', origem: 'São Paulo', prefix: 'BoraDe' },
  { path: '/bora-transporte', destino: 'Baixada Santista', origem: 'São Paulo', prefix: 'Bora Transporte' },
  { path: '/boravan', destino: 'Praia Grande e Região', origem: 'São Paulo', prefix: 'BoraVan' },
  { path: '/lotacao', destino: 'Litoral', origem: 'São Paulo', prefix: 'Lotação' },
  { path: '/van-jabaquara-telefone', destino: 'Jabaquara', origem: 'Litoral', prefix: 'Van Jabaquara Telefone' },
  { path: '/van-para-praia', destino: 'Praia', origem: 'São Paulo', prefix: 'Van para Praia' },
  { path: '/van-bem-avaliada', destino: 'Seu Destino', origem: 'São Paulo', prefix: 'Van Bem Avaliada' },
  { path: '/van-para-sao-paulo', destino: 'São Paulo', origem: 'Litoral', prefix: 'Van para São Paulo' },
  { path: '/van-para-sp-jabaquara', destino: 'SP Jabaquara', origem: 'Litoral', prefix: 'Van para SP Jabaquara' },
];

const generateSeoProps = (route: { path: string, destino: string, origem: string, prefix: string }) => {
  const { destino, origem, prefix, path } = route;
  
  let title = `${prefix} para ${destino} | Transporte Rápido e Seguro saindo de ${origem}`;
  let description = `Procurando ${prefix.toLowerCase()} para ${destino}? Oferecemos transporte rápido, seguro e confortável saindo de ${origem}. Saídas frequentes e motoristas experientes. Agende agora!`;
  let h1 = `${prefix} para ${destino} com Saída Rápida e Conforto`;
  let seoText = `Precisa de ${prefix.toLowerCase()} para ${destino}? Nosso serviço de transporte e lotação oferece a melhor experiência de viagem saindo de ${origem}. Garantimos um traslado seguro, rápido e com total conforto para você chegar ao seu destino sem preocupações.`;
  let whatsappMessage = `Olá, quero agendar uma vaga na ${prefix.toLowerCase()} para ${destino}`;

  // Customizações por Prefix ou Path
  if (prefix === 'Viagem Barata' || prefix === 'Carona Compartilhada') {
    title = `Passagem Barata e ${prefix} | Alternativa Econômica para sua Viagem`;
    description = `Encontre passagem barata e ${prefix.toLowerCase()} de confiança. A melhor alternativa para quem busca economia, conforto e segurança entre a Baixada Santista e São Paulo.`;
    h1 = `Buscando Passagem Barata? Experimente nossa ${prefix}!`;
    seoText = `Viaje com o melhor custo-benefício da região. Oferecemos uma alternativa de transporte seguro e extremamente econômico para quem costuma buscar passagens baratas e viagens compartilhadas. Nossas vans executivas garantem que você economize sem abrir mão do conforto e da pontualidade.`;
    whatsappMessage = `Olá, vi o anúncio de ${prefix.toLowerCase()} e passagem barata, gostaria de informações sobre vagas.`;
  }
  
  if (path === '/van-jabaquara-telefone') {
    title = `Telefone Van Jabaquara | Reserve sua Passagem para o Litoral`;
    description = `Procurando o telefone de van para o Jabaquara? Ligue agora ou chame no WhatsApp para garantir sua passagem barata e segura. Atendimento rápido e saídas frequentes.`;
    h1 = `Telefone e WhatsApp para Van Jabaquara`;
    seoText = `Precisa do contato de transporte para o Jabaquara? Estás no lugar certo! Oferecemos o melhor serviço de van com saídas do mercado Pão de Açúcar Jabaquara. Entre em contato agora e agende sua viagem com segurança e conforto.`;
    whatsappMessage = `Olá, peguei o telefone no site e gostaria de agendar uma van para o Jabaquara`;
  }

  if (prefix === 'Van Bem Avaliada') {
    title = `Van Bem Avaliada para ${destino} | 4.9 estrelas em Segurança e Conforto`;
    description = `Viaje com a van melhor avaliada da região. Conforto, pontualidade e segurança garantida por nossos passageiros. Reserve sua vaga agora mesmo!`;
    h1 = `A Van Mais Bem Avaliada para sua Viagem`;
    seoText = `Nossos passageiros confirmam: somos a melhor opção de transporte da região. Com alto índice de satisfação e avaliações positivas, garantimos que sua viagem seja tranquila, segura e muito confortável.`;
  }

  return { destino, origem, title, description, h1, seoText, whatsappMessage };
};

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/Contato" element={<Contato />} />
        <Route path="/central-ajuda" element={<CentralAjuda />} />
        <Route path="/termos-uso" element={<TermosUso />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/motorista/*" element={<MotoristaApp />} />
        
        {/* Error Pages */}
        <Route path="/401" element={<Error401 />} />
        <Route path="/403" element={<Error403 />} />
        <Route path="/500" element={<Error500 />} />
        <Route path="/503" element={<Error503 />} />
        
        {/* SEO Landing Pages */}
        {seoRoutesData.map(route => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={<SeoLandingPage {...generateSeoProps(route)} />} 
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
