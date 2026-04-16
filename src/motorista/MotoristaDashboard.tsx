import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  User, 
  LogOut, 
  MapPin, 
  MessageCircle, 
  Navigation, 
  GripVertical, 
  Phone, 
  Car, 
  Calendar,
  ChevronRight,
  ArrowLeft,
  Settings,
  Clock,
  Users,
  Search,
  LayoutList,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Bell,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  Play,
  RotateCcw,
  X,
  LocateFixed,
  Maximize
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Marker Icon for Numbered Stops (Square)
const createNumberedIcon = (number: number, color: string = '#2563eb') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Smooth Map Controller
const SmoothMapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
};

// Helper to fit bounds
const FitBounds = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

// --- Components ---

const SortablePassengerItem = ({ 
  passenger, 
  onWhatsApp, 
  onNavigate, 
  navApp, 
  tripStarted, 
  status, 
  onStatusChange,
  onRevert
}: { 
  passenger: any, 
  onWhatsApp: (p: any) => void, 
  onNavigate: (p: any) => void, 
  navApp: 'google' | 'waze',
  tripStarted: boolean,
  status: 'pending' | 'delivered' | 'canceled',
  onStatusChange: (id: string, status: 'delivered' | 'canceled') => void,
  onRevert: (id: string) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: passenger.id || passenger.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = status === 'delivered' || status === 'canceled';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3 flex flex-col gap-4 group shadow-sm transition-all ${isCompleted ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400">
          <GripVertical size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-bold text-white truncate ${status === 'canceled' ? 'line-through' : ''}`}>{passenger.name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              status === 'delivered' ? 'bg-green-500/20 text-green-400' :
              status === 'canceled' ? 'bg-red-500/20 text-red-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {status === 'delivered' ? 'Entregue' : status === 'canceled' ? 'Cancelado' : `${passenger.passengerCount || 1} ${ (passenger.passengerCount || 1) > 1 ? 'Pessoas' : 'Pessoa' }`}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
            <MapPin size={12} className="text-slate-500" /> {passenger.neighborhood || 'Bairro não informado'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <>
              <button 
                onClick={() => onNavigate(passenger)}
                className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-600/30 transition-colors"
                title={`Navegar com ${navApp === 'google' ? 'Google Maps' : 'Waze'}`}
              >
                <Navigation size={18} />
              </button>
              <button 
                onClick={() => onWhatsApp(passenger)}
                className="w-10 h-10 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center hover:bg-green-600/30 transition-colors"
              >
                <MessageCircle size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {tripStarted && !isCompleted && (
        <div className="flex gap-2 pt-2 border-t border-slate-800/50">
          <button 
            onClick={() => onStatusChange(passenger.id || passenger.name, 'delivered')}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Check size={14} /> Entregue
          </button>
          <button 
            onClick={() => onStatusChange(passenger.id || passenger.name, 'canceled')}
            className="flex-1 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="flex gap-2 pt-2 border-t border-slate-800/50">
          <button 
            onClick={() => onRevert(passenger.id || passenger.name)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Reverter Status
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Dashboard ---

export default function MotoristaDashboard() {
  const [activeTab, setActiveTab] = useState<'trips' | 'tabela' | 'finance' | 'profile' | 'config'>('trips');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableStatus, setTableStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dailyDraft, setDailyDraft] = useState<any[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [configModalType, setConfigModalType] = useState<'about' | 'help' | 'privacy' | null>(null);
  const [newTransaction, setNewTransaction] = useState({ 
    name: '', 
    amount: '', 
    type: 'income',
    subiu: '',
    desceu: '',
    almoco: '',
    prancheta: '',
    adicional: ''
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [navApp, setNavApp] = useState<'google' | 'waze'>('google');
  const [financeFilter, setFinanceFilter] = useState<'today' | '7days' | '30days' | 'months'>('today');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [lotadaSubida, setLotadaSubida] = useState(0);
  const [lotadaDescida, setLotadaDescida] = useState(0);
  const [passengerValue, setPassengerValue] = useState(0);
  const [isFinanceSettingsOpen, setIsFinanceSettingsOpen] = useState(false);
  const [deletedItem, setDeletedItem] = useState<any>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [tableTab, setTableTab] = useState<'geral' | 'lousa' | 'confirmados'>('geral');
  const [tripStarted, setTripStarted] = useState(false);
  const [passengerStatuses, setPassengerStatuses] = useState<Record<string, 'pending' | 'delivered' | 'canceled'>>({});
  const [sheetState, setSheetState] = useState<'minimized' | 'half' | 'expanded'>('half');
  const [lastAction, setLastAction] = useState<{ passengerId: string, status: 'pending' | 'delivered' | 'canceled' } | null>(null);
  const [passengerCoords, setPassengerCoords] = useState<Record<string, [number, number]>>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([-24.0089, -46.4128]); // Praia Grande default
  const [mapZoom, setMapZoom] = useState(13);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [tripFilter, setTripFilter] = useState<'today' | 'history'>('today');
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const navigate = useNavigate();

  const arrivalEstimates = useMemo(() => {
    if (!selectedTrip || !selectedTrip.passengers || !userLocation || Object.keys(passengerCoords).length === 0) return {};
    
    const estimates: Record<string, string> = {};
    let currentTime = new Date();
    let currentLoc = userLocation;
    
    selectedTrip.passengers.forEach((p: any) => {
      const pCoords = passengerCoords[p.id || p.name];
      if (pCoords) {
        const dist = calculateDistance(currentLoc, pCoords) * 111; // approx km
        const travelTimeMinutes = (dist / 25) * 60; // 25km/h average in city
        currentTime = new Date(currentTime.getTime() + travelTimeMinutes * 60000 + 1 * 60000); // +1 min per stop
        estimates[p.id || p.name] = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        currentLoc = pCoords;
      }
    });
    
    return estimates;
  }, [selectedTrip, userLocation, passengerCoords]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const session = localStorage.getItem('motorista_session');
    if (!session) {
      navigate('/motorista');
      return;
    }
    const driver = JSON.parse(session);
    setDriverData(driver);

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const system = driver.system || 'Pg';

    // Listen to trips
    const tripsPath = system === 'Pg' ? 'trips' : `${system}/trips`;
    const tripsRef = db.ref(tripsPath);
    const handleTrips = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const allTrips = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, firebaseId: id }));
        setTrips(allTrips);
      } else {
        setTrips([]);
      }
      setLoading(false);
    };

    // Listen to Table (Lousa)
    let tablePath = system === 'Pg' ? `daily_tables/${today}/table` : `${system}/drivers_table_list`;
    if (system === 'Mip') {
      const mipDayType = new Date().getDate() % 2 !== 0 ? 'odd' : 'even';
      // Defaulting to 6:00 table for Mip if not specified
      tablePath = `Mip/drivers_6_${mipDayType}`;
    }
    const tableRef = db.ref(tablePath);
    const handleTable = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setTableData(Array.isArray(data) ? data : Object.values(data));
      } else if (system === 'Pg') {
        // Fallback to master list if daily table not yet created
        db.ref('drivers_table_list').once('value', (snap) => {
          const masterData = snap.val();
          setTableData(Array.isArray(masterData) ? masterData : []);
        });
      } else {
        setTableData([]);
      }
    };

    // Listen to Table Status
    const statusPath = system === 'Pg' ? `daily_tables/${today}/status` : `${system}/daily_tables/${today}/status`;
    const statusRef = db.ref(statusPath);
    const handleStatus = (snapshot: any) => {
      setTableStatus(snapshot.val() || {});
    };

    // Listen to Transactions
    const transactionsPath = `motoristas_finance/${driver.id}`;
    const transactionsRef = db.ref(transactionsPath);
    const handleTransactions = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({ ...val, firebaseId: id }));
        setTransactions(list.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setTransactions([]);
      }
    };

    // Listen to Driver Settings
    const driverRef = db.ref('drivers');
    driverRef.once('value', (snapshot) => {
      const drivers = snapshot.val();
      for (const key in drivers) {
        if (drivers[key].id === driver.id) {
          const settings = drivers[key].settings || {};
          setLotadaSubida(settings.lotadaSubida || 0);
          setLotadaDescida(settings.lotadaDescida || 0);
          setPassengerValue(settings.passengerValue || 0);
          setNavApp(settings.navApp || 'google');
          break;
        }
      }
    });

    tripsRef.on('value', handleTrips);
    tableRef.on('value', handleTable);
    statusRef.on('value', handleStatus);
    transactionsRef.on('value', handleTransactions);

    return () => {
      tripsRef.off('value', handleTrips);
      tableRef.off('value', handleTable);
      statusRef.off('value', handleStatus);
      transactionsRef.off('value', handleTransactions);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('motorista_session');
    navigate('/motorista');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedTrip.passengers.findIndex((p: any) => (p.id || p.name) === active.id);
      const newIndex = selectedTrip.passengers.findIndex((p: any) => (p.id || p.name) === over.id);
      
      const newPassengers = arrayMove(selectedTrip.passengers, oldIndex, newIndex);
      const updatedTrip = { ...selectedTrip, passengers: newPassengers };
      
      setSelectedTrip(updatedTrip);
      
      const system = driverData.system || 'Pg';
      const tripsPath = system === 'Pg' ? 'trips' : `${system}/trips`;
      if (selectedTrip.firebaseId) {
        db.ref(`${tripsPath}/${selectedTrip.firebaseId}/passengersSnapshot`).set(newPassengers);
      }
    }
  };

  const openWhatsApp = (passenger: any) => {
    const phone = passenger.phone?.replace(/\D/g, '');
    if (!phone) return alert('Telefone não disponível');
    
    const tripTime = selectedTrip?.time || '';
    let timeWindow = "";
    if (tripTime) {
      const [hours, minutes] = tripTime.split(':').map(Number);
      const endMinutes = (minutes + 45) % 60;
      const endHours = hours + Math.floor((minutes + 45) / 60);
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      timeWindow = `das ${tripTime} as ${endTime}`;
    }

    const msg = encodeURIComponent(`Olá ${passenger.name}, aqui é o motorista ${driverData.name} da Bora de Van. Sua viagem está marcada para as ${tripTime}. Lembrando que ${timeWindow} o carro passa a qualquer momento. Estou a caminho!`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  const openNavigation = (type: 'google' | 'waze', destination: string) => {
    const encodedDest = encodeURIComponent(destination);
    if (type === 'google') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedDest}`, '_blank');
    } else {
      window.open(`https://waze.com/ul?q=${encodedDest}&navigate=yes`, '_blank');
    }
  };

  const filteredTrips = useMemo(() => {
    if (!driverData) return [];
    
    const today = new Date().toLocaleDateString('en-CA');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA');

    let list = trips.filter(t => String(t.driverId) === String(driverData.id) && t.status !== 'Cancelada');

    if (tripFilter === 'today') {
      list = list.filter(t => t.date === today);
    } else {
      list = list.filter(t => t.date >= thirtyDaysAgoStr && t.date < today);
    }

    const sorted = list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.time || '').localeCompare(b.time || ''));

    if (!searchTerm) return sorted;
    
    const lower = searchTerm.toLowerCase();
    return sorted.filter(t => 
      t.destination?.toLowerCase().includes(lower) || 
      t.id?.toString().includes(lower)
    );
  }, [trips, searchTerm, tripFilter, driverData]);

  const filteredTable = useMemo(() => {
    if (!searchTerm) return tableData;
    const lower = searchTerm.toLowerCase();
    return tableData.filter(d => 
      d.name?.toLowerCase().includes(lower) || 
      d.vaga?.toString().includes(lower)
    );
  }, [tableData, searchTerm]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      if (financeFilter === 'today') {
        return tDate.toDateString() === now.toDateString();
      }
      if (financeFilter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return tDate >= sevenDaysAgo;
      }
      if (financeFilter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return tDate >= thirtyDaysAgo;
      }
      if (financeFilter === 'months') {
        const tMonth = t.date.substring(0, 7);
        return tMonth === selectedMonth;
      }
      return true;
    });
  }, [transactions, financeFilter, selectedMonth]);

  const financeMetrics = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  const suggestions = useMemo(() => {
    const names = transactions.map(t => t.name);
    return Array.from(new Set(names)).slice(0, 10);
  }, [transactions]);

  const handleAddToDraft = () => {
    // Calculate amount based on inputs
    const subiu = Number(newTransaction.subiu) || 0;
    const desceu = Number(newTransaction.desceu) || 0;
    const almoco = Number(newTransaction.almoco) || 0;
    const prancheta = Number(newTransaction.prancheta) || 0;
    const adicional = Number(newTransaction.adicional) || 0;

    // Income calculation: 
    // Lotada is the fixed fee per trip if anyone boards/alights
    // PassengerValue is the rate per individual passenger
    const passengerIncome = (subiu * lotadaSubida) + (desceu * lotadaDescida) + ((subiu + desceu) * passengerValue);
    
    // Total calculation
    let finalAmount = 0;
    let finalName = newTransaction.name;

    if (subiu > 0 || desceu > 0) {
      finalAmount = passengerIncome + adicional - almoco - prancheta;
      finalName = `Movimentação: ${subiu}S / ${desceu}D`;
    } else {
      finalAmount = Number(newTransaction.amount) || 0;
    }

    if (!finalName || finalAmount === 0) return alert('Preencha os dados corretamente');

    setDailyDraft([...dailyDraft, { 
      ...newTransaction, 
      name: finalName,
      amount: Math.abs(finalAmount),
      type: finalAmount >= 0 ? 'income' : 'expense',
      id: Date.now() 
    }]);

    setNewTransaction({ 
      name: '', 
      amount: '', 
      type: 'income',
      subiu: '',
      desceu: '',
      almoco: '',
      prancheta: '',
      adicional: ''
    });
  };

  const handleRemoveFromDraft = (id: number) => {
    setDailyDraft(dailyDraft.filter(item => item.id !== id));
  };

  const handleLaunchDraft = () => {
    if (dailyDraft.length === 0) return;
    const path = `motoristas_finance/${driverData.id}`;
    const updates: any = {};
    dailyDraft.forEach(item => {
      const newKey = db.ref(path).push().key;
      updates[`${path}/${newKey}`] = {
        name: item.name,
        amount: Number(item.amount),
        type: item.type,
        timestamp: Date.now(),
        date: new Date().toISOString()
      };
    });
    db.ref().update(updates).then(() => {
      setDailyDraft([]);
      setIsTransactionModalOpen(false);
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
    
    const itemToDelete = transactions.find(t => t.firebaseId === id);
    setDeletedItem(itemToDelete);
    
    const path = `motoristas_finance/${driverData.id}/${id}`;
    await db.ref(path).remove();
    
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 5000);
  };

  const handleUndoAction = () => {
    if (lastAction) {
      setPassengerStatuses(prev => {
        const next = { ...prev };
        delete next[lastAction.passengerId];
        return next;
      });
      setLastAction(null);
    }
  };

  const handleUndoDelete = async () => {
    if (deletedItem) {
      const { firebaseId, ...data } = deletedItem;
      await db.ref(`motoristas_finance/${driverData.id}/${firebaseId}`).set(data);
      setShowUndo(false);
      setDeletedItem(null);
    }
  };

  const handleStatusChange = (id: string, status: 'delivered' | 'canceled') => {
    setPassengerStatuses(prev => ({ ...prev, [id]: status }));
    setLastAction({ passengerId: id, status });
    
    // Auto-advance to next pending passenger
    if (selectedTrip && selectedTrip.passengers) {
      const currentIndex = selectedTrip.passengers.findIndex((p: any) => (p.id || p.name) === id);
      const nextPending = selectedTrip.passengers.slice(currentIndex + 1).find((p: any) => 
        (passengerStatuses[p.id || p.name] || 'pending') === 'pending' && (p.id || p.name) !== id
      );
      
      if (nextPending) {
        setTimeout(() => {
          setSelectedPassenger(nextPending);
          const coords = passengerCoords[nextPending.id || nextPending.name];
          if (coords) {
            setMapCenter(coords);
            setMapZoom(18);
          }
        }, 1500);
      } else {
        setTimeout(() => setSelectedPassenger(null), 1500);
      }
    }

    setTimeout(() => setLastAction(null), 5000);
  };

  const handleRevertStatus = (id: string) => {
    setPassengerStatuses(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const calculateDistance = (p1: [number, number], p2: [number, number]) => {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
  };

  const optimizeRoute = (passengers: any[], coords: Record<string, [number, number]>, startLoc: [number, number]) => {
    if (!startLoc || passengers.length === 0) return passengers;

    const unvisited = [...passengers];
    const optimized: any[] = [];
    let currentLoc = startLoc;

    while (unvisited.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const pCoords = coords[unvisited[i].id || unvisited[i].name];
        if (pCoords) {
          const dist = calculateDistance(currentLoc, pCoords);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        }
      }

      const nextPassenger = unvisited.splice(closestIdx, 1)[0];
      optimized.push(nextPassenger);
      const nextCoords = coords[nextPassenger.id || nextPassenger.name];
      if (nextCoords) currentLoc = nextCoords;
    }

    return optimized;
  };

  // Geolocation effect
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Stable fallback generator
  const getStableFallback = (seed: string, base: [number, number]): [number, number] => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = (hash % 100) / 2000;
    const lngOffset = ((hash >> 8) % 100) / 2000;
    return [base[0] + latOffset, base[1] + lngOffset];
  };

  // Geocoding effect - Only runs when trip changes
  useEffect(() => {
    setRouteOptimized(false);
    if (selectedTrip && selectedTrip.passengers) {
      const geocodeAll = async () => {
        const coords: Record<string, [number, number]> = {};
        
        // Robust city detection
        const systemStr = (driverData?.system || '').toLowerCase();
        const isPG = systemStr.includes('pg') || systemStr.includes('praia') || systemStr === '';
        const cityContext = isPG ? 'Praia Grande, SP' : 'Mongaguá, SP';
        
        // Baixada Santista bounding box (approx)
        const viewbox = "-46.8,-24.2,-46.2,-23.8"; 

        const baseCoords: Record<string, [number, number]> = {
          'Pg': [-24.0089, -46.4128],
          'Mip': [-24.0928, -46.6206]
        };
        const base = isPG ? baseCoords['Pg'] : baseCoords['Mip'];

        // Initial center based on system
        setMapCenter(base);
        setMapZoom(13);

        // Parallel geocoding with staggered delay to avoid 429
        selectedTrip.passengers.forEach(async (p: any, index: number) => {
          const rawAddress = p.address || p.neighborhood;
          const pId = p.id || p.name;
          
          if (!rawAddress) return;

          // Add staggered delay (400ms between requests)
          await new Promise(resolve => setTimeout(resolve, index * 400));

          const cleanAddress = rawAddress
            .replace(/prox\.|próximo|casa|fundos|apto|bloco|nº/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

          const tryGeocode = async (q: string, bounded: boolean = true) => {
            try {
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${viewbox}${bounded ? '&bounded=1' : ''}&limit=1`;
              const response = await fetch(url, {
                headers: { 'User-Agent': 'BoraDeVanApp/1.1' }
              });
              const data = await response.json();
              return data && data.length > 0 ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
            } catch (e) { return null; }
          };

          // Strategy 1: Full cleaned address + city
          let result = await tryGeocode(`${cleanAddress}, ${cityContext}, Brazil`);
          
          // Strategy 2: Just address + city
          if (!result) result = await tryGeocode(`${rawAddress}, ${cityContext}, Brazil`);

          // Strategy 3: Neighborhood + city
          if (!result && p.neighborhood) result = await tryGeocode(`${p.neighborhood}, ${cityContext}, Brazil`);

          // Strategy 4: Try without bounding box
          if (!result) result = await tryGeocode(`${cleanAddress}, ${cityContext}, Brazil`, false);

          // Strategy 5: Just the street name + city
          if (!result) {
            const streetOnly = cleanAddress.split(',')[0].split('-')[0].trim();
            result = await tryGeocode(`${streetOnly}, ${cityContext}, Brazil`, false);
          }

          const finalCoords = result ? (result as [number, number]) : getStableFallback(pId, base);
          
          setPassengerCoords(prev => ({
            ...prev,
            [pId]: finalCoords
          }));

          // If it's the first passenger, center the map
          if (index === 0) {
            setMapCenter(finalCoords);
            setMapZoom(15);
          }
        });

        setPassengerCoords(prev => ({
          ...prev,
          'Jabaquara': [-23.6447, -46.6406]
        }));
      };
      geocodeAll();
    }
  }, [selectedTrip?.firebaseId, driverData?.system]);

  // Route Optimization effect
  useEffect(() => {
    if (userLocation && selectedTrip && selectedTrip.passengers.length > 0 && Object.keys(passengerCoords).length > 0 && !routeOptimized) {
      const optimized = optimizeRoute(selectedTrip.passengers, passengerCoords, userLocation);
      setSelectedTrip(prev => ({ ...prev, passengers: optimized }));
      setRouteOptimized(true);
    }
  }, [userLocation, passengerCoords, selectedTrip?.firebaseId, routeOptimized]);

  // Routing effect - Runs when location or status changes
  useEffect(() => {
    if (selectedTrip && selectedTrip.passengers && Object.keys(passengerCoords).length > 0) {
      const fetchRoute = async () => {
        const pendingPassengers = selectedTrip.passengers.filter((p: any) => (passengerStatuses[p.id || p.name] || 'pending') === 'pending');
        
        const orderedCoords = [
          ...(userLocation ? [userLocation] : []),
          ...pendingPassengers
            .map((p: any) => passengerCoords[p.id || p.name])
            .filter(Boolean),
          passengerCoords['Jabaquara']
        ].filter(Boolean) as [number, number][];

        if (orderedCoords.length >= 2) {
          try {
            const osrmQuery = orderedCoords.map(c => `${c[1]},${c[0]}`).join(';');
            const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${osrmQuery}?overview=full&geometries=geojson`);
            const osrmData = await osrmRes.json();
            if (osrmData.routes && osrmData.routes.length > 0) {
              const polyline = osrmData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
              setRouteGeometry(polyline);
            }
          } catch (err) {
            console.error("OSRM routing error:", err);
            setRouteGeometry(orderedCoords);
          }
        } else {
          setRouteGeometry([]);
        }
      };
      fetchRoute();
    }
  }, [selectedTrip?.firebaseId, userLocation, passengerStatuses, passengerCoords]);

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      return alert('Preencha todos os campos');
    }
    if (passwordForm.new !== passwordForm.confirm) {
      return alert('As senhas novas não coincidem');
    }

    // Verify current password (which is either the custom password or the first 6 digits of CPF)
    const currentStoredPassword = driverData.password || (driverData.cpf || '').replace(/\D/g, '').substring(0, 6);
    
    if (passwordForm.current !== currentStoredPassword) {
      return alert('Senha atual incorreta');
    }

    try {
      // Find the driver key in Firebase
      const snapshot = await db.ref('drivers').once('value');
      const drivers = snapshot.val();
      let driverKey = null;
      for (const key in drivers) {
        if (drivers[key].id === driverData.id) {
          driverKey = key;
          break;
        }
      }

      if (driverKey) {
        await db.ref(`drivers/${driverKey}/password`).set(passwordForm.new);
        alert('Senha alterada com sucesso!');
        setIsPasswordModalOpen(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
        
        // Update local session
        const newSession = { ...driverData, password: passwordForm.new };
        localStorage.setItem('motorista_session', JSON.stringify(newSession));
        setDriverData(newSession);
      } else {
        alert('Erro ao localizar motorista no banco de dados.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar senha.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24">
      {/* Header */}
      {!selectedTrip && (
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-bold text-lg text-white leading-tight">
                  {activeTab === 'trips' ? 'Minhas Viagens' : activeTab === 'tabela' ? 'Tabela Digital' : activeTab === 'finance' ? 'Financeiro' : activeTab === 'profile' ? 'Meu Perfil' : 'Configurações'}
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  {driverData?.system || 'Sistema PG'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-slate-800/50 rounded-xl text-slate-400 relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-900"></span>
              </button>
            </div>
          </div>
        </header>
      )}

      {selectedTrip && (
        <div className="fixed top-4 left-4 z-40">
          <button 
            onClick={() => {
              setSelectedTrip(null);
              setTripStarted(false);
              setSheetState('half');
            }}
            className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl text-white shadow-2xl active:scale-95 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
      )}

      <main className="max-w-md mx-auto p-4">
        {/* Search Bar */}
        {!selectedTrip && (activeTab === 'trips' || activeTab === 'tabela') && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder={activeTab === 'trips' ? "Buscar viagens..." : "Buscar motoristas na tabela..."}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedTrip ? (
            <motion.div
              key="trip-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative min-h-[calc(100vh-100px)]"
            >
              {/* Map View (Background) */}
              <div className="fixed inset-0 z-0 bg-slate-950">
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  zoomControl={false}
                  style={{ height: '100%', width: '100%' }}
                  key={selectedTrip.id} // Force re-render on trip change to avoid stale map
                >
                  <SmoothMapController center={mapCenter} zoom={mapZoom} />
                  {shouldFitBounds && <FitBounds coords={[
                    ...(userLocation ? [userLocation] : []),
                    ...Object.values(passengerCoords)
                  ]} />}
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  
                  {/* User Location */}
                  {userLocation && (
                    <>
                      <Circle 
                        center={userLocation} 
                        radius={50} 
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} 
                      />
                      <Marker 
                        position={userLocation} 
                        icon={L.divIcon({
                          className: 'user-location-icon',
                          html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
                          iconSize: [16, 16],
                          iconAnchor: [8, 8],
                        })}
                      />
                    </>
                  )}

                  {/* Routing Polyline */}
                  {routeGeometry.length > 0 && (
                    <Polyline 
                      positions={routeGeometry}
                      pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
                    />
                  )}
                  
                  {/* Fallback straight lines if routeGeometry is empty */}
                  {routeGeometry.length === 0 && selectedTrip.passengers && (
                    <Polyline 
                      positions={[
                        ...(userLocation ? [userLocation] : []),
                        ...selectedTrip.passengers
                          .map((p: any) => passengerCoords[p.id || p.name])
                          .filter(Boolean) as [number, number][],
                        ...(passengerCoords['Jabaquara'] ? [passengerCoords['Jabaquara']] : []) as [number, number][]
                      ]}
                      pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
                    />
                  )}
                  
                  {selectedTrip.passengers?.map((p: any, idx: number) => {
                    const coords = passengerCoords[p.id || p.name];
                    if (!coords) return null;
                    
                    const status = passengerStatuses[p.id || p.name] || 'pending';
                    const color = status === 'delivered' ? '#10b981' : status === 'canceled' ? '#ef4444' : '#2563eb';
                    
                    return (
                      <Marker 
                        key={idx} 
                        position={coords} 
                        icon={createNumberedIcon(idx + 1, color)}
                        eventHandlers={{
                          click: () => {
                            setSelectedPassenger(p);
                            setMapCenter(coords);
                            setMapZoom(18);
                            setSheetState('half');
                          }
                        }}
                      />
                    );
                  })}

                  {/* Final Destination Marker */}
                  {passengerCoords['Jabaquara'] && (
                    <Marker 
                      position={passengerCoords['Jabaquara']} 
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: #f59e0b; width: 32px; height: 32px; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><i class="lucide-map-pin"></i></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                      })}
                    >
                      <Popup>
                        <p className="font-bold text-slate-900">Pão de Açúcar Jabaquara</p>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>

                {/* Map Controls */}
                <div className="absolute right-4 top-24 z-10 flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      if (userLocation) setMapCenter(userLocation);
                    }}
                    className="w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-95 transition-all"
                  >
                    <LocateFixed size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setShouldFitBounds(true);
                      setTimeout(() => setShouldFitBounds(false), 500);
                    }}
                    className="w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-95 transition-all"
                  >
                    <Maximize size={20} />
                  </button>
                </div>
              </div>

              {/* Bottom Sheet */}
              <motion.div 
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  const velocity = info.velocity.y;
                  const offset = info.offset.y;

                  if (velocity < -500 || offset < -150) {
                    if (sheetState === 'minimized') setSheetState('half');
                    else if (sheetState === 'half') setSheetState('expanded');
                  } else if (velocity > 500 || offset > 150) {
                    if (sheetState === 'expanded') setSheetState('half');
                    else if (sheetState === 'half') setSheetState('minimized');
                  }
                }}
                initial={{ y: '85%' }}
                animate={{ 
                  y: sheetState === 'expanded' ? '15%' : sheetState === 'half' ? '60%' : '88%' 
                }}
                transition={{ 
                  type: 'spring', 
                  damping: 35, 
                  stiffness: 250,
                  mass: 1
                }}
                className="fixed inset-x-0 bottom-0 z-20 bg-slate-950 border-t border-slate-800 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[82vh] touch-none"
              >
                {/* Drag Handle */}
                <div className="w-full py-6 flex flex-col items-center cursor-grab active:cursor-grabbing">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full mb-3" />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {sheetState === 'expanded' ? 'Recolher Lista' : sheetState === 'half' ? 'Ver Mais Detalhes' : 'Ver Lista de Paradas'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-24">
                  <AnimatePresence mode="wait">
                    {selectedPassenger ? (
                      <motion.div
                        key="stop-detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-white leading-tight">
                              {selectedPassenger.address || selectedPassenger.neighborhood}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-xs text-slate-400 font-medium">
                                {selectedTrip.passengers.indexOf(selectedPassenger) + 1}/{selectedTrip.passengers.length}, {selectedTrip.time}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedPassenger(null)}
                            className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <button 
                            onClick={() => openNavigation(navApp, selectedPassenger.address || selectedPassenger.neighborhood)}
                            className="bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                          >
                            <Navigation size={20} />
                            <span className="text-[10px] font-bold uppercase">Navegar</span>
                          </button>
                          <button 
                            onClick={() => {
                              handleStatusChange(selectedPassenger.id || selectedPassenger.name, 'canceled');
                              setSelectedPassenger(null);
                            }}
                            className="bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all"
                          >
                            <X size={20} />
                            <span className="text-[10px] font-bold uppercase">Não entregue</span>
                          </button>
                          <button 
                            onClick={() => {
                              handleStatusChange(selectedPassenger.id || selectedPassenger.name, 'delivered');
                              setSelectedPassenger(null);
                            }}
                            className="bg-slate-800 hover:bg-green-500/20 hover:text-green-400 text-slate-400 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all"
                          >
                            <Check size={20} />
                            <span className="text-[10px] font-bold uppercase">Entregue</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 group hover:bg-slate-900 transition-all">
                            <div className="flex items-center gap-4">
                              <LayoutList size={18} className="text-slate-500" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Adicionar notas</p>
                                <p className="text-sm text-slate-300">{selectedPassenger.obs || 'Nenhuma nota'}</p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-600" />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 group hover:bg-slate-900 transition-all">
                            <div className="flex items-center gap-4">
                              <MapPin size={18} className="text-slate-500" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Localização</p>
                                <p className="text-sm text-slate-300">
                                  {selectedPassenger.neighborhood || 'Não informado'}, {(!driverData?.system || driverData.system.toLowerCase().includes('pg') || driverData.system.toLowerCase().includes('praia')) ? 'Praia Grande' : 'Mongaguá'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-600" />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 group hover:bg-slate-900 transition-all">
                            <div className="flex items-center gap-4">
                              <Info size={18} className="text-slate-500" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">ID {selectedTrip.passengers.indexOf(selectedPassenger) + 1}</p>
                                <p className="text-sm text-slate-300">{selectedPassenger.name}</p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-600" />
                          </div>
                        </div>

                        <div className="pt-4 space-y-3">
                          <button className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-white transition-colors">
                            <Plus size={20} />
                            <span className="text-sm font-medium">Editar parada</span>
                          </button>
                          <button className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-white transition-colors">
                            <RotateCcw size={20} />
                            <span className="text-sm font-medium">Duplicar parada</span>
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="trip-list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <div className="relative mb-6">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                            type="text"
                            placeholder="Toque para adicionar"
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-slate-500">
                            <Maximize size={18} />
                            <Phone size={18} />
                          </div>
                        </div>

                        <div className="mb-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                            {selectedTrip.passengers.length} paradas • {selectedTrip.time}
                          </p>
                          <h2 className="text-3xl font-bold text-white">Rota de hoje</h2>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-slate-700 rounded-full mt-2" />
                            <div>
                              <p className="text-sm font-bold text-white">Sem pausa</p>
                              <p className="text-[10px] text-slate-500">Toque para agendar uma pausa</p>
                            </div>
                          </div>

                          <div className="relative pl-6 border-l-2 border-slate-800 ml-1 space-y-8">
                            <div className="relative">
                              <div className="absolute -left-[31px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-slate-950" />
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-bold text-white">Ponto de partida</p>
                                  <p className="text-[10px] text-slate-500">Posição do GPS usada ao otimizar</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedTrip.time}</p>
                                </div>
                              </div>
                            </div>

                            {selectedTrip.passengers?.map((passenger: any, idx: number) => {
                              const status = passengerStatuses[passenger.id || passenger.name] || 'pending';
                              return (
                                <div 
                                  key={passenger.id || passenger.name} 
                                  className="relative cursor-pointer group"
                                  onClick={() => {
                                    setSelectedPassenger(passenger);
                                    const coords = passengerCoords[passenger.id || passenger.name];
                                    if (coords) {
                                      setMapCenter(coords);
                                      setMapZoom(18);
                                    }
                                  }}
                                >
                                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-slate-950 ${
                                    status === 'delivered' ? 'bg-green-500' : status === 'canceled' ? 'bg-red-500' : 'bg-slate-700'
                                  }`} />
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-4">
                                      <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                                        {passenger.address || passenger.neighborhood}
                                      </p>
                                      <p className="text-[10px] text-slate-500 truncate">
                                        {passenger.neighborhood}, {(!driverData?.system || driverData.system.toLowerCase().includes('pg') || driverData.system.toLowerCase().includes('praia')) ? 'Praia Grande' : 'Mongaguá'}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <p className="text-[10px] text-blue-400 font-bold uppercase">{arrivalEstimates[passenger.id || passenger.name] || selectedTrip.time}</p>
                                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 ${
                                        status === 'delivered' ? 'bg-green-500/20 text-green-400' : 
                                        status === 'canceled' ? 'bg-red-500/20 text-red-400' : 
                                        'bg-slate-800 text-slate-500'
                                      }`}>
                                        ID {idx + 1} {status === 'delivered' && <Check size={10} />}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Undo Action Toast */}
              <AnimatePresence>
                {lastAction && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-4 right-4 z-[60] bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-white">
                      {lastAction.status === 'delivered' ? 'Marcado como entregue' : 'Viagem cancelada'}
                    </span>
                    <button 
                      onClick={handleUndoAction}
                      className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300 transition-colors"
                    >
                      Desfazer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === 'trips' ? (
            <motion.div
              key="trips-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Trip Filter Toggle */}
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-6">
                <button 
                  onClick={() => setTripFilter('today')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tripFilter === 'today' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Hoje
                </button>
                <button 
                  onClick={() => setTripFilter('history')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tripFilter === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Histórico (30 dias)
                </button>
              </div>

              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="font-bold text-slate-400 uppercase text-xs tracking-widest">
                  {tripFilter === 'today' ? 'Suas Viagens de Hoje' : 'Histórico de Viagens'}
                </h2>
                <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold">
                  {filteredTrips.length} {filteredTrips.length === 1 ? 'Viagem' : 'Viagens'}
                </div>
              </div>

              {filteredTrips.map((trip) => (
                <button 
                  key={trip.firebaseId}
                  onClick={() => {
                    const passengers = trip.passengersSnapshot || [];
                    setSelectedTrip({ ...trip, passengers });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 text-left hover:border-blue-500/50 transition-all group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Car size={60} />
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Horário</p>
                        <p className="text-xl font-bold text-white leading-none">{trip.time}</p>
                        {tripFilter === 'history' && (
                          <p className="text-[10px] text-blue-400 font-bold mt-1">{new Date(trip.date).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        trip.status === 'Em andamento' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Destino</p>
                      <p className="font-bold text-white flex items-center gap-2">
                        <MapPin size={16} className="text-blue-500" /> Jabaquara
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-300">
                          {trip.passengersSnapshot?.length || 0} Passageiros
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-400 font-bold text-xs">
                        Ver Roteiro <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {filteredTrips.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={36} className="text-slate-600" />
                  </div>
                  <h3 className="font-bold text-white mb-1">Nenhuma viagem encontrada</h3>
                  <p className="text-slate-500 text-sm px-12">
                    {searchTerm ? "Tente buscar por outro termo." : "Aguarde novas atribuições do painel central."}
                  </p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'tabela' ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Fila de Motoristas</h2>
                <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold">
                  {filteredTable.length} Ativos
                </div>
              </div>

              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-4 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setTableTab('geral')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tableTab === 'geral' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Geral
                </button>
                <button 
                  onClick={() => setTableTab('lousa')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tableTab === 'lousa' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Lousa
                </button>
                <button 
                  onClick={() => setTableTab('confirmados')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tableTab === 'confirmados' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Confirmados
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800">
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">Vaga</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">Motorista</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTable
                      .filter(item => {
                        const statusData = tableStatus[item.vaga];
                        const status = typeof statusData === 'object' ? statusData.status : statusData || 'Aguardando';
                        if (tableTab === 'lousa') return status === 'Lousa';
                        if (tableTab === 'confirmados') return status === 'Confirmado';
                        return true; // Geral
                      })
                      .map((item, idx) => {
                        const statusData = tableStatus[item.vaga];
                        const status = typeof statusData === 'object' ? statusData.status : statusData || 'Aguardando';
                        const time = typeof statusData === 'object' ? statusData.time : '';
                        
                        return (
                          <tr key={idx} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <span className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center font-mono font-bold text-blue-400 border border-slate-800">
                                {item.vaga}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className={`font-bold text-sm ${item.name === driverData.name ? 'text-blue-400' : 'text-slate-200'} ${status === 'Riscou' ? 'line-through opacity-50' : ''}`}>
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">{item.plate || '---'}</p>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  status === 'Confirmado' ? 'bg-green-500/20 text-green-400' : 
                                  status === 'Baixou' ? 'bg-blue-500/20 text-blue-400' : 
                                  status === 'Riscou' ? 'bg-red-500/20 text-red-400' :
                                  status === 'Lousa' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-slate-800 text-slate-500'
                                }`}>
                                  {status}
                                </span>
                                {time && <span className="text-[9px] text-slate-500 font-mono">{time}</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-start gap-3">
                <Info className="text-blue-400 shrink-0" size={18} />
                <p className="text-[10px] text-blue-300 leading-relaxed font-medium">
                  A lousa digital é atualizada em tempo real. Você pode acompanhar sua posição na fila e o status dos outros motoristas.
                </p>
              </div>
            </motion.div>
          ) : activeTab === 'finance' ? (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={48} /></div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Lucros</p>
                  <p className="text-2xl font-bold text-green-400">R$ {financeMetrics.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown size={48} /></div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Gastos</p>
                  <p className="text-2xl font-bold text-red-400">R$ {financeMetrics.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Main Balance Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><DollarSign size={120} /></div>
                <div className="relative z-10 text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Saldo Líquido</p>
                  <h2 className={`text-5xl font-display font-extrabold mb-2 ${financeMetrics.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    R$ {financeMetrics.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                  <button 
                    onClick={() => setIsTransactionModalOpen(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    <Plus size={16} /> Lançar Gastos/Lucros do Dia
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
                {[
                  { id: 'today', label: 'Hoje' },
                  { id: '7days', label: '7 Dias' },
                  { id: '30days', label: '30 Dias' },
                  { id: 'months', label: 'Mensal' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFinanceFilter(f.id as any)}
                    className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      financeFilter === f.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {financeFilter === 'months' && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                  <Calendar size={16} className="text-slate-500" />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none w-full"
                  />
                </div>
              )}

              {/* Spreadsheet View */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Planilha de Movimentações</h3>
                  <span className="text-[10px] text-slate-500 font-bold">{filteredTransactions.length} Registros</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-950 z-10">
                        <tr className="border-b border-slate-800">
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">Data</th>
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">Descrição</th>
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right">Valor</th>
                          <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => (
                          <tr key={t.firebaseId} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 text-[10px] text-slate-500 font-mono">
                              {new Date(t.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-sm text-slate-200 truncate max-w-[120px]">{t.name}</p>
                              <p className={`text-[10px] uppercase font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'income' ? 'Lucro' : 'Gasto'}
                              </p>
                            </td>
                            <td className={`p-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                              {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleDeleteTransaction(t.firebaseId)}
                                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length > 0 && (
                          <tr className="bg-slate-950/50 font-bold">
                            <td colSpan={2} className="p-4 text-xs text-slate-400 uppercase tracking-widest">Total do Período</td>
                            <td className={`p-4 text-right text-sm ${financeMetrics.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              R$ {financeMetrics.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        )}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-slate-500 text-xs italic">
                              Nenhuma movimentação encontrada para este período.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="w-28 h-28 bg-slate-800 rounded-full mx-auto mb-6 p-1.5 border-2 border-blue-500/30 shadow-2xl">
                  <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-blue-400">
                    <User size={56} />
                  </div>
                </div>
                <h2 className="text-3xl font-display font-extrabold text-white mb-1">{driverData.name}</h2>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="bg-slate-950 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-400 border border-slate-800">
                    {driverData.plate || 'SEM PLACA'}
                  </span>
                  <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-widest">{driverData.status || 'Ativo'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Capacidade</p>
                    <p className="text-lg font-bold text-white">{driverData.capacity || 0} Lugares</p>
                  </div>
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Sistema</p>
                    <p className="text-lg font-bold text-blue-400">{driverData.system || 'PG'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest px-1">Documentação e Contato</h3>
                
                <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Telefone Principal</p>
                    <p className="font-bold text-white text-lg">{driverData.phone || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Validade CNH</p>
                    <p className="font-bold text-white text-lg">
                      {driverData.cnhValidity ? new Date(driverData.cnhValidity).toLocaleDateString('pt-BR') : 'Não informada'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Navigation size={20} />
                    </div>
                    <span className="font-bold text-slate-200">App de Navegação</span>
                  </div>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => {
                        setNavApp('google');
                        db.ref(`drivers`).once('value', (snap) => {
                          const drivers = snap.val();
                          for (const key in drivers) {
                            if (drivers[key].id === driverData.id) {
                              db.ref(`drivers/${key}/settings/navApp`).set('google');
                              break;
                            }
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${navApp === 'google' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                    >
                      Maps
                    </button>
                    <button 
                      onClick={() => {
                        setNavApp('waze');
                        db.ref(`drivers`).once('value', (snap) => {
                          const drivers = snap.val();
                          for (const key in drivers) {
                            if (drivers[key].id === driverData.id) {
                              db.ref(`drivers/${key}/settings/navApp`).set('waze');
                              break;
                            }
                          }
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${navApp === 'waze' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                    >
                      Waze
                    </button>
                  </div>
                </div>
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Bell size={20} />
                    </div>
                    <span className="font-bold text-slate-200">Notificações</span>
                  </div>
                  <button 
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <button 
                  onClick={() => { setConfigModalType('privacy'); setIsConfigModalOpen(true); }}
                  className="w-full p-6 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Shield size={20} />
                    </div>
                    <span className="font-bold text-slate-200">Privacidade</span>
                  </div>
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
                <button 
                  onClick={() => { setConfigModalType('help'); setIsConfigModalOpen(true); }}
                  className="w-full p-6 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <HelpCircle size={20} />
                    </div>
                    <span className="font-bold text-slate-200">Ajuda e Suporte</span>
                  </div>
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full p-6 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Shield size={20} />
                    </div>
                    <span className="font-bold text-slate-200">Alterar Senha</span>
                  </div>
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
                <button 
                  onClick={() => { setConfigModalType('about'); setIsConfigModalOpen(true); }}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <Info size={20} />
                    </div>
                    <span className="font-bold text-slate-200">Sobre o App</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">v2.4.0</span>
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all border border-red-500/20 shadow-lg"
              >
                <LogOut size={20} /> Sair da Conta
              </button>

              <button 
                onClick={() => setIsFinanceSettingsOpen(true)}
                className="w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between hover:bg-slate-800/30 transition-colors shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                    <DollarSign size={20} />
                  </div>
                  <span className="font-bold text-slate-200">Financeiro</span>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Lançamentos do Dia</h3>
                <div className="flex items-center gap-2">
                  {dailyDraft.length > 0 && (
                    <button 
                      onClick={() => setDailyDraft([])}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                  <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 text-slate-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Subiu</label>
                    <input 
                      type="number"
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                      value={newTransaction.subiu}
                      onChange={(e) => setNewTransaction({ ...newTransaction, subiu: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Desceu</label>
                    <input 
                      type="number"
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                      value={newTransaction.desceu}
                      onChange={(e) => setNewTransaction({ ...newTransaction, desceu: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Almoço/Lanche</label>
                    <input 
                      type="number"
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                      value={newTransaction.almoco}
                      onChange={(e) => setNewTransaction({ ...newTransaction, almoco: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Prancheta</label>
                    <input 
                      type="number"
                      placeholder="0,00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                      value={newTransaction.prancheta}
                      onChange={(e) => setNewTransaction({ ...newTransaction, prancheta: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Adicional (+ ou -)</label>
                  <input 
                    type="number"
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    value={newTransaction.adicional}
                    onChange={(e) => setNewTransaction({ ...newTransaction, adicional: e.target.value })}
                  />
                </div>

                <div className="h-px bg-slate-800 my-2" />
                
                <p className="text-[10px] text-slate-500 font-bold uppercase text-center">Ou lançamento simples</p>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Descrição</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ex: Almoço, Combustível..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                      value={newTransaction.name}
                      onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                    />
                    {newTransaction.name && suggestions.filter(s => s.toLowerCase().includes(newTransaction.name.toLowerCase())).length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-20 shadow-xl max-h-[120px] overflow-y-auto">
                        {suggestions.filter(s => s.toLowerCase().includes(newTransaction.name.toLowerCase())).map((s, i) => (
                          <button 
                            key={i}
                            onClick={() => setNewTransaction({ ...newTransaction, name: s })}
                            className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 last:border-0"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Valor Simples (R$)</label>
                  <input 
                    type="number"
                    placeholder="0,00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleAddToDraft}
                    className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold text-xs transition-all active:scale-95"
                  >
                    Adicionar à Lista
                  </button>
                  <button 
                    onClick={handleLaunchDraft}
                    disabled={dailyDraft.length === 0}
                    className={`py-4 rounded-2xl font-bold text-xs transition-all shadow-lg active:scale-95 ${dailyDraft.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                    Lançar na Planilha
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-[150px] overflow-y-auto space-y-2">
                  {dailyDraft.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className={`text-[9px] font-bold uppercase ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.type === 'income' ? 'Lucro' : 'Gasto'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <button onClick={() => handleRemoveFromDraft(item.id)} className="text-slate-600 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {dailyDraft.length === 0 && (
                    <p className="text-center text-slate-600 text-[10px] py-4">Nenhum item adicionado ao rascunho.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {showUndo && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-4 right-4 z-[60] bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between"
            >
              <span className="text-xs font-bold text-white">Lançamento excluído</span>
              <button 
                onClick={handleUndoDelete}
                className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300 transition-colors"
              >
                Desfazer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isFinanceSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFinanceSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Configurações Financeiras</h3>
                <button onClick={() => setIsFinanceSettingsOpen(false)} className="p-2 text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Valores da Lotada</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Subida</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                        value={lotadaSubida}
                        onChange={async (e) => {
                          const val = Number(e.target.value);
                          setLotadaSubida(val);
                          const snapshot = await db.ref('drivers').once('value');
                          const drivers = snapshot.val();
                          for (const key in drivers) {
                            if (drivers[key].id === driverData.id) {
                              await db.ref(`drivers/${key}/settings/lotadaSubida`).set(val);
                              break;
                            }
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Descida</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                        value={lotadaDescida}
                        onChange={async (e) => {
                          const val = Number(e.target.value);
                          setLotadaDescida(val);
                          const snapshot = await db.ref('drivers').once('value');
                          const drivers = snapshot.val();
                          for (const key in drivers) {
                            if (drivers[key].id === driverData.id) {
                              await db.ref(`drivers/${key}/settings/lotadaDescida`).set(val);
                              break;
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Outros Valores</h4>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Valor Passageiro</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                      value={passengerValue}
                      onChange={async (e) => {
                        const val = Number(e.target.value);
                        setPassengerValue(val);
                        const snapshot = await db.ref('drivers').once('value');
                        const drivers = snapshot.val();
                        for (const key in drivers) {
                          if (drivers[key].id === driverData.id) {
                            await db.ref(`drivers/${key}/settings/passengerValue`).set(val);
                            break;
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setIsFinanceSettingsOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm mt-4 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Salvar e Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Alterar Senha</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Senha Atual</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Nova Senha</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Confirmar Nova Senha</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  />
                </div>

                <button 
                  onClick={handleChangePassword}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm mt-4 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {configModalType === 'about' ? 'Sobre o App' : configModalType === 'help' ? 'Ajuda e Suporte' : 'Privacidade'}
                </h3>
                <button onClick={() => setIsConfigModalOpen(false)} className="p-2 text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="text-slate-400 text-sm leading-relaxed space-y-4">
                {configModalType === 'about' && (
                  <>
                    <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-center mb-6">
                      <p className="text-blue-400 font-bold text-lg">Bora de Van</p>
                      <p className="text-[10px] text-blue-300/60 uppercase tracking-widest">Versão 2.4.0</p>
                    </div>
                    <p>O Bora de Van é a plataforma definitiva para gestão de **lotação e executivo**. Focado em eficiência e segurança para motoristas e passageiros.</p>
                    <p>Desenvolvido com as tecnologias mais modernas para garantir que você tenha sempre a melhor experiência em suas rotas.</p>
                  </>
                )}

                {configModalType === 'help' && (
                  <>
                    <p className="font-bold text-white mb-2">Canais de Atendimento:</p>
                    <div className="space-y-3">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                        <MessageCircle className="text-green-400" size={20} />
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">WhatsApp Suporte</p>
                          <p className="text-white font-bold">13 99774-4720</p>
                        </div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                        <Bell className="text-blue-400" size={20} />
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Atendimento</p>
                          <p className="text-white font-bold">Disponível 24h</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4">Nosso suporte está pronto para te ajudar a qualquer momento do dia ou da noite.</p>
                  </>
                )}

                {configModalType === 'privacy' && (
                  <>
                    <p className="font-bold text-white mb-2">Política de Privacidade</p>
                    <p>Sua privacidade é importante para nós. Coletamos apenas os dados necessários para o funcionamento das rotas e segurança dos passageiros.</p>
                    <p>1. Localização: Usada apenas durante as rotas ativas.</p>
                    <p>2. Dados Pessoais: Protegidos e nunca compartilhados com terceiros.</p>
                    <p>3. Logs: Mantemos registros de atividades para sua segurança.</p>
                  </>
                )}
              </div>

              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold text-sm mt-8 transition-all"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {!selectedTrip && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 pb-safe z-40">
          <div className="max-w-md mx-auto flex justify-around p-2">
            <button 
              onClick={() => setActiveTab('trips')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                activeTab === 'trips' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Car size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Viagens</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('tabela')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                activeTab === 'tabela' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LayoutList size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Tabela</span>
            </button>

            <button 
              onClick={() => setActiveTab('finance')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                activeTab === 'finance' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <DollarSign size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Financeiro</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                activeTab === 'profile' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <User size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Perfil</span>
            </button>

            <button 
              onClick={() => setActiveTab('config')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                activeTab === 'config' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Settings size={22} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Config</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

