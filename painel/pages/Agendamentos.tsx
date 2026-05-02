
import React, { useState } from 'react';
import { Icons, Button, IconButton } from '../components/Shared';
import { formatDisplayDate, getTodayDate, calculateTimeSlot, formatTime, sendPassWhatsapp, normalizeTime } from '../utils';
import AgendamentosMap from '../components/AgendamentosMap';
import { AnimatePresence } from 'motion/react';

export default function Agendamentos({ data, theme, setFormData, setModal, dbOp, setSuggestedTrip, setEditingTripId, notify, requestConfirm, systemContext, isTutorialActive, targetDate, onTargetDateHandled, user }: any) {
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [isMapOpen, setIsMapOpen] = useState(false);

    React.useEffect(() => {
        if (targetDate) {
            setSelectedDate(targetDate);
            setCalendarDate(new Date(targetDate + 'T12:00:00'));
            if (onTargetDateHandled) onTargetDateHandled();
        }
    }, [targetDate, onTargetDateHandled]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear(); const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate(); const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay, month, year };
    };

    const copyDaySummary = () => {
        const dayTrips = data.trips.filter((t:any) => t.date === selectedDate).sort((a:any,b:any) => (a.time||'').localeCompare(b.time||''));
        
        if (dayTrips.length === 0) return notify("Nenhuma viagem neste dia para copiar.", "error");
        let summary = `📅 RESUMO DO DIA ${formatDisplayDate(selectedDate)}\n\n`;
        dayTrips.forEach((t:any) => { const pList = data.passengers.filter((p:any)=>(t.passengerIds||[]).includes(p?.id)); summary += `⏰ ${formatTime(t.time)} - ${t.driverName} (${t.status})\n`; pList.forEach((p:any) => summary += `  ${p.name} (${p.neighborhood})\n`); summary += `\n`; });
        navigator.clipboard.writeText(summary);
        notify("Resumo do dia copiado!", "success");
    };

    const copyPassengerData = (p: any) => {
        const text = `📋 DADOS DO PASSAGEIRO\n👤 Nome: ${p.name}\n📱 Telefone: ${p.phone || 'Não informado'}\n📍 Bairro: ${p.neighborhood}\n🏠 Endereço: ${p.address || 'Não informado'}\n⏰ Horário: ${formatTime(p.time)}\n👥 Passageiros: ${p.passengerCount}\n🎒 Malas: ${p.luggageCount || 0}${p.luggageDetails ? ` (${p.luggageDetails})` : ''}`;
        navigator.clipboard.writeText(text);
        notify("Dados do passageiro copiados!", "success");
    };

    const handleCreateTripFromPass = (p: any) => {
        setFormData({ driverId: '', time: p.time, date: p.date });
        setSuggestedTrip({ driver: { name: 'Selecione', capacity: 0, id: '' }, time: p.time, passengers: [p], occupancy: parseInt(p.passengerCount || 1), date: p.date });
        setEditingTripId(null); setModal('trip');
    };

    const openEditTrip = (t: any) => {
        const dr = data.drivers.find((d:any)=>d.id===t.driverId); 
        let pax = [];
        let occ = 0;
        
        const hasSnapshot = t.passengersSnapshot && t.passengersSnapshot.length > 0 && t.passengersSnapshot[0].id !== 'dummy_0';
        const hasLiveIds = t.passengerIds && t.passengerIds.length > 0;

        if (hasSnapshot) {
            pax = t.passengersSnapshot;
            occ = pax.reduce((a:any,b:any)=>a+parseInt(b.passengerCount||1),0);
        } else if (hasLiveIds) {
            pax = data.passengers.filter((p:any)=>(t.passengerIds||[]).includes(p.realId || p.id));
            occ = pax.reduce((a:any,b:any)=>a+parseInt(b.passengerCount||1),0);
        } else if (t.isMadrugada) {
             occ = parseInt(t.pCountSnapshot || t.pCount || 0);
             for(let i=0; i<occ; i++) pax.push({ id: `dummy_${i}`, name: 'Passageiro Madrugada', neighborhood: 'Madrugada', passengerCount: 1 });
        } else {
            pax = [];
            occ = 0;
        }

        let timeToUse = t.time;
        let dateToUse = t.date;

        if (systemContext === 'Mip') {
             const now = new Date();
             timeToUse = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
             dateToUse = getTodayDate();
        }

        setFormData({ driverId: t.driverId, time: timeToUse, date: dateToUse, isMadrugada: !!t.isMadrugada }); 
        setEditingTripId(t.id);
        setSuggestedTrip({ driver: dr || {name: 'Desconhecido', capacity: 0}, time: t.time, passengers: pax, occupancy: occ, date: t.date, vaga: t.vaga });
        setModal('trip');
    };

    const clearPassSchedule = (pid: string) => {
        requestConfirm("Remover Agendamento?", "O passageiro será removido da lista de agendamentos (horário será limpo).", () => {
            dbOp('update', 'passengers', { id: pid, time: '' });
        });
    };

    const handleQuickReschedule = (e: any, p: any) => {
        e.stopPropagation();
        let defaultTime = p.time;
        let defaultDate = p.date;

        // Se for MIP, usa horário de Brasília e data de hoje
        if (systemContext === 'Mip') {
            const now = new Date();
            defaultTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
            defaultDate = getTodayDate();
        }

        setFormData({ id: p.id, time: defaultTime, date: defaultDate, name: p.name });
        setModal('reschedule');
    };

    const { days, firstDay, month, year } = getDaysInMonth(calendarDate);
    const monthName = calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const dayElements = [];
    for(let i = 0; i < firstDay; i++) dayElements.push(<div key={`empty-${i}`} className="h-10"></div>);
    for(let i = 1; i <= days; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isSelected = selectedDate === dateStr;
        const hasTrip = data.trips.some((t:any) => t.date === dateStr); const hasPass = data.passengers.some((p:any) => p.date === dateStr);
        dayElements.push(<button key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-colors ${isSelected ? theme.primary : 'hover:bg-white/5'}`}><span className={`text-sm ${isSelected ? 'font-bold' : 'opacity-80'}`}>{i}</span><div className="flex gap-0.5 mt-0.5">{hasTrip && <div className="w-1 h-1 rounded-full bg-blue-400"></div>}{hasPass && <div className="w-1 h-1 rounded-full bg-green-400"></div>}</div></button>);
    }

    const passOfDayRaw = data.passengers.filter((p:any) => {
        if (p.date !== selectedDate) return false;
        if (systemContext !== 'Mistura' && (p.system || 'Pg') !== systemContext) return false;
        if (!p.time || p.time.trim() === '' || p.time.toLowerCase() === 'sem horário') return false;
        return true;
    });
    const passOfDayMap = new Map();
    passOfDayRaw.forEach((p:any) => {
        const pId = p.realId || p.id;
        if (!passOfDayMap.has(pId)) {
            passOfDayMap.set(pId, p);
        }
    });
    const passOfDay = Array.from(passOfDayMap.values());

    const tripsForSelectedDate = data.trips.filter((t:any) => {
        if (t.date !== selectedDate) return false;
        if (systemContext !== 'Mistura' && (t.system || 'Pg') !== systemContext) return false;
        return true;
    }).sort((a:any,b:any) => (a.time||'').localeCompare(b.time||''));
    const assigned: any[] = []; const pending: any[] = [];
    passOfDay.forEach((p:any) => { 
        const pId = p.realId || p.id;
        const isAssigned = tripsForSelectedDate.some((t:any) => 
            t.status !== 'Cancelada' && 
            (t.passengerIds||[]).map(String).includes(String(pId)) &&
            (systemContext !== 'Mistura' || (t.system || 'Pg') === (p.system || 'Pg')) &&
            normalizeTime(t.time) === normalizeTime(p.time)
        ); 

        if (isAssigned) assigned.push(p); 
        else pending.push(p);
    });
    const pendingPass = pending.sort((a, b) => (a.time||'').localeCompare(b.time||''));
    const assignedPass = assigned.sort((a, b) => (a.time||'').localeCompare(b.time||''));

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {isMapOpen && (
                    <AgendamentosMap 
                        passengers={passOfDay}
                        trips={tripsForSelectedDate}
                        systemContext={systemContext}
                        onClose={() => setIsMapOpen(false)}
                        theme={theme}
                    />
                )}
            </AnimatePresence>
            <div id="tut-calendar-card" className={`${theme.card} ${theme.radius} border ${theme.border} p-4 stagger-in d-1`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg capitalize">{monthName}</h3>
                    <div className="flex gap-2">
                        <button onClick={()=>setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()-1)))} className="p-2 hover:bg-white/10 rounded-lg"><Icons.ChevronLeft size={20}/></button>
                        <button onClick={()=>setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()+1)))} className="p-2 hover:bg-white/10 rounded-lg"><Icons.ChevronRight size={20}/></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs opacity-60">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={`${d}-${i}`}>{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1">{dayElements}</div>
                <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
                    <button onClick={copyDaySummary} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                        <Icons.Copy size={16}/> Copiar Resumo
                    </button>
                    <button onClick={() => setIsMapOpen(true)} className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-blue-500/20">
                        <Icons.Map size={16}/> Ver Mapa do Dia
                    </button>
                </div>
            </div>
            <div className="space-y-4 stagger-in d-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <h3 className="font-bold text-lg">📅 {formatDisplayDate(selectedDate)}</h3>
                    <Button theme={theme} onClick={() => { setFormData({ date: selectedDate }); setModal('rescheduleAll'); }} variant="secondary" className="text-xs py-1 px-2">Reagendar todos</Button>
                </div>
                
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest pl-1 text-amber-500">Pendentes</h4>
                    {(() => {
                        if (pendingPass.length === 0) return <p className="text-sm opacity-40 italic pl-1">Todos os passageiros estão alocados ou sem horário.</p>;
                        
                        const grouped = pendingPass.reduce((acc:any, p:any) => {
                            const t = formatTime(p.time) || 'Sem Horário';
                            if (!acc[t]) acc[t] = [];
                            acc[t].push(p);
                            return acc;
                        }, {});
                        
                        const sortedTimes = Object.keys(grouped).sort();

                        return sortedTimes.map(time => (
                            <div key={time} className="mb-4">
                                <div className="flex items-center gap-2 mb-2 opacity-80">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <span className="font-bold font-mono text-lg">{time}</span>
                                    <div className="h-[1px] bg-white/10 flex-1"></div>
                                </div>
                                <div className="space-y-3 pl-2 border-l border-white/5">
                                    {grouped[time].map((p:any) => (
                                        <div key={p.id} className={`${theme.card} rounded-2xl border border-yellow-500/30 p-5 relative bg-yellow-500/5 overflow-hidden hover:shadow-lg transition-all group`}>
                                            {/* Background ID - Large and Transparent */}
                                            <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 pointer-events-none select-none">
                                                <span className="text-4xl sm:text-6xl font-black text-white/[0.03] tracking-tighter italic">#{p.id}</span>
                                            </div>

                                            {p.source === 'Site' && (
                                                <div className="absolute top-0 right-0 z-20">
                                                    <div className="bg-blue-600 text-white text-[10px] px-4 py-1.5 font-black uppercase rounded-bl-2xl shadow-xl tracking-widest border-l border-b border-white/20">SITE</div>
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-500/30 group-hover:scale-110 transition-transform duration-500">
                                                        <Icons.User size={24} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-black text-lg truncate text-white">{p.name}</h3>
                                                            <span className="text-sm font-bold opacity-80 font-mono bg-white/10 px-3 py-1 rounded-lg border border-white/10">#{p.id}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            <span className="flex items-center gap-1 text-xs opacity-70 font-medium">
                                                                <Icons.MapPin size={12} />
                                                                {p.neighborhood}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs opacity-70 font-medium">
                                                                <Icons.Clock size={12} />
                                                                {formatTime(p.time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex gap-2 items-center">
                                                        <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg" title={p.luggageDetails || ''}>
                                                            <Icons.Briefcase size={12} className="opacity-50"/> {p.luggageCount || 0}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg">
                                                            <Icons.Users size={12} className="opacity-50"/> {p.passengerCount}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            id="tut-btn-reschedule-pass"
                                                            onClick={(e) => !isTutorialActive && handleQuickReschedule(e, p)}
                                                            className={`p-1.5 bg-blue-500/20 text-blue-400 rounded-lg transition-colors active:scale-95 ${isTutorialActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-500/30 cursor-pointer'}`}
                                                            title={isTutorialActive ? "Desativado durante o tutorial" : "Reagendar Passageiro"}
                                                            disabled={isTutorialActive}
                                                        >
                                                            <Icons.Clock size={16} />
                                                        </button>
                                                        <button 
                                                            id="tut-btn-cancel-app"
                                                            onClick={(e) => {
                                                                if (isTutorialActive) return;
                                                                e.stopPropagation();
                                                                clearPassSchedule(p.id);
                                                            }} 
                                                            className={`p-1.5 bg-red-500/20 text-red-400 rounded-lg transition-colors active:scale-95 ${isTutorialActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-500/30 cursor-pointer'}`}
                                                            title={isTutorialActive ? "Desativado durante o tutorial" : "Remover Agendamento"}
                                                            disabled={isTutorialActive}
                                                        >
                                                            <Icons.CalendarX size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                                                <button id="tut-btn-copy-pass" onClick={() => copyPassengerData(p)} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"><Icons.Copy size={16}/> Copiar</button>
                                                <button id="tut-btn-wa-confirm" onClick={() => sendPassWhatsapp(p)} className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/30 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"><Icons.Message size={16}/> WhatsApp</button>
                                                <button onClick={() => handleCreateTripFromPass(p)} className="flex-[1.5] bg-blue-600 text-white hover:bg-blue-500 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"><Icons.Plus size={16}/> Criar Viagem</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-black uppercase tracking-widest pl-1 text-blue-500">Em Viagem</h4>
                    {assignedPass.length > 0 ? (
                        assignedPass.map((p:any) => {
                            const pId = p.realId || p.id;
                            const pSystem = p.system || systemContext;
                            const trip = data.trips.find((t:any) => 
                                t.date === selectedDate && 
                                t.status !== 'Cancelada' && 
                                (t.system || 'Pg') === (pSystem === 'Mistura' ? 'Pg' : pSystem) &&
                                (t.passengerIds||[]).map(String).includes(String(pId))
                            );
                            const isFinalized = trip && trip.status === 'Finalizada';
                            const displayTime = trip ? formatTime(trip.time) : (formatTime(p.time) || 'Sem horário');

                            return (
                                <div key={p.id} className={`${theme.card} rounded-2xl border border-white/5 p-4 relative opacity-60 hover:opacity-100 transition-all overflow-hidden hover:shadow-lg group`}>
                                    {/* Background ID - Large and Transparent */}
                                    <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 pointer-events-none select-none">
                                        <span className="text-4xl sm:text-6xl font-black text-white/[0.03] tracking-tighter italic">#{p.id}</span>
                                    </div>

                                    {p.source === 'Site' && (
                                        <div className="absolute top-0 right-0 z-20">
                                            <div className="bg-blue-600 text-white text-[10px] px-4 py-1.5 font-black uppercase rounded-bl-2xl shadow-xl tracking-widest border-l border-b border-white/20">SITE</div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isFinalized ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'} group-hover:scale-110 transition-transform duration-500`}>
                                                <Icons.User size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-black text-base truncate">{p.name}</h3>
                                                    <span className="text-sm font-bold opacity-80 font-mono bg-white/10 px-2 py-0.5 rounded-md border border-white/10">#{p.id}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    <span className="flex items-center gap-1 text-xs opacity-70 font-medium">
                                                        <Icons.MapPin size={12} />
                                                        {p.neighborhood}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs opacity-70 font-medium">
                                                        <Icons.Clock size={12} />
                                                        {displayTime}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconButton 
                                                theme={theme} 
                                                onClick={() => copyPassengerData(p)} 
                                                icon={Icons.Copy} 
                                                variant="secondary" 
                                                className="p-2"
                                                title="Copiar Dados"
                                            />
                                            <div className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg font-black ${isFinalized ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'}`}>
                                                {isFinalized ? 'Finalizada' : 'Em Viagem'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm opacity-40 italic pl-1">Nenhum.</p>
                    )}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 pl-1">Viagens do Dia</h4>
                    {tripsForSelectedDate.length > 0 ? (
                        tripsForSelectedDate.map((t:any) => { 
                            const pCount = data.passengers.filter((p:any) => (t.passengerIds||[]).includes(p.realId || p.id)).reduce((a:any,b:any)=>a+parseInt(b.passengerCount||1),0); 
                            let statusColor = 'bg-blue-500'; 
                            if(t.status === 'Finalizada') statusColor = 'bg-green-500'; 
                            if(t.status === 'Cancelada') statusColor = 'bg-red-500'; 
                            return (
                                <div key={t.id} className={`${theme.card} ${theme.radius} border ${theme.border} p-4 flex justify-between items-center relative overflow-hidden`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`}></div>
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {t.driverName}
                                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${statusColor.replace('bg-', 'border-').replace('500', '500/50')} ${statusColor.replace('bg-', 'text-').replace('500', '400')} bg-transparent`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <div className="text-xs opacity-70 flex gap-2 mt-1">
                                            <span>🕒 {calculateTimeSlot(t.time, systemContext === 'Mip' ? 30 : 45)}</span>
                                            <span>👥 {pCount} pass</span>
                                        </div>
                                    </div>
                                    <IconButton 
                                        theme={theme} 
                                        onClick={()=> !isTutorialActive && openEditTrip(t)} 
                                        icon={Icons.Edit} 
                                        variant="default" 
                                        disabled={isTutorialActive}
                                        className={isTutorialActive ? 'opacity-30 cursor-not-allowed' : ''}
                                        title={isTutorialActive ? "Desativado durante o tutorial" : "Editar Viagem"}
                                    />
                                </div>
                            ); 
                        })
                    ) : (
                        <p className="text-sm opacity-40 italic pl-1">Nenhuma viagem.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
