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
  Maximize,
  Bug,
  Terminal,
  ListOrdered,
  Pencil,
  Baby
} from 'lucide-react';

/* ... after imports, before components ... */

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onSelect,
  onClose,
  placeholder = "Digite o endereço..."
}: { 
  value: string, 
  onChange: (val: string) => void,
  onSelect: (address: string, neighborhood: string, coords: [number, number]) => void,
  onClose: () => void,
  placeholder?: string
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      try {
        // Photon API with Baixada Santista bias and bbox
        const bbox = "-46.68,-24.16,-46.20,-23.90";
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&lat=-24.0089&lon=-46.4128&bbox=${bbox}&lang=pt&limit=5`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (idx: number) => {
    const feature = suggestions[idx];
    if (!feature) return;
    const props = feature.properties;
    const geom = feature.geometry.coordinates; // [lon, lat]
    const street = props.name || '';
    const houseNumber = props.housenumber ? `, ${props.housenumber}` : '';
    const neighborhood = props.district || props.suburb || props.city || '';
    const fullLabel = `${street}${houseNumber}`;
    onSelect(fullLabel, neighborhood, [geom[1], geom[0]]);
    setShowSuggestions(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        handleSelect(selectedIndex);
      } else if (suggestions.length > 0) {
        handleSelect(0); // Select first if none selected
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input 
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-blue-500/50 rounded-xl py-3 px-4 text-sm text-white outline-none ring-2 ring-blue-500/10 focus:ring-blue-500/30 transition-all font-medium"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" />
          )}
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {showSuggestions && value.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden max-h-64 overflow-y-auto ring-1 ring-white/5 backdrop-blur-xl">
          {suggestions.length > 0 ? (
            suggestions.map((feature: any, idx: number) => {
              const props = feature.properties;
              const street = props.name || '';
              const houseNumber = props.housenumber ? `, ${props.housenumber}` : '';
              const neighborhood = props.district || props.suburb || props.city || '';
              const city = props.city || '';
              const fullLabel = `${street}${houseNumber}`;
              const isSelected = selectedIndex === idx;
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 transition-all flex flex-col gap-0.5 ${
                    isSelected ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className={isSelected ? 'text-blue-400' : 'text-slate-500'} />
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                      {fullLabel}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate ml-5 font-medium">
                    {neighborhood}{city && city !== neighborhood ? `, ${city}` : ''} • {props.state || 'SP'}
                  </p>
                </button>
              );
            })
          ) : !isLoading && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500 font-bold">Nenhum endereço encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
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
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle,
  Polyline,
  useMap,
  Popup
} from 'react-leaflet';
import L from 'leaflet';

// --- Error Tracking (Top Level) ---
const LOG_TO_STORAGE = (type: string, msg: any) => {
  try {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
    const text = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
    logs.push(`[${timestamp}] ${type}: ${text}`);
    localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-200)));
  } catch(e) {}
};

// Only patch if not already patched to avoid recursion in some environments
if (!(window as any).__PR_DEBUG_PATCHED__) {
  (window as any).__PR_DEBUG_PATCHED__ = true;
  const originalError = console.error;
  console.error = (...args) => {
    LOG_TO_STORAGE('CONSOLE.ERROR', args.join(' '));
    originalError.apply(console, args);
  };

  window.addEventListener('error', (e) => {
    LOG_TO_STORAGE('ERROR', `${e.message} (${e.filename}:${e.lineno})`);
  });

  window.addEventListener('unhandledrejection', (e) => {
    LOG_TO_STORAGE('PROMISE REJECTION', e.reason);
  });
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('RENDER ERROR:', error.message, info.componentStack);
    LOG_TO_STORAGE('CRITICAL RENDER ERROR', error.message + '\n' + info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <X size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Algo deu errado</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
            Ocorreu um erro ao carregar esta parte do sistema. O evento foi registrado para suporte.
          </p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full max-w-sm mb-8 text-left overflow-hidden">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Erro Detectado:</p>
            <p className="text-red-400 font-mono text-[10px] break-all max-h-32 overflow-y-auto">{this.state.error?.toString()}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

const SmoothMapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const createNumberedIcon = (number: number, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: scale(1); transition: all 0.3s; font-size: 14px;">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createPlusIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker-plus',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: scale(1); transition: all 0.3s; font-size: 18px;">+</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// --- Map Constants ---
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// --- Cache Utils ---

const getGeoCache = () => {
  try {
    return JSON.parse(localStorage.getItem('geo_cache') || '{}');
  } catch { return {}; }
};

const setGeoCache = (key: string, val: [number, number]) => {
  try {
    const cache = getGeoCache();
    cache[key] = val;
    localStorage.setItem('geo_cache', JSON.stringify(cache));
  } catch {}
};

// --- Utilities ---
const calculateDistance = (p1: [number, number], p2: [number, number]) => {
  if (!p1 || !p2) return 0;
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

const fetchSmartSequence = async (passengers: any[], coords: Record<string, [number, number]>, startLoc: [number, number]) => {
  if (!startLoc || passengers.length < 2) return passengers;
  try {
    const validPassengers = passengers.filter(p => coords[p.id || p.name]);
    const missingCoordsPassengers = passengers.filter(p => !coords[p.id || p.name]);

    const waypoints = [startLoc, ...validPassengers.map(p => coords[p.id || p.name])];
    if (waypoints.length < 2) return passengers;

    const query = waypoints.map(c => `${c[1]},${c[0]}`).join(';');
    // OSRM Trip service for road-aware TSP optimization
    // roundtrip=false lets it end anywhere, source=first starts at user location
    const res = await fetch(`https://router.project-osrm.org/trip/v1/driving/${query}?source=first&roundtrip=false&overview=false`);
    const data = await res.json();

    if (data.code === 'Ok' && data.waypoints) {
      // Map valid passengers to their optimized order index
      const sequenced = validPassengers.map((p, idx) => ({
        passenger: p,
        // The first waypoint in query is startLoc, so passengers start at index 1 in data.waypoints
        tripIndex: data.waypoints[idx + 1].waypoint_index
      }));
      
      // Sort valid passengers based on the tripIndex
      sequenced.sort((a, b) => a.tripIndex - b.tripIndex);

      // Return sequenced + any passengers missing coords at the end
      return [...sequenced.map(item => item.passenger), ...missingCoordsPassengers];
    }
  } catch (e) {
    console.error("Smart optimization failed, using proximity fallback:", e);
  }
  return optimizeRoute(passengers, coords, startLoc);
};

