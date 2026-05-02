
import React, { useState, useMemo, useEffect } from 'react';
import { Icons, Button, IconButton, EmptyState, ConfirmModal } from '../components/Shared';
import { DonutChart, HorizontalBarChart } from '../components/Charts';
import { getTodayDate, formatDisplayDate } from '../utils';
import { db } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Site({ data, theme, user, systemContext, notify, requestConfirm }: any) {
    const [autoScheduling, setAutoScheduling] = useState<any>({});
    const [showConfirmToggle, setShowConfirmToggle] = useState(false);
    const [targetSystem, setTargetSystem] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState(false);
    const [visitsData, setVisitsData] = useState<any[]>([]);

    // Fetch auto-scheduling status from Firebase
    useEffect(() => {
        const refs = ['Pg', 'Mip', 'Sv'].map(sys => db.ref(`system_settings/${sys}/autoSchedulingEnabled`));
        const listeners = refs.map((ref, idx) => {
            const sys = ['Pg', 'Mip', 'Sv'][idx];
            return ref.on('value', (snap) => {
                setAutoScheduling((prev: any) => ({ ...prev, [sys]: snap.val() !== false }));
            });
        });

        // Fetch visits data
        const visitsRef = db.ref('site_analytics/visits');
        const visitsListener = visitsRef.on('value', (snap) => {
            const val = snap.val();
            if (val) {
                const grouped: any = {};
                Object.keys(val).forEach(date => {
                    grouped[date] = Object.keys(val[date]).length;
                });
                
                const formatted = Object.entries(grouped)
                    .map(([date, count]) => {
                        const [year, month, day] = date.split('-');
                        return {
                            date: `${day}/${month}`,
                            fullDate: date,
                            acessos: count
                        };
                    })
                    .sort((a: any, b: any) => a.fullDate.localeCompare(b.fullDate))
                    .slice(-14); // Last 14 days
                
                setVisitsData(formatted);
            }
        });

        return () => {
            refs.forEach((ref, idx) => ref.off('value', listeners[idx]));
            visitsRef.off('value', visitsListener);
        };
    }, []);

    const stats = useMemo(() => {
        const bookings = data.passengers.filter((p: any) => p.isSiteBooking);
        const destinations: any = {};
        const bookingsByDate: any = {};
        
        bookings.forEach((p: any) => {
            // Usa targetCity como destino para as métricas do site
            const dest = p.targetCity || p.destination || 'Desconhecido';
            destinations[dest] = (destinations[dest] || 0) + 1;
            
            // Formata a data para DD/MM/YYYY
            const rawDate = p.date || 'Desconhecido';
            const displayDate = rawDate !== 'Desconhecido' ? formatDisplayDate(rawDate) : rawDate;
            bookingsByDate[displayDate] = (bookingsByDate[displayDate] || 0) + 1;
        });

        return {
            total: bookings.length,
            destinations: Object.entries(destinations).map(([label, value]) => ({ label, value })),
            byDate: Object.entries(bookingsByDate)
                .map(([label, value]) => ({ label, value }))
                .sort((a: any, b: any) => {
                    // Ordenação correta para datas formatadas DD/MM/YYYY
                    const [dA, mA, yA] = a.label.split('/').map(Number);
                    const [dB, mB, yB] = b.label.split('/').map(Number);
                    return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
                })
                .slice(-7)
        };
    }, [data.passengers]);

    const handleToggle = (sys: string) => {
        setTargetSystem(sys);
        setShowConfirmToggle(true);
    };

    const confirmToggle = async () => {
        if (!targetSystem) return;
        setIsToggling(true);
        const newState = !autoScheduling[targetSystem];
        
        try {
            await db.ref(`system_settings/${targetSystem}/autoSchedulingEnabled`).set(newState);
            
            // Notify admins
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR');
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const notification = {
                id: `toggle_${Date.now()}`,
                message: `Autoagendamento ${newState ? 'LIGADO' : 'DESLIGADO'} para ${targetSystem} por ${user.username} em ${dateStr} às ${timeStr}`,
                timestamp: Date.now(),
                type: 'system',
                system: targetSystem,
                user: user.username
            };
            
            // Push to a notifications node that admins listen to
            await db.ref('admin_notifications').push(notification);
            
            notify(`Autoagendamento ${newState ? 'ativado' : 'desativado'} com sucesso!`, 'success');
        } catch (error) {
            console.error("Error toggling auto-scheduling:", error);
            notify("Erro ao alterar status do autoagendamento.", "error");
        } finally {
            setIsToggling(false);
            setShowConfirmToggle(false);
            setTargetSystem(null);
        }
    };

    const availableSystems = useMemo(() => {
        if (user.username === 'Breno' || user.system === 'Mistura') {
            return ['Pg', 'Mip', 'Sv'];
        }
        return [user.system || 'Pg'];
    }, [user]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestão do Site</h2>
                    <p className="text-sm opacity-50">Controle o autoagendamento e veja o desempenho do site.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availableSystems.map(sys => (
                    <div key={sys} className={`${theme.card} p-6 rounded-3xl border ${theme.border} relative overflow-hidden group`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${autoScheduling[sys] ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    <Icons.Globe size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold">Sistema {sys}</h3>
                                    <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Autoagendamento</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${autoScheduling[sys] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {autoScheduling[sys] ? 'Ativo' : 'Inativo'}
                            </div>
                        </div>
                        
                        <p className="text-xs opacity-60 mb-6">
                            {autoScheduling[sys] 
                                ? "O formulário de reserva está visível para os passageiros no site." 
                                : "O formulário está oculto. Passageiros verão apenas o botão de WhatsApp."}
                        </p>

                        <Button 
                            theme={theme} 
                            variant={autoScheduling[sys] ? 'danger' : 'success'} 
                            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                            onClick={() => handleToggle(sys)}
                        >
                            {autoScheduling[sys] ? 'Desativar Agora' : 'Ativar Agora'}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className={`${theme.card} p-8 rounded-3xl border ${theme.border} flex flex-col min-h-[400px]`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                <Icons.Activity size={20}/>
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">Tráfego do Site</h3>
                                <p className="text-xs opacity-50">Acessos registrados nos últimos 14 dias</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black">{visitsData.reduce((acc, curr) => acc + curr.acessos, 0)}</div>
                            <div className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Total no Período</div>
                        </div>
                    </div>
                    
                    {visitsData.length > 0 ? (
                        <div className="flex-1 w-full" style={{ minHeight: "300px" }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={visitsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="date" stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="currentColor" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="acessos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState title="Sem dados de tráfego" subtitle="Nenhum acesso registrado ainda." />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${theme.card} p-8 rounded-3xl border ${theme.border} flex flex-col min-h-[350px]`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                            <Icons.Map size={20}/>
                        </div>
                        <h3 className="font-black text-lg tracking-tight">Destinos mais Reservados (Site)</h3>
                    </div>
                    {stats.destinations.length ? <HorizontalBarChart data={stats.destinations} theme={theme}/> : <EmptyState title="Sem dados" subtitle="Nenhuma reserva via site registrada ainda." />}
                </div>

                <div className={`${theme.card} p-8 rounded-3xl border ${theme.border} flex flex-col min-h-[350px]`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <Icons.Calendar size={20}/>
                        </div>
                        <h3 className="font-black text-lg tracking-tight">Reservas nos Últimos 7 Dias</h3>
                    </div>
                    {stats.byDate.length ? <HorizontalBarChart data={stats.byDate} theme={theme}/> : <EmptyState title="Sem dados" subtitle="Nenhuma reserva recente via site." />}
                </div>
            </div>

            {showConfirmToggle && (
                <ConfirmModal
                    isOpen={showConfirmToggle}
                    title={autoScheduling[targetSystem!] ? "Desativar Autoagendamento?" : "Ativar Autoagendamento?"}
                    message={
                        <div className="space-y-4">
                            <p>Você está prestes a {autoScheduling[targetSystem!] ? 'desativar' : 'ativar'} o formulário de reservas do site para o sistema <strong>{targetSystem}</strong>.</p>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                                <Icons.AlertTriangle size={16} className="inline mr-2 mb-1"/>
                                <strong>Aviso:</strong> Todos os administradores serão notificados desta ação, incluindo quem realizou e o horário.
                            </div>
                        </div>
                    }
                    onConfirm={confirmToggle}
                    onClose={() => setShowConfirmToggle(false)}
                    confirmText={isToggling ? "Processando..." : "Sim, Confirmar"}
                    theme={theme}
                    type={autoScheduling[targetSystem!] ? 'danger' : 'success'}
                />
            )}
        </div>
    );
}
