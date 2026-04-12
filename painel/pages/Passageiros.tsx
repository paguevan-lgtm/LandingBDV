
import React, { useState } from 'react';
import { Icons, Button, IconButton } from '../components/Shared';
import { formatDisplayDate, getTodayDate, formatTime, sendPassWhatsapp } from '../utils';

export default function Passageiros({ data, theme, searchTerm, searchType = 'all', setFormData, setModal, del, notify, systemContext, dbOp }: any) {
    const [expandedPass, setExpandedPass] = useState<string|null>(null);
    const [activeTab, setActiveTab] = useState<'ativos' | 'bloqueados' | 'site'>('ativos');
    const [limit, setLimit] = useState(50);

    const filteredList = data.passengers.filter((item:any) => {
        const isBlocked = item.status === 'Bloqueado';
        const isSite = String(item.id).startsWith('S');
        
        if (activeTab === 'ativos' && (isBlocked || isSite)) return false;
        if (activeTab === 'bloqueados' && !isBlocked) return false;
        if (activeTab === 'site' && !isSite) return false;

        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase().trim();
        
        if (searchType === 'id') return String(item.id).toLowerCase().includes(lower);
        if (searchType === 'name') return item.name && item.name.toLowerCase().includes(lower);
        if (searchType === 'phone') return item.phone && item.phone.includes(lower);
        
        return (item.name && item.name.toLowerCase().includes(lower)) || (item.neighborhood && item.neighborhood.toLowerCase().includes(lower)) || (item.phone && item.phone.includes(lower)) || (String(item.id).toLowerCase().includes(lower));
    });

    const displayedList = searchTerm ? filteredList : filteredList.slice(0, limit);

    const copyPassengerData = (p: any) => {
        const txt = `*PASSAGEIRO*\n• Nome: ${p.name}\n• Tel: ${p.phone}\n• End: ${p.address}\n• Ref: ${p.reference||''}\n• Bairro: ${p.neighborhood}\n• Pagamento: ${p.payment}\n• Data: ${formatDisplayDate(p.date)} - ${formatTime(p.time)}\n• Qtd: ${p.passengerCount} pessoa(s)`;
        navigator.clipboard.writeText(txt);
        notify('Dados copiados para a área de transferência!', 'success');
    };

    const handleEdit = (e: any, item: any) => {
        e.stopPropagation();
        let timeToUse = item.time;
        
        const now = new Date();
        timeToUse = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
        
        setFormData({...item, date: getTodayDate(), time: timeToUse});
        setModal('passenger');
    };

    const exportVCF = () => {
        if (data.passengers.length === 0) return notify("Nenhum passageiro para exportar.", "error");

        let vcfContent = "";
        data.passengers.forEach((p: any) => {
            // Limpar telefone para o formato padrão se necessário, mas manter como está se já for válido
            const phone = p.phone ? p.phone.replace(/\D/g, '') : '';
            const displayId = `#${p.id}`;
            
            vcfContent += "BEGIN:VCARD\n";
            vcfContent += "VERSION:3.0\n";
            vcfContent += `FN:${p.name} (${displayId})\n`;
            vcfContent += `TEL;TYPE=CELL:${p.phone || ''}\n`;
            vcfContent += "ORG:Bora de Van\n";
            
            let note = `Bairro: ${p.neighborhood || 'N/A'}`;
            if (p.address) note += `\\nEndereço: ${p.address}`;
            if (p.reference) note += `\\nReferência: ${p.reference}`;
            if (p.system) note += `\\nSistema: ${p.system}`;
            if (p.id) note += `\\nID Sistema: ${p.id}`;
            
            vcfContent += `NOTE:${note}\n`;
            vcfContent += "END:VCARD\n";
        });

        const blob = new Blob([vcfContent], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `contatos_bora_de_van_${getTodayDate()}.vcf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        notify(`${data.passengers.length} contatos exportados com sucesso!`, "success");
    };

    return (
        <div className="space-y-3">
            {/* Action Header */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 flex p-1 bg-black/20 rounded-xl border border-white/10">
                    <button 
                        onClick={() => setActiveTab('ativos')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'ativos' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Ativos
                    </button>
                    <button 
                        onClick={() => setActiveTab('site')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'site' ? 'bg-blue-500/20 text-blue-400 shadow-lg border border-blue-500/30' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Site
                    </button>
                    <button 
                        onClick={() => setActiveTab('bloqueados')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'bloqueados' ? 'bg-red-500/20 text-red-400 shadow-lg border border-red-500/30' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Bloqueados
                    </button>
                </div>
                <Button 
                    theme={theme} 
                    onClick={exportVCF} 
                    variant="secondary" 
                    className="sm:w-auto w-full py-2 px-4 text-sm font-bold flex items-center justify-center gap-2"
                    icon={Icons.Download}
                >
                    Exportar Contatos (.vcf)
                </Button>
            </div>

            {displayedList.map((item:any, i:number) => (
                <div 
                    key={item.id} 
                    style={{animationDelay: `${i * 50}ms`}} 
                    onClick={() => setExpandedPass(expandedPass === item.id ? null : item.id)} 
                    className={`${theme.card} rounded-2xl border ${item.status === 'Bloqueado' ? 'border-red-500/30 bg-red-500/5' : theme.border} relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 stagger-in group`}
                >
                    {/* Background ID - Large and Transparent */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-20 pointer-events-none select-none">
                        <span className="text-3xl sm:text-8xl font-black text-white/[0.03] tracking-tighter italic">#{item.id}</span>
                    </div>

                    {item.source === 'Site' && (
                        <div className="absolute top-0 right-0 z-20">
                            <div className="bg-blue-600 text-white text-[10px] px-4 py-1.5 font-black uppercase rounded-bl-2xl shadow-xl tracking-widest border-l border-b border-white/20">SITE</div>
                        </div>
                    )}
                    
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-14 h-14 rounded-2xl ${item.status === 'Bloqueado' ? 'bg-red-500/20 text-red-400' : 'bg-brand-purple/10 text-brand-pink'} flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                    <Icons.User size={28} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h3 className={`font-black text-xl tracking-tight truncate ${item.status === 'Bloqueado' ? 'text-red-400' : theme.text}`}>{item.name}</h3>
                                        <span className="text-[10px] font-black opacity-30 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5">#{item.id}</span>
                                        {item.status === 'Bloqueado' && (
                                            <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter shadow-lg shadow-red-500/20">Bloqueado</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-white/50">
                                            <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Icons.Phone size={12} className="text-brand-pink" />
                                            </div>
                                            {item.phone}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-white/50">
                                            <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Icons.MapPin size={12} className="text-brand-purple" />
                                            </div>
                                            {item.neighborhood}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`w-10 h-10 rounded-xl ${theme.inner} flex items-center justify-center border border-white/5 opacity-40 group-hover:opacity-100 transition-all group-hover:bg-white/10`}>
                                {expandedPass === item.id ? <Icons.ChevronUp size={20}/> : <Icons.ChevronDown size={20}/>}
                            </div>
                        </div>

                        {expandedPass === item.id && (
                            <div className="mt-6 pt-6 border-t border-white/5 space-y-6 expand-content anim-fade">
                                {item.status === 'Bloqueado' && item.blockReason && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                        <span className="block text-[9px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Icons.AlertTriangle size={14} /> Motivo do Bloqueio
                                        </span>
                                        <p className="text-red-200/80 text-sm italic leading-relaxed">"{item.blockReason}"</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                                            <div className={`w-10 h-10 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Calendar size={18} className="text-brand-pink opacity-70" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Última Viagem</p>
                                                <p className="text-sm font-bold text-white/90">{formatDisplayDate(item.date)} • {formatTime(item.time) || 'Sem horário'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                                            <div className={`w-10 h-10 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Dollar size={18} className="text-green-400 opacity-70" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Pagamento</p>
                                                <p className="text-sm font-bold text-white/90">{item.payment} <span className="opacity-40 font-medium">{item.paymentMethod ? `(${item.paymentMethod})` : ''}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                                            <div className={`w-10 h-10 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Users size={18} className="text-blue-400 opacity-70" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Passageiros</p>
                                                <p className="text-sm font-bold text-white/90">{item.passengerCount} {item.passengerCount > 1 ? 'pessoas' : 'pessoa'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                                            <div className={`w-10 h-10 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Briefcase size={18} className="text-orange-400 opacity-70" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Bagagem</p>
                                                <p className="text-sm font-bold text-white/90">{item.luggageCount || 0} malas <span className="opacity-40 font-medium">{item.luggageDetails ? `(${item.luggageDetails})` : ''}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`${theme.inner} p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Icons.MapPin size={48} />
                                    </div>
                                    <p className="text-[9px] uppercase font-black opacity-30 tracking-widest mb-2 flex items-center gap-2">
                                        <Icons.MapPin size={10} /> Endereço Completo
                                    </p>
                                    <p className="text-sm font-bold text-white/80 leading-relaxed">
                                        {item.address}
                                        {item.reference && <span className="block mt-2 text-xs text-brand-pink/60 font-medium italic">Ponto de Referência: {item.reference}</span>}
                                    </p>
                                </div>

                                {item.observation && (
                                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[9px] uppercase font-black opacity-30 tracking-widest mb-2">Observações</p>
                                        <p className="text-xs italic text-white/50 leading-relaxed">"{item.observation}"</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button 
                                        onClick={(e:any)=>handleEdit(e, item)}
                                        className="flex-1 min-w-[160px] bg-gradient-brand text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all border border-white/20"
                                    >
                                        <Icons.Edit size={18} /> Editar / Agendar
                                    </button>
                                    <div className="flex gap-2 flex-1 md:flex-none">
                                        <IconButton theme={theme} variant="default" onClick={(e:any)=>{e.stopPropagation(); copyPassengerData(item)}} icon={Icons.Copy} className="rounded-xl w-12 h-12" />
                                        {item.phone && (
                                            <button 
                                                onClick={(e:any)=>{e.stopPropagation(); sendPassWhatsapp(item)}}
                                                className="w-12 h-12 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20 rounded-xl flex items-center justify-center transition-all"
                                                title="WhatsApp"
                                            >
                                                <Icons.Message size={20} />
                                            </button>
                                        )}
                                        {item.status === 'Bloqueado' ? (
                                            <IconButton theme={theme} variant="success" onClick={(e:any)=>{e.stopPropagation(); dbOp('update', 'passengers', { id: item.id, status: 'Ativo', blockReason: null }); notify('Passageiro desbloqueado!', 'success')}} icon={Icons.Check} title="Desbloquear" className="rounded-xl w-12 h-12" />
                                        ) : (
                                            <IconButton theme={theme} variant="danger" onClick={(e:any)=>{e.stopPropagation(); setFormData(item); setModal('blockPassenger')}} icon={Icons.Slash} title="Bloquear" className="rounded-xl w-12 h-12" />
                                        )}
                                        <IconButton theme={theme} variant="danger" onClick={(e:any)=>{e.stopPropagation(); del('passengers', item.id)}} icon={Icons.Trash} className="rounded-xl w-12 h-12" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {!displayedList.length && <div className="text-center opacity-50 py-10">Nenhum passageiro {activeTab === 'bloqueados' ? 'bloqueado' : ''}.</div>}

            {!searchTerm && limit < filteredList.length && (
                <div className="flex justify-center pt-4 pb-10">
                    <Button 
                        theme={theme} 
                        variant="secondary" 
                        onClick={() => setLimit(prev => prev + 50)}
                        className="px-8 py-3 font-black text-sm flex items-center gap-2 hover:scale-105 transition-all"
                    >
                        <Icons.Plus size={18} /> Carregar mais 50 passageiros
                    </Button>
                </div>
            )}
        </div>
    );
}