const smartOptimizeTask = async (
  passengers: any[], 
  coords: Record<string, [number, number]>, 
  startLoc: [number, number],
  preferences: Record<string, 'first' | 'auto' | 'last'>
) => {
  const firsts = passengers.filter(p => preferences[p.id || p.name] === 'first');
  const lasts = passengers.filter(p => preferences[p.id || p.name] === 'last');
  const autos = passengers.filter(p => !preferences[p.id || p.name] || preferences[p.id || p.name] === 'auto');

  const optimizeSubset = async (subset: any[], currentStart: [number, number]): Promise<{ optimized: any[], endLoc: [number, number] }> => {
     if (subset.length === 0) return { optimized: [], endLoc: currentStart };
     if (subset.length === 1) {
        return { optimized: subset, endLoc: coords[subset[0].id || subset[0].name] || currentStart };
     }
     const seq = await fetchSmartSequence(subset, coords, currentStart);
     const lastItem = seq[seq.length - 1];
     return { optimized: seq, endLoc: coords[lastItem.id || lastItem.name] || currentStart };
  }

  const { optimized: optFirsts, endLoc: endFirsts } = await optimizeSubset(firsts, startLoc);
  const { optimized: optAutos, endLoc: endAutos } = await optimizeSubset(autos, endFirsts);
  const { optimized: optLasts } = await optimizeSubset(lasts, endAutos);

  return [...optFirsts, ...optAutos, ...optLasts];
};
const getStableFallback = (seed: string | undefined, base: [number, number]): [number, number] => {
  if (!seed) return base;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  // Larger distributed jitter to avoid overlap if geocoding fails
  const latOffset = ((hash % 1000) - 500) / 15000;
  const lngOffset = (((hash >> 8) % 1000) - 500) / 15000;
  return [base[0] + latOffset, base[1] + lngOffset];
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
  return (
    <ErrorBoundary>
      <MotoristaDashboardContent />
    </ErrorBoundary>
  );
}

