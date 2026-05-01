
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icons } from './Shared';
import { motion, AnimatePresence } from 'motion/react';

// Fix Leaflet marker icons once
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon creation with canvas-friendly approach
const createHtmlIcon = (color: string, label: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; pointer-events: auto; transform-origin: bottom center;">
            <div style="background-color: ${color}; color: ${color === '#f59e0b' ? '#000' : '#fff'}; border: 2px solid white; font-size: 12px; font-weight: 900; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 2; position: relative; padding: 0 4px;">
                ${label}
            </div>
            <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 12px; height: 12px; background-color: ${color}; border-right: 2px solid white; border-bottom: 2px solid white; box-shadow: 3px 3px 5px rgba(0,0,0,0.3); z-index: 1;"></div>
        </div>
        `,
        iconSize: [28, 34],
        iconAnchor: [14, 34],
    });
};

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    const hasInit = useRef(false);

    useEffect(() => {
        if (!hasInit.current) {
            // Force redraw on first load
            setTimeout(() => {
                map.invalidateSize();
                hasInit.current = true;
            }, 100);
        }
        if (center) {
            map.flyTo(center, zoom, { duration: 1 });
        }
    }, [center, zoom, map]);

    return null;
};

const getGeoCache = () => {
    try {
        return JSON.parse(localStorage.getItem('admin_geo_cache') || '{}');
    } catch { return {}; }
};

const setGeoCache = (key: string, val: [number, number]) => {
    try {
        const cache = getGeoCache();
        cache[key] = val;
        localStorage.setItem('admin_geo_cache', JSON.stringify(cache));
    } catch { }
};

export default function AgendamentosMap({ passengers, trips, systemContext, onClose, theme }: any) {
    const [passengerCoords, setPassengerCoords] = useState<Record<string, [number, number]>>({});
    const [filters, setFilters] = useState({
        pending: true,
        in_progress: true,
        finished: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [recalcSignal, setRecalcSignal] = useState(0);

    const handleReoptimize = () => {
        const cache = getGeoCache();
        
        passengers.forEach((p: any) => {
            const address = (p.address || "").toLowerCase();
            const cleanAddress = address.replace(/(nº?|numero|num)\s*\.?\s*\d+/gi, '')
                                        .replace(/,\s*\d+/g, '')
                                        .replace(/\s\d+\s*$/, '')
                                        .trim();
            const neighborhood = (p.neighborhood || "").toLowerCase();
            let citySuffix = "";
            if (systemContext === 'Pg' || (p.system === 'Pg')) citySuffix = "Praia Grande, SP";
            else if (systemContext === 'Sv' || (p.system === 'Sv')) citySuffix = "São Vicente, SP";
            else if (systemContext === 'Mip' || (p.system === 'Mip')) citySuffix = "Mongaguá, Itanhaém, SP";
            else citySuffix = "Baixada Santista, SP";
            
            const searchStr = `${address}, ${neighborhood}, ${citySuffix}`.trim().toLowerCase();
            const cleanSearchStr = `${cleanAddress}, ${neighborhood}, ${citySuffix}`.trim().toLowerCase();
            const fallbackSearch = `${neighborhood}, ${citySuffix}`.trim().toLowerCase();
            
            delete cache[searchStr];
            delete cache[cleanSearchStr];
            delete cache[fallbackSearch];
        });
        
        localStorage.setItem('admin_geo_cache', JSON.stringify(cache));
        setPassengerCoords({});
        setRecalcSignal(s => s + 1);
    };
    
    // Default centers
    const centers: Record<string, [number, number]> = {
        'Pg': [-24.0089, -46.4128],
        'Sv': [-23.9599, -46.3888],
        'Mip': [-24.1415, -46.7056],
        'Mistura': [-24.0089, -46.4128]
    };
    
    const initialCenter = centers[systemContext] || centers.Pg;
    const [mapCenter] = useState<[number, number]>(initialCenter);
    const [mapZoom] = useState(13);

    const getStatus = (p: any) => {
        const pId = String(p.realId || p.id);
        const trip = trips.find((t: any) => 
            (t.passengerIds || []).map(String).includes(pId)
        );
        
        if (trip) {
            return trip.status === 'Finalizada' ? 'finished' : 'in_progress';
        }
        return 'pending';
    };

    const filteredPassengers = useMemo(() => {
        return passengers.filter((p: any) => {
            const status = getStatus(p);
            return filters[status as keyof typeof filters];
        });
    }, [passengers, trips, filters]);

    useEffect(() => {
        const geocode = async () => {
            if (passengers.length === 0) return;
            setIsLoading(true);
            
            const cache = getGeoCache();
            const currentCoords = { ...passengerCoords };
            let hasNew = false;
            
            const toProcess = [];
            for (const p of passengers) {
                const pId = p.id || p.name;
                if (currentCoords[pId]) continue;

                const address = (p.address || "").toLowerCase();
                const cleanAddress = address.replace(/(nº?|numero|num)\s*\.?\s*\d+/gi, '')
                                            .replace(/,\s*\d+/g, '')
                                            .replace(/\s\d+\s*$/, '')
                                            .trim();
                const neighborhood = (p.neighborhood || "").toLowerCase();
                
                // Add city context for search
                let citySuffix = "";
                let bbox = ""; // minLon,minLat,maxLon,maxLat (Photon)
                let viewbox = ""; // left,top,right,bottom (Nominatim)
                if (systemContext === 'Pg' || (p.system === 'Pg')) {
                    citySuffix = "Praia Grande, SP";
                    bbox = "-46.52,-24.10,-46.33,-23.90";
                    viewbox = "-46.52,-23.90,-46.33,-24.10";
                } else if (systemContext === 'Sv' || (p.system === 'Sv')) {
                    citySuffix = "São Vicente, SP";
                    bbox = "-46.45,-24.00,-46.33,-23.88";
                    viewbox = "-46.45,-23.88,-46.33,-24.00";
                } else if (systemContext === 'Mip' || (p.system === 'Mip')) {
                    citySuffix = "Mongaguá, Itanhaém, SP";
                    bbox = "-46.90,-24.30,-46.50,-24.00";
                    viewbox = "-46.90,-24.00,-46.50,-24.30";
                } else {
                    citySuffix = "Baixada Santista, SP";
                    bbox = "-46.90,-24.30,-46.33,-23.88";
                    viewbox = "-46.90,-23.88,-46.33,-24.30";
                }

                const searchStr = `${address}, ${neighborhood}, ${citySuffix}`.trim();
                const cleanSearchStr = `${cleanAddress}, ${neighborhood}, ${citySuffix}`.trim();
                const cacheKey = searchStr.toLowerCase();

                if (cache[cacheKey]) {
                    currentCoords[pId] = cache[cacheKey];
                    hasNew = true;
                } else if (address || neighborhood) {
                    toProcess.push({ pId, searchStr, cleanSearchStr, cacheKey, bbox, viewbox, neighborhood, citySuffix });
                }
            }

            if (hasNew) setPassengerCoords({ ...currentCoords });

            // Process geocoding sequentially but fast to avoid rate limits
            for (const item of toProcess) {
                try {
                    let result: any = null;
                    
                    const fetchNominatim = async (query: string) => {
                        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${item.viewbox}&bounded=1&limit=1&email=admin@boradevan.com`;
                        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                        return await res.json();
                    };

                    const fetchPhoton = async (query: string) => {
                        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=${item.bbox}&limit=1`;
                        const res = await fetch(url);
                        const data = await res.json();
                        if (data.features) {
                            return data.features.map((f: any) => ({
                                lat: f.geometry.coordinates[1],
                                lon: f.geometry.coordinates[0]
                            }));
                        }
                        return [];
                    };

                    // Try 1: Full Address (Nominatim primarily)
                    try {
                        result = await fetchNominatim(item.searchStr);
                    } catch (e) {
                        result = await fetchPhoton(item.searchStr);
                    }

                    // Try 2: Cleaned Address (No Numbers)
                    if (!result || result.length === 0) {
                        await new Promise(r => setTimeout(r, 1000));
                        try {
                            result = await fetchNominatim(item.cleanSearchStr);
                        } catch (e) {
                            result = await fetchPhoton(item.cleanSearchStr);
                        }
                    }
                    
                    // Try 3: Neighborhood only
                    if (!result || result.length === 0) {
                        const fallbackSearch = `${item.neighborhood || ''}, ${item.citySuffix}`.trim();
                        if (fallbackSearch.length > 5) {
                            await new Promise(r => setTimeout(r, 1000));
                            try {
                                result = await fetchNominatim(fallbackSearch);
                            } catch (e) {
                                result = await fetchPhoton(fallbackSearch);
                            }
                        }
                    }
                    
                    if (result && result.length > 0) {
                        const lat = parseFloat(result[0].lat);
                        const lon = parseFloat(result[0].lon);
                        
                        // Add a tiny random jitter so multiple people at same location don't perfectly overlap
                        const jitter = (Math.random() - 0.5) * 0.001;
                        
                        const coords: [number, number] = [lat + jitter, lon + jitter];
                        currentCoords[item.pId] = coords;
                        setGeoCache(item.cacheKey, coords);
                        setPassengerCoords({ ...currentCoords });
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
                // Rate limit for Nominatim is 1 request per second strictly
                await new Promise(r => setTimeout(r, 1000));
            }
            setIsLoading(false);
        };

        geocode();
    }, [passengers, systemContext, recalcSignal]);

    const getStatusColor = (p: any) => {
        const status = getStatus(p);
        if (status === 'finished') return '#94a3b8'; // Grayish
        if (status === 'in_progress') return '#22c55e'; // Green
        return '#f59e0b'; // Amber
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-slate-950 flex flex-col font-sans"
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                        <Icons.Map size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-lg text-white leading-none uppercase tracking-tight">Mapa de Viagens</h2>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">
                            {passengers.length} Passageiros selecionados
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/60 hover:text-white"
                >
                    <Icons.X size={20} />
                </button>
            </div>

            {/* Map Wrapper */}
            <div className="flex-1 relative bg-slate-900 overflow-hidden">
                <MapContainer 
                    center={mapCenter} 
                    zoom={mapZoom} 
                    zoomControl={false}
                    preferCanvas={true}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    
                    {filteredPassengers.map((p: any) => {
                        const coords = passengerCoords[p.id || p.name];
                        if (!coords) return null;

                        return (
                            <Marker 
                                key={p.id || p.name}
                                position={coords} 
                                icon={createHtmlIcon(getStatusColor(p), String(p.realId || p.id).slice(0, 4))}
                                zIndexOffset={getStatus(p) === 'pending' ? 1000 : 0}
                            >
                                <Popup className="modern-popup">
                                    <div className="p-3 bg-slate-900 text-white rounded-xl min-w-[200px]">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                                <Icons.User size={16} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-sm truncate uppercase">{p.name}</h4>
                                                <p className="text-[10px] opacity-50 truncate">{p.neighborhood}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-xs opacity-70">
                                            <p className="flex items-center gap-2"><Icons.MapPin size={12}/> {p.address}</p>
                                            <p className="flex items-center gap-2"><Icons.Clock size={12}/> {p.time}</p>
                                            <p className="flex items-center gap-2"><Icons.Users size={12}/> {p.passengerCount} passageiro(s)</p>
                                        </div>
                                        <div className={`mt-3 py-1 px-2 rounded-lg text-[10px] font-black uppercase text-center border ${
                                            getStatus(p) === 'finished' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                                            getStatus(p) === 'in_progress' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                            'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                        }`}>
                                            {getStatus(p) === 'finished' ? 'Finalizado' : getStatus(p) === 'in_progress' ? 'Em Viagem' : 'Pendente'}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Filters UI */}
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[180px]">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3 flex items-center gap-2">
                            <Icons.Sliders size={12} /> Status
                        </p>
                        <div className="space-y-3">
                            {[
                                { id: 'pending', color: 'bg-amber-500', label: 'Pendentes' },
                                { id: 'in_progress', color: 'bg-green-500', label: 'Em Viagem' },
                                { id: 'finished', color: 'bg-slate-400', label: 'Finalizadas' }
                            ].map(item => (
                                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={(filters as any)[item.id]} 
                                        onChange={() => setFilters(f => ({ ...f, [item.id]: !(f as any)[item.id] }))}
                                        className="hidden"
                                    />
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                        (filters as any)[item.id] ? `${item.color} border-transparent` : 'border-white/20 bg-white/5'
                                    }`}>
                                        {(filters as any)[item.id] && <Icons.Check size={14} className="text-white" />}
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-tight transition-colors ${
                                        (filters as any)[item.id] ? 'text-white' : 'text-white/40'
                                    }`}>
                                        {item.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="bg-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl animate-pulse">
                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Carregando Pins...</span>
                        </div>
                    ) : (
                        <button 
                            onClick={handleReoptimize}
                            className="bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all"
                        >
                            <Icons.RefreshCw size={14} className="text-white/60" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Reotimizar Pings</span>
                        </button>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xs px-4">
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 pr-6 shadow-2xl flex items-center justify-between gap-4">
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase text-amber-500 leading-none mb-1">Pend.</p>
                            <p className="text-sm font-black text-white">{passengers.filter((p:any) => getStatus(p) === 'pending').length}</p>
                        </div>
                        <div className="w-[1px] h-6 bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase text-green-500 leading-none mb-1">Viaj.</p>
                            <p className="text-sm font-black text-white">{passengers.filter((p:any) => getStatus(p) === 'in_progress').length}</p>
                        </div>
                        <div className="w-[1px] h-6 bg-white/10"></div>
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">Fin.</p>
                            <p className="text-sm font-black text-white">{passengers.filter((p:any) => getStatus(p) === 'finished').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .modern-popup .leaflet-popup-content-wrapper {
                    background: transparent;
                    padding: 0;
                    box-shadow: none;
                }
                .modern-popup .leaflet-popup-content {
                    margin: 0;
                }
                .modern-popup .leaflet-popup-tip-container {
                    display: none;
                }
                .leaflet-container {
                    background-color: #020617 !important;
                }
                .custom-marker {
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .custom-marker:hover {
                    transform: scale(1.5);
                    z-index: 1000 !important;
                }
            `}</style>
        </motion.div>
    );
}
