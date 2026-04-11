
import React, { useState } from 'react';
import { Icons, Button, IconButton } from '../components/Shared';
import { formatDisplayDate, getTodayDate, formatTime, sendPassWhatsapp } from '../utils';

export default function Passageiros({ data, theme, searchTerm, setFormData, setModal, del, notify, systemContext, dbOp }: any) {
    const [expandedPass, setExpandedPass] = useState<string|null>(null);
    const [activeTab, setActiveTab] = useState<'ativos' | 'bloqueados'>('ativos');

    const filteredList = data.passengers.filter((item:any) => {
        const isBlocked = item.status === 'Bloqueado';
        if (activeTab === 'ativos' && isBlocked) return false;
        if (activeTab === 'bloqueados' && !isBlocked) return false;

        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase().trim();
        return (item.name && item.name.toLowerCase().includes(lower)) || (item.neighborhood && item.neighborhood.toLowerCase().includes(lower)) || (item.phone && item.phone.includes(lower)) || (String(item.id).toLowerCase().includes(lower));
    });

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
            const displayId = String(p.id).startsWith('SITE_') ? String(p.id).replace('_', ' #') : `#${p.id}`;
            
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

            {filteredList.map((item:any, i:number) => (
                <div 
                    key={item.id} 
                    style={{animationDelay: `${i * 50}ms`}} 
                    onClick={() => setExpandedPass(expandedPass === item.id ? null : item.id)} 
                    className={`${theme.card} rounded-2xl border ${item.status === 'Bloqueado' ? 'border-red-500/30 bg-red-500/5' : theme.border} relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 stagger-in group`}
                >
                    {item.source === 'Site' && (
                        <div className="absolute top-0 right-0 z-10">
                            <div className="bg-blue-600 text-white text-[9px] px-3 py-1 font-black uppercase rounded-bl-xl shadow-lg tracking-widest">Site</div>
                        </div>
                    )}
                    
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl ${item.status === 'Bloqueado' ? 'bg-red-500/20 text-red-400' : `${theme.accent} bg-opacity-10 text-current`} flex items-center justify-center shrink-0 border border-current border-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
                                    <Icons.User size={24} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-black text-lg truncate ${item.status === 'Bloqueado' ? 'text-red-400' : theme.text}`}>{item.name}</h3>
                                        {item.status === 'Bloqueado' && (
                                            <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Bloqueado</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="flex items-center gap-1 text-xs opacity-50 font-medium">
                                            <Icons.Phone size={12} />
                                            {item.phone}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs opacity-50 font-medium">
                                            <Icons.MapPin size={12} />
                                            {item.neighborhood}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`p-2 rounded-full ${theme.inner} opacity-30 group-hover:opacity-100 transition-opacity`}>
                                {expandedPass === item.id ? <Icons.ChevronUp size={20}/> : <Icons.ChevronDown size={20}/>}
                            </div>
                        </div>

                        {expandedPass === item.id && (
                            <div className="mt-6 pt-6 border-t border-white/5 space-y-5 expand-content anim-fade">
                                {item.status === 'Bloqueado' && item.blockReason && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                        <span className="block text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Motivo do Bloqueio</span>
                                        <p className="text-red-200/80 text-sm italic leading-relaxed">"{item.blockReason}"</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Calendar size={16} className="opacity-40" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Data e Hora</p>
                                                <p className="text-sm font-bold">{formatDisplayDate(item.date)} • {formatTime(item.time) || 'Sem horário'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Dollar size={16} className="opacity-40" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Pagamento</p>
                                                <p className="text-sm font-bold">{item.payment} <span className="opacity-40 font-medium">{item.paymentMethod ? `(${item.paymentMethod})` : ''}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Users size={16} className="opacity-40" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Passageiros</p>
                                                <p className="text-sm font-bold">{item.passengerCount} {item.passengerCount > 1 ? 'pessoas' : 'pessoa'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 border border-white/5`}>
                                                <Icons.Briefcase size={16} className="opacity-40" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-black opacity-30 tracking-widest">Bagagem</p>
                                                <p className="text-sm font-bold">{item.luggageCount || 0} malas <span className="opacity-40 font-medium">{item.luggageDetails ? `(${item.luggageDetails})` : ''}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`${theme.inner} p-4 rounded-2xl border border-white/5`}>
                                    <p className="text-[9px] uppercase font-black opacity-30 tracking-widest mb-2">Endereço Completo</p>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {item.address}
                                        {item.reference && <span className="block mt-1 text-xs opacity-50 italic">Ref: {item.reference}</span>}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <Button theme={theme} onClick={(e:any)=>handleEdit(e, item)} variant="secondary" className="flex-1 min-w-[140px] py-3 rounded-xl font-bold" icon={Icons.Edit}>Editar / Agendar</Button>
                                    <div className="flex gap-2">
                                        <IconButton theme={theme} variant="default" onClick={(e:any)=>{e.stopPropagation(); copyPassengerData(item)}} icon={Icons.Copy} className="rounded-xl w-12 h-12" />
                                        {item.phone && <IconButton theme={theme} variant="success" onClick={(e:any)=>{e.stopPropagation(); sendPassWhatsapp(item)}} icon={Icons.Message} title="WhatsApp" className="rounded-xl w-12 h-12" />}
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
            {!filteredList.length && <div className="text-center opacity-50 py-10">Nenhum passageiro {activeTab === 'bloqueados' ? 'bloqueado' : ''}.</div>}
        </div>
    );
}