function MotoristaDashboardContent() {
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
  const [lastRoutedLocation, setLastRoutedLocation] = useState<[number, number] | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [tripFilter, setTripFilter] = useState<'today' | 'history'>('today');
  const [tripSearchTerm, setTripSearchTerm] = useState('');
  const [manualGeocoding, setManualGeocoding] = useState(false);
  const [manualMarker, setManualMarker] = useState<[number, number] | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [stopPreferences, setStopPreferences] = useState<Record<string, 'first' | 'auto' | 'last'>>({});
  const [needsReoptimization, setNeedsReoptimization] = useState(false);
  const navigate = useNavigate();

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressValue, setEditingAddressValue] = useState("");

  const handleUpdateAddress = async (passengerId: string, newAddress: string, newNeighborhood: string, newCoords?: [number, number]) => {
    if (!selectedTrip) return;

    try {
      // Find and update passenger locally
      const updatedPassengers = selectedTrip.passengers.map((p: any) => {
        if ((p.id || p.name) === passengerId) {
          return { ...p, address: newAddress, neighborhood: newNeighborhood };
        }
        return p;
      });

      const updatedTrip = { ...selectedTrip, passengers: updatedPassengers };
      setSelectedTrip(updatedTrip);
      
      // If we have a firebaseId, sync back to Firebase
      if (selectedTrip.firebaseId) {
        const system = driverData.system || 'Pg';
        const tripsPath = system === 'Pg' ? 'trips' : `${system}/trips`;
        await db.ref(`${tripsPath}/${selectedTrip.firebaseId}/passengersSnapshot`).set(updatedPassengers);
      }

      // Update selectedPassenger locally if it's the one we're editing
      if (selectedPassenger && (selectedPassenger.id || selectedPassenger.name) === passengerId) {
        setSelectedPassenger({ ...selectedPassenger, address: newAddress, neighborhood: newNeighborhood });
      }

      // Update coords immediately to avoid redundant geocoding call
      if (newCoords) {
        setPassengerCoords(prev => ({ ...prev, [passengerId]: newCoords }));
        setMapCenter(newCoords);
        setMapZoom(18);
      } else {
        // Fallback: force re-geocoding
        setPassengerCoords(prev => {
          const next = { ...prev };
          delete next[passengerId];
          return next;
        });
      }

      setIsEditingAddress(false);
      setEditingAddressValue("");
    } catch (err) {
      console.error("Error updating address:", err);
      alert("Não foi possível atualizar o endereço. Tente novamente.");
    }
  };

  // Fix Leaflet default icon issue
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Sync with storage only when visible to avoid rendering overhead
  useEffect(() => {
    if (showDebug) {
      const loadLogs = () => {
        try {
          const saved = localStorage.getItem('debug_logs');
          setDebugLogs(saved ? JSON.parse(saved) : []);
        } catch { setDebugLogs([]); }
      };
      loadLogs();
      const interval = setInterval(loadLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [showDebug]);

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

  // Sync with storage only when visible to avoid rendering overhead
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
      setRouteOptimized(true);
      
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
    setIsEditingAddress(false);
    setEditingAddressValue("");
    
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

  // Geocoding effect - Only runs when trip changes
  useEffect(() => {
    setRouteOptimized(false);
    if (selectedTrip && selectedTrip.passengers) {
      const geocodeAll = async () => {
        setIsRouting(true);
        const cache = getGeoCache();
        const systemStr = (driverData?.system || '').toLowerCase();
        const isMongagua = systemStr.includes('mip') || systemStr.includes('mong') || systemStr.includes('mon');
        const cityContext = isMongagua ? 'Mongaguá, SP' : 'Praia Grande, SP';
        const isPG = !isMongagua;
        const viewbox = isPG ? "-46.52,-24.10,-46.33,-23.90" : "-46.68,-24.16,-46.51,-24.03"; 
        
        const baseCoords: Record<string, [number, number]> = {
          'Pg': [-24.0089, -46.4128],
          'Mip': [-24.0928, -46.6206]
        };
        const base = isMongagua ? baseCoords['Mip'] : baseCoords['Pg'];

        setMapCenter(base);
        setMapZoom(13);

        const passengersToGeocode = selectedTrip.passengers || [];
        const initialCoords: Record<string, [number, number]> = {};
        const pendingFetch: any[] = [];

        // 1. Check cache for all first
        passengersToGeocode.forEach((p: any) => {
          const rawAddress = p.address || p.neighborhood;
          const pId = p.id || p.name;
          const cacheKey = `${rawAddress}_${cityContext}`;
          if (cache[cacheKey]) {
            initialCoords[pId] = cache[cacheKey];
          } else if (rawAddress) {
            pendingFetch.push(p);
          }
        });

        // 3. Batch update cached results for speed
        if (Object.keys(initialCoords).length > 0) {
          setPassengerCoords(prev => ({ ...prev, ...initialCoords }));
          const firstPassengerId = passengersToGeocode[0]?.id || passengersToGeocode[0]?.name;
          if (initialCoords[firstPassengerId]) {
            setMapCenter(initialCoords[firstPassengerId]);
            setMapZoom(15);
          }
        }

        const tryGeocodeNominatim = async (q: string, bounded: boolean = true): Promise<[number, number] | null> => {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${viewbox}${bounded ? '&bounded=1' : ''}&limit=1`;
            const response = await fetch(url, { headers: { 'User-Agent': 'BoraDeVanApp/1.2' } });
            const data = await response.json();
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
            }
            return null;
          } catch (e) { return null; }
        };

        // 4. Fetch the rest sequentially to respect rate limits
        for (let i = 0; i < pendingFetch.length; i++) {
          const p = pendingFetch[i];
          const rawAddress = p.address || p.neighborhood;
          const pId = p.id || p.name;
          const cacheKey = `${rawAddress}_${cityContext}`;

          const cleanAddress = (rawAddress || '')
            .replace(/prox\.|próximo|casa|fundos|apto|bloco|nº/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

          const fullQuery = `${cleanAddress}, ${cityContext}, Brazil`;
          
          let result: [number, number] | null = await tryGeocodeNominatim(fullQuery);
          
          if (!result) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit safety
            if (p.neighborhood) result = await tryGeocodeNominatim(`${p.neighborhood}, ${cityContext}, Brazil`);
            if (!result) result = await tryGeocodeNominatim(fullQuery, false);
          }

          const finalCoords: [number, number] = result ? result : getStableFallback(pId, base);
          if (result) setGeoCache(cacheKey, finalCoords);

          setPassengerCoords(prev => ({ ...prev, [pId]: finalCoords }));
          
          if (passengersToGeocode.indexOf(p) === 0) {
            setMapCenter(finalCoords);
            setMapZoom(15);
          }
        }
        setIsRouting(false);
      };
      geocodeAll();
    }
  }, [selectedTrip?.firebaseId, driverData?.system]);

  const handleManualSearch = async (forcedAddress?: string, forcedCoords?: [number, number]) => {
    const query = forcedAddress || tripSearchTerm;
    if (!query.trim()) return;
    setManualGeocoding(true);
    setManualMarker(null);
    if (forcedAddress) setTripSearchTerm(forcedAddress);
    
    try {
      let coords = forcedCoords;
      if (!coords) {
        const sys = (driverData?.system || '').toLowerCase();
        const isMongagua = sys.includes('mip') || sys.includes('mong');
        const city = isMongagua ? 'Mongaguá, SP' : 'Praia Grande, SP';
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', ' + city + ', Brazil')}&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BoraDeVanApp/1.2' } });
        const data = await res.json();
        
        if (data && data.length > 0) {
          coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      }

      if (coords) {
        setManualMarker(coords as [number, number]);
        setMapCenter(coords as [number, number]);
        setMapZoom(18);
        setSheetState('minimized');
      } else {
        alert('Endereço não encontrado. Tente pesquisar com nome de rua e número.');
      }
    } catch (e) {
      alert('Erro na pesquisa. Tente novamente mais tarde.');
    } finally {
      setManualGeocoding(false);
    }
  };

  // Route Optimization effect - Dynamic re-optimization as the driver moves
  useEffect(() => {
    if (userLocation && selectedTrip && selectedTrip.passengers.length > 0 && Object.keys(passengerCoords).length > 0) {
      if (lastRoutedLocation) {
        const dist = calculateDistance(userLocation, lastRoutedLocation) * 111000;
        if (dist < 200 && routeOptimized && !needsReoptimization) return; 
      }
      
      // Skip automatic routing if a manual re-optimization is pending
      if (needsReoptimization && routeOptimized) return;

      const pending = selectedTrip.passengers.filter((p: any) => (passengerStatuses[p.id || p.name] || 'pending') === 'pending');
      const completed = selectedTrip.passengers.filter((p: any) => (passengerStatuses[p.id || p.name] || 'pending') !== 'pending');
      
      const updateSequence = async () => {
        const optimizedPending = await smartOptimizeTask(pending, passengerCoords, userLocation, stopPreferences);
        setSelectedTrip(prev => ({ ...prev, passengers: [...completed, ...optimizedPending] }));
        setRouteOptimized(true);
        setNeedsReoptimization(false);
      };

      updateSequence();
    }
  }, [userLocation, passengerCoords, selectedTrip?.firebaseId, passengerStatuses, needsReoptimization]);

  // Routing effect - Runs when location or status changes
  useEffect(() => {
    if (selectedTrip && selectedTrip.passengers && Object.keys(passengerCoords).length > 0) {
      const fetchRoute = async () => {
        // Only recalculate if user moved more than 100 meters or it's the first time
        if (userLocation && lastRoutedLocation) {
          const dist = calculateDistance(userLocation, lastRoutedLocation) * 111000; // approx meters
          if (dist < 100) return; 
        }

        const pendingPassengers = selectedTrip.passengers.filter((p: any) => (passengerStatuses[p.id || p.name] || 'pending') === 'pending');
        
        if (pendingPassengers.length > 0 && userLocation) {
          setIsRouting(true);
          try {
            const orderedCoords = [
              userLocation,
              ...pendingPassengers
                .map((p: any) => passengerCoords[p.id || p.name])
                .filter(Boolean)
            ].filter(Boolean) as [number, number][];

            if (orderedCoords.length >= 2) {
              const osrmQuery = orderedCoords.map(c => `${c[1]},${c[0]}`).join(';');
              const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${osrmQuery}?overview=full&geometries=geojson`);
              const osrmData = await osrmRes.json();
              
              if (osrmData.routes && osrmData.routes.length > 0) {
                const polyline = osrmData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
                setRouteGeometry(polyline);
                setLastRoutedLocation(userLocation);
              } else {
                setRouteGeometry(orderedCoords);
              }
            } else {
              setRouteGeometry([]);
            }
          } catch (err) {
            console.error("Routing error:", err);
            // Fallback to straight lines
            const directLines = [userLocation, ...pendingPassengers.map(p => passengerCoords[p.id || p.name])].filter(Boolean) as [number, number][];
            setRouteGeometry(directLines);
          } finally {
            setIsRouting(false);
          }
        } else {
          setRouteGeometry([]);
          setIsRouting(false);
        }
      };

      const timer = setTimeout(fetchRoute, 1000); // 1s debounce
      return () => clearTimeout(timer);
    }
  }, [selectedTrip?.firebaseId, selectedTrip?.passengers, userLocation, passengerStatuses, passengerCoords]);

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

      <main className={selectedTrip ? "" : "max-w-md mx-auto p-4"}>
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

        <AnimatePresence mode="popLayout">
          {selectedTrip ? (
            <motion.div
              key={`trip-${selectedTrip.firebaseId || selectedTrip.id || 'current'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-[100dvh]"
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedTrip(null);
                      setRouteOptimized(false);
                      setPassengerCoords({});
                    }}
                    className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">{selectedTrip.time} • {selectedTrip.route || 'Rota Local'}</h2>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-0.5">Mapa de Roteiro</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      // Clear specific trip cache to force fresh geocoding
                      localStorage.removeItem('geo_cache');
                      setRouteOptimized(false);
                      setPassengerCoords({});
                    }}
                    className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center active:rotate-180 transition-all duration-500"
                    title="Recarregar Mapa"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <div className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                    Ao Vivo
                  </div>
                </div>
              </div>

              {/* Map View (Background) */}
              <div className="absolute inset-0 z-0 bg-slate-950">
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  zoomControl={false}
                  preferCanvas={true}
                  style={{ height: '100%', width: '100%' }}
                  key={selectedTrip.firebaseId || selectedTrip.id || 'map'}
                >
                  <SmoothMapController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  
                  {/* User Location */}
                  {userLocation && (
                    <>
                      <Circle 
                        center={userLocation} 
                        radius={100} 
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} 
                      />
                      <Marker 
                        position={userLocation} 
                        zIndexOffset={1000}
                        icon={L.divIcon({
                          className: 'user-location-icon',
                          html: `<div style="position: relative;">
                                  <div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8); z-index: 2;"></div>
                                  <div style="position: absolute; top: -10px; left: -10px; background-color: #3b82f6; width: 34px; height: 34px; border-radius: 50%; opacity: 0.2; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                                </div>`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10],
                        })}
                      />
                    </>
                  )}

                  {/* Routing Polyline */}
                  {routeGeometry.length > 0 && (
                    <>
                      <Polyline 
                        positions={routeGeometry}
                        pathOptions={{ color: '#3b82f6', weight: 8, opacity: 0.2 }}
                      />
                      <Polyline 
                        positions={routeGeometry}
                        pathOptions={{ color: '#60a5fa', weight: 4, opacity: 1, lineJoin: 'round' }}
                      />
                    </>
                  )}
                  
                  {/* Passenger Markers */}
                  {selectedTrip.passengers?.map((p: any, idx: number) => {
                    const coords = passengerCoords[p.id || p.name];
                    if (!coords) return null;
                    
                    const status = passengerStatuses[p.id || p.name] || 'pending';
                    const color = status === 'delivered' ? '#10b981' : status === 'canceled' ? '#ef4444' : '#2563eb';
                    const isRouted = routeOptimized && !isRouting;

                    return (
                      <Marker 
                        key={p.id || p.name || idx}
                        position={coords}
                        icon={isRouted ? createNumberedIcon(idx + 1, color) : createPlusIcon(color)}
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

                  {/* Manual Search Marker */}
                  {manualMarker && (
                    <Marker 
                      position={manualMarker}
                      icon={L.divIcon({
                        className: 'manual-search-icon',
                        html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; animation: bounce 1s infinite alternate;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold text-slate-900 mb-1">Resultado da Busca</p>
                          <p className="text-xs text-slate-600 font-bold">{tripSearchTerm}</p>
                          <button 
                            onClick={() => setManualMarker(null)}
                            className="text-xs text-red-500 font-bold mt-2"
                          >
                            Remover PIN
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>

                {/* Loading Overlay for Routing */}
                <AnimatePresence>
                  {isRouting && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[100] bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
                    >
                      <div className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          <Navigation className="absolute inset-0 m-auto text-blue-400 rotate-45" size={16} />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-sm tracking-tight">Roteirizando Rota</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Calculando melhor caminho...</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {/* Needs Re-optimization Floating Button */}
                <AnimatePresence>
                  {needsReoptimization && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      className="absolute top-24 left-1/2 -translate-x-1/2 z-[100]"
                    >
                      <button 
                        onClick={() => {
                           setRouteOptimized(false); // Force re-eval in the useEffect
                           setNeedsReoptimization(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center gap-2 border border-blue-400/30"
                      >
                        <RotateCcw size={16} /> Reorganizar Rota
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Sheet */}
              <motion.div 
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={1} // Makes it follow the finger 1:1 during drag
                onDragEnd={(_, info) => {
                  const velocity = info.velocity.y;
                  const offset = info.offset.y;

                  // Better snapping logic
                  if (velocity < -500 || offset < -100) {
                    if (sheetState === 'minimized') setSheetState('half');
                    else if (sheetState === 'half') setSheetState('expanded');
                  } else if (velocity > 500 || offset > 100) {
                    if (sheetState === 'expanded') setSheetState('half');
                    else if (sheetState === 'half') setSheetState('minimized');
                  }
                }}
                initial={{ y: '85%' }}
                animate={{ 
                  y: sheetState === 'expanded' ? '15%' : sheetState === 'half' ? '55%' : '88%' 
                }}
                transition={{ 
                  type: 'spring', 
                  damping: 30, 
                  stiffness: 200,
                  mass: 0.8
                }}
                className="fixed inset-x-0 bottom-0 z-20 bg-slate-950 border-t border-slate-800 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
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
                          <div className="flex-1">
                            {isEditingAddress ? (
                              <AddressAutocomplete 
                                value={editingAddressValue}
                                onChange={setEditingAddressValue}
                                onSelect={(addr, neigh, coords) => {
                                  handleUpdateAddress(selectedPassenger.id || selectedPassenger.name, addr, neigh, coords);
                                }}
                                onClose={() => {
                                  setIsEditingAddress(false);
                                  setEditingAddressValue("");
                                }}
                                placeholder="Novo endereço..."
                              />
                            ) : (
                              <div 
                                className="group cursor-pointer"
                                onClick={() => {
                                  setEditingAddressValue(selectedPassenger.address || selectedPassenger.neighborhood);
                                  setIsEditingAddress(true);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Pencil size={12} className="text-blue-400" />
                                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Toque para editar</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                                  {selectedPassenger.address || selectedPassenger.neighborhood}
                                </h2>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-xs text-slate-400 font-medium">
                                {selectedTrip.passengers.indexOf(selectedPassenger) + 1}/{selectedTrip.passengers.length}, {selectedTrip.time}
                              </span>
                            </div>
                          </div>
                          {!isEditingAddress && (
                            <button 
                              onClick={() => setSelectedPassenger(null)}
                              className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-4 shrink-0"
                            >
                              <X size={20} />
                            </button>
                          )}
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

                        {/* Order Preference Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <ListOrdered size={20} className="text-slate-400" />
                            <span className="font-bold text-white text-sm">Ordem</span>
                          </div>
                          <div className="flex bg-slate-800 rounded-lg p-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                            {(['first', 'auto', 'last'] as const).map(prefType => {
                              const currentPref = stopPreferences[selectedPassenger.id || selectedPassenger.name] || 'auto';
                              const label = prefType === 'first' ? 'Primeira' : prefType === 'last' ? 'Última' : 'Automática';
                              const isActive = currentPref === prefType;
                              
                              return (
                                <button
                                  key={prefType}
                                  onClick={() => {
                                    setStopPreferences(prev => ({
                                      ...prev,
                                      [selectedPassenger.id || selectedPassenger.name]: prefType
                                    }));
                                    setNeedsReoptimization(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    isActive ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 group hover:bg-slate-900 transition-all">
                            <div className="flex items-center gap-4">
                              <LayoutList size={18} className="text-slate-500" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Observações</p>
                                <p className="text-sm text-slate-300">{selectedPassenger.observation || selectedPassenger.obs || 'Nenhuma nota'}</p>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-600" />
                          </div>

                          {selectedPassenger.children && selectedPassenger.children.length > 0 && (
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 group hover:bg-slate-900 transition-all">
                              <div className="flex items-center gap-4">
                                <Baby size={18} className="text-pink-400" />
                                <div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Crianças</p>
                                  <p className="text-sm text-slate-300">
                                    {selectedPassenger.children.map((c: any) => `${c.quantity}x (${c.age}a)`).join(', ')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

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
                          <AddressAutocomplete 
                            value={tripSearchTerm}
                            onChange={(val) => setTripSearchTerm(val)}
                            onSelect={(addr, neigh, coords) => handleManualSearch(addr, coords)}
                            onClose={() => setTripSearchTerm("")}
                            placeholder="Buscar passageiro ou Endereço..."
                          />
                          <button 
                             onClick={() => handleManualSearch()}
                             disabled={manualGeocoding}
                             className={`absolute right-2 top-1.5 w-10 h-10 rounded-xl flex items-center justify-center transition-all z-[10] ${
                                manualGeocoding ? 'bg-slate-800 text-slate-600' : 'bg-blue-600/20 text-blue-400 active:scale-90 hover:bg-blue-600/30'
                             }`}
                          >
                            {manualGeocoding ? (
                               <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent animate-spin rounded-full" />
                            ) : (
                               <LocateFixed size={18} />
                            )}
                          </button>
                        </div>

                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                              {selectedTrip.passengers.length} paradas • {selectedTrip.time}
                            </p>
                            <h2 className="text-3xl font-bold text-white">Rota de hoje</h2>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                setIsRouting(true);
                                const pending = selectedTrip.passengers.filter((p: any) => (passengerStatuses[p.id || p.name] || 'pending') === 'pending');
                                const completed = selectedTrip.passengers.filter((p: any) => (passengerStatuses[p.id || p.name] || 'pending') !== 'pending');
                                
                                const optimizedPending = await smartOptimizeTask(pending, passengerCoords, userLocation || mapCenter, stopPreferences);
                                setSelectedTrip({ ...selectedTrip, passengers: [...completed, ...optimizedPending] });
                                setRouteOptimized(true);
                                setIsRouting(false);
                              }}
                              className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
                              title="Otimizar Rota Automatimente"
                            >
                              <ListOrdered size={20} />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Otimizar</span>
                            </button>
                            <button 
                              onClick={() => setIsReorderMode(!isReorderMode)}
                              className={`p-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 ${isReorderMode ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                            >
                              {isReorderMode ? <Check size={20} /> : <GripVertical size={20} />}
                              <span className="text-[10px] font-bold uppercase tracking-tight">{isReorderMode ? 'Pronto' : 'Organizar'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="relative pl-6 border-l-2 border-slate-800 ml-1 space-y-8">
                            {!isReorderMode && (
                              <div className="relative">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-slate-950" />
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-bold text-white">Sua localização</p>
                                    <p className="text-[10px] text-slate-500">Ponto de partida atual</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isReorderMode ? (
                              <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                              >
                                <SortableContext 
                                  items={selectedTrip.passengers.map((p: any) => p.id || p.name)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {selectedTrip.passengers.map((passenger: any) => (
                                    <SortablePassengerItem 
                                      key={passenger.id || passenger.name}
                                      passenger={passenger}
                                      onWhatsApp={(p) => openWhatsApp(p)}
                                      onNavigate={(p) => openNavigation(navApp, p.address || p.neighborhood)}
                                      navApp={navApp}
                                      tripStarted={tripStarted}
                                      status={passengerStatuses[passenger.id || passenger.name] || 'pending'}
                                      onStatusChange={handleStatusChange}
                                      onRevert={handleRevertStatus}
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>
                            ) : (
                              selectedTrip.passengers?.filter((p: any) => {
                                if (!tripSearchTerm) return true;
                                const lower = tripSearchTerm.toLowerCase();
                                return (p.name || '').toLowerCase().includes(lower) || 
                                       (p.address || '').toLowerCase().includes(lower) || 
                                       (p.neighborhood || '').toLowerCase().includes(lower);
                              }).map((passenger: any, idx: number) => {
                                const status = passengerStatuses[passenger.id || passenger.name] || 'pending';
                                return (
                                  <div 
                                    key={passenger.id || passenger.name} 
                                    className="relative cursor-pointer group"
                                    onClick={() => {
                                      setSelectedPassenger(passenger);
                                      setIsEditingAddress(false);
                                      setEditingAddressValue("");
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
                              })
                            )}
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

      {/* Floating Debug Button */}
      <button 
        onClick={() => setShowDebug(true)}
        className="fixed bottom-24 right-4 z-[50] w-10 h-10 bg-red-600/20 backdrop-blur-md border border-red-600/30 rounded-full flex items-center justify-center text-red-400 shadow-xl active:scale-95 transition-all"
      >
        <Bug size={18} />
      </button>

      {/* Debug Logs Modal */}
      <AnimatePresence mode="wait">
        {showDebug && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDebug(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[85vh] z-[101]"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Bug className="text-red-400" size={20} />
                  <h3 className="text-xl font-bold text-white tracking-tight">Logs de Sistema</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(debugLogs.join('\n'));
                      alert('Copiado com sucesso!');
                    }}
                    className="p-2 text-blue-400 hover:text-white transition-colors"
                    title="Copiar tudo"
                  >
                    <Check size={20} />
                  </button>
                  <button 
                    onClick={() => setDebugLogs([])}
                    className="p-2 text-red-400 hover:text-white transition-colors"
                    title="Limpar logs"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button onClick={() => setShowDebug(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[10px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {debugLogs.length === 0 ? (
                  <p className="text-slate-600 italic text-center py-10 underline decoration-dotted decoration-slate-800 underline-offset-4">Nenhum evento registrado no momento.</p>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i} className={`pb-1.5 break-all border-b border-white/5 last:border-0 ${
                      log.includes('ERROR') || log.includes('REJECTION') ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {log}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-medium">Auto-salvamento ativo</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{debugLogs.length}/200 LOGS</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

