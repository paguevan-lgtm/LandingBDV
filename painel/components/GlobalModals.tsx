
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icons, Input, Button } from './Shared';
import { getTodayDate, capitalize } from '../utils';
import { BAIRROS, BAIRROS_MIP } from '../constants';
import { getAvatarUrl } from '../utils';

export const GlobalModals = ({
    modal,
    setModal,
    aiModal,
    setAiModal,
    aiInput,
    setAiInput,
    isListening,
    toggleMic,
    handleSmartCreate,
    aiLoading,
    theme,
    themeKey,
    formData,
    setFormData,
    suggestedTrip,
    setSuggestedTrip,
    searchId,
    setSearchId,
    addById,
    autoFill,
    removePass,
    confirmTrip,
    simulate,
    save,
    data,
    spList,
    madrugadaList,
    tempVagaMadrugada,
    setTempVagaMadrugada,
    confirmAddMadrugadaVaga,
    vagaToBlock,
    tempJustification,
    setTempJustification,
    confirmMadrugadaBlock,
    saveExtraCharge,
    showNewsModal,
    latestNews,
    markNewsAsSeen,
    systemContext,
    aiPassengerQueue,
    aiPassengerIndex,
    user
}: any) => {

    const bairrosList = systemContext === 'Mip' ? BAIRROS_MIP : BAIRROS;
    const operators = (data.users || []).filter((u: any) => u.role === 'operador' && u.username !== 'Breno');

    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [aiPassengerIndex]);

    const addChild = () => {
        const children = formData.children || [];
        setFormData({ ...formData, children: [...children, { quantity: 1, age: 0 }] });
    };

    const updateChild = (index: number, field: string, value: any) => {
        const children = [...(formData.children || [])];
        children[index] = { ...children[index], [field]: value };
        setFormData({ ...formData, children });
    };

    const removeChild = (index: number) => {
        const children = (formData.children || []).filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, children });
    };

    if (showNewsModal && latestNews) {
        return (
            <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                 <div className="relative w-full max-w-lg animate-bounce-in">
                    {/* Ícone Flutuante (Fora do Container de Scroll) */}
                    <div className="absolute -top-5 -left-5 z-20 bg-amber-500 text-white p-3 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-4 ring-[#0f172a] flex items-center justify-center">
                        <Icons.Bell size={32} />
                    </div>
                    
                    {/* Card com Scroll */}
                    <div className={`${theme.card} w-full p-6 pt-8 rounded-2xl border ${theme.border} shadow-2xl max-h-[85vh] overflow-y-auto`}>
                        <h2 className="text-2xl font-bold mb-1 mt-1 text-amber-400 pl-4">Novidades!</h2>
                        <p className="text-xs opacity-60 mb-4 uppercase tracking-widest pl-4">{latestNews.date}</p>
                        
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                            <h3 className="font-bold text-lg mb-2">{latestNews.title}</h3>
                            {latestNews.image && (
                                <div className="mb-4 rounded-lg overflow-hidden border border-white/10 flex justify-center bg-black/20">
                                    <img 
                                        src={latestNews.image} 
                                        alt="Update" 
                                        className="max-w-full max-h-[40vh] object-contain" 
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            )}
                            <div className="markdown-news">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {latestNews.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                        
                        <Button theme={theme} onClick={markNewsAsSeen} className="w-full">Entendi</Button>
                    </div>
                 </div>
            </div>
        );
    }

    if (aiModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className={`${theme.card} w-full max-w-lg p-6 rounded-2xl border ${theme.border} shadow-2xl`}>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Icons.Stars className="text-amber-400"/> Cadastro Mágico</h3>
                    <p className="text-sm opacity-60 mb-4">Fale ou digite (ex: "João está no Boqueirão rua Jaú 336, telefone XX e vai pagar no Pix")</p>
                    
                    <textarea 
                        id="textarea-magic-input"
                        className="w-full h-32 bg-black/20 p-4 rounded-xl border border-white/10 mb-4 text-base text-white outline-none focus:border-white/30 transition-colors" 
                        value={aiInput} 
                        onChange={(e:any)=>setAiInput(e.target.value)} 
                        placeholder="Digite aqui..."
                    ></textarea>
                    
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={toggleMic} 
                            className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                            <Icons.Mic size={24}/>
                        </button>
                        <div className="flex gap-3">
                            <button onClick={()=>setAiModal(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-bold text-sm">Cancelar</button>
                            <button 
                                onClick={handleSmartCreate} 
                                id="btn-magic-submit"
                                disabled={aiLoading}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-lg font-bold text-white shadow-lg flex items-center gap-2"
                            >
                                {aiLoading ? 'Processando...' : <><Icons.Stars size={16}/> Criar Mágica</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div> 
        );
    }

    if (!modal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <div className={`${theme.card} w-full max-h-[85dvh] md:max-h-[90vh] md:max-w-xl rounded-t-3xl md:rounded-2xl border ${theme.border} shadow-2xl flex flex-col page-transition`}>
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
                    <h2 className="text-xl font-bold">{modal==='trip'?'Criar Viagem':modal==='passenger'?'Passageiro':modal==='driver'?'Motorista':modal==='lostFound'?'Perdido & Achado':modal==='reschedule'?'Reagendar':modal==='extraCharge'?'Cobrança Manual':modal==='madrugadaVaga'?'Vaga Madrugada':modal==='madrugadaBlock'?'Bloquear Vaga':modal==='appointment'?'Novo Agendamento':''}</h2>
                    <button onClick={()=>setModal(null)} className="opacity-50"><Icons.X size={24}/></button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 pb-10">
                    <div className={modal === 'reschedule' || modal === 'driver' ? 'hidden' : ''}>
                        <Input theme={theme} id="input-global-date" label="Data" type="text" mask="date" placeholder="DD/MM/YYYY" maxLength={10} value={formData.date || getTodayDate()} onChange={(e:any)=>setFormData({...formData, date:e.target.value})} />
                    </div>
                    
                    {modal === 'appointment' && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <Input theme={theme} id="input-appointment-passengers" label="Passageiros (ID ou Nome, separados por vírgula)" placeholder="Ex: 123, João, 456, Maria" value={formData.passengerInput || ''} onChange={(e:any)=>setFormData({...formData, passengerInput:e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input theme={theme} id="input-appointment-date" label="Data" type="text" mask="date" placeholder="DD/MM/YYYY" maxLength={10} value={formData.date || ''} onChange={(e:any)=>setFormData({...formData, date:e.target.value})} />
                                <Input theme={theme} id="input-appointment-time" label="Horário (HH:mm)" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.time || ''} onChange={(e:any)=>setFormData({...formData, time:e.target.value})} />
                            </div>
                            <div className="pt-4"><Button theme={theme} id="btn-save-appointment" onClick={()=>save('appointments')}>Salvar Agendamento</Button></div>
                        </div>
                    )}
                    
                    {modal === 'extraCharge' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-200">Aqui você cria cobranças manuais para motoristas cadastrados ou registra carros extras.</div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold opacity-60 ml-1">Tipo de Cobrança</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Cobrança Manual', 'Carro Extra'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setFormData({...formData, type: t})}
                                            className={`py-3 rounded-xl font-bold text-sm border transition-all ${formData.type === t ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.type === 'Cobrança Manual' ? (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold opacity-60 ml-1">Selecionar Motorista</label>
                                    <select 
                                        className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14"
                                        value={formData.driverId || ''}
                                        onChange={(e:any) => {
                                            const dr = data.drivers.find((d:any) => d.id === e.target.value);
                                            if (dr) {
                                                setFormData({
                                                    ...formData, 
                                                    driverId: dr.id, 
                                                    driverName: dr.name,
                                                    phone: dr.phone || (dr.phones && dr.phones[0]?.phone) || ''
                                                });
                                            }
                                        }}
                                    >
                                        <option value="" className="bg-slate-900">Selecione o motorista...</option>
                                        {data.drivers.filter((d:any) => d.status === 'Ativo').sort((a:any, b:any) => a.name.localeCompare(b.name)).map((d:any) => (
                                            <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <Input theme={theme} label="Nome do Motorista" placeholder="Ex: João da Silva" value={formData.driverName || ''} onChange={(e:any)=>setFormData({...formData, driverName:e.target.value})} />
                            )}
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Input theme={theme} label="Valor (R$)" type="number" placeholder="0,00" value={formData.value || ''} onChange={(e:any)=>setFormData({...formData, value:e.target.value})} />
                                <Input theme={theme} label="WhatsApp" placeholder="Ex: 13999999999" value={formData.phone || ''} onChange={(e:any)=>setFormData({...formData, phone:e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input theme={theme} label="Data da Viagem" type="text" mask="date" placeholder="DD/MM/YYYY" maxLength={10} value={formData.date} onChange={(e:any)=>setFormData({...formData, date:e.target.value})} />
                                <Input theme={theme} label="Horário" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.time || ''} onChange={(e:any)=>setFormData({...formData, time:e.target.value})} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold opacity-60 ml-1">Observação (Opcional)</label>
                                <textarea className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 w-full outline-none focus:border-white/50 transition-colors h-20 resize-none" placeholder="Detalhes adicionais..." value={formData.notes || ''} onChange={(e:any)=>setFormData({...formData, notes:e.target.value})} />
                            </div>

                            <div className="pt-4">
                                <Button theme={theme} onClick={saveExtraCharge} icon={Icons.Check} className="w-full">Salvar Cobrança Extra</Button>
                            </div>
                        </div>
                    )}

                    {modal === 'passenger' && (<>
                        {aiPassengerQueue.length > 0 && (
                            <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 p-3 rounded-xl text-center font-bold mb-4">
                                Cadastro Mágico: {aiPassengerIndex + 1} / {aiPassengerQueue.length} passageiros
                            </div>
                        )}
                        <Input themeKey={themeKey} id="input-passenger-name" label="Nome" value={formData.name||''} onChange={(e:any)=>setFormData({...formData, name:e.target.value})} speech={true} />
                        <Input themeKey={themeKey} id="input-passenger-phone" label="Telefone" type="tel" value={formData.phone||''} onChange={(e:any)=>setFormData({...formData, phone:e.target.value})} speech={true} />
                        <Input themeKey={themeKey} id="input-passenger-address" label="Endereço" value={formData.address||''} onChange={(e:any)=>setFormData({...formData, address:e.target.value})} speech={true} />
                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold opacity-60 ml-1">Bairro</label><select id="input-passenger-neighborhood" className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14" value={formData.neighborhood || ''} onChange={(e:any)=>setFormData({...formData, neighborhood:e.target.value})}>{bairrosList.map(b=><option key={b} value={b} className="bg-slate-900">{b}</option>)}</select></div>
                        <Input themeKey={themeKey} id="input-passenger-reference" label="Referência" value={formData.reference||''} onChange={(e:any)=>setFormData({...formData, reference:e.target.value})} speech={true} />
                        <div className="grid grid-cols-2 gap-4"><Input themeKey={themeKey} id="input-passenger-time" label="Horário (HH:mm)" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.time||''} onChange={(e:any)=>setFormData({...formData, time:e.target.value})} /><Input themeKey={themeKey} id="input-passenger-count" label="Qtd Pass" type="number" value={formData.passengerCount||''} onChange={(e:any)=>setFormData({...formData, passengerCount:e.target.value})} /></div>
                        <Input themeKey={themeKey} id="input-passenger-luggage" label="Qtd Malas" type="number" value={formData.luggageCount||''} onChange={(e:any)=>setFormData({...formData, luggageCount:e.target.value})} />
                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold opacity-60 ml-1">Pagamento</label><select id="input-passenger-payment" className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14" value={formData.payment || ''} onChange={(e:any)=>setFormData({...formData, payment:e.target.value})}>{['Dinheiro','Pix','Cartão'].map(x=><option key={x} value={x} className="bg-slate-900">{x}</option>)}</select></div>
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold opacity-60 ml-1">Observação</label>
                            <textarea id="input-passenger-observation" className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 w-full outline-none focus:border-white/50 transition-colors h-24 resize-none" placeholder="Ex: Cuidado ao manusear mala, etc" value={formData.observation || ''} onChange={(e:any)=>setFormData({...formData, observation:e.target.value})} />
                        </div>

                        <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icons.Baby size={18} className="text-brand-pink" />
                                    <span className="text-sm font-black italic uppercase tracking-wider">Crianças</span>
                                </div>
                                <Button theme={theme} variant="secondary" className="h-8 px-3 text-[10px] font-black uppercase" onClick={addChild}>
                                    <Icons.Plus size={14} className="mr-1" /> Add Criança
                                </Button>
                            </div>

                            {(!formData.children || formData.children.length === 0) ? (
                                <p className="text-[10px] opacity-40 text-center py-2 font-bold uppercase tracking-widest">Nenhuma criança cadastrada</p>
                            ) : (
                                <div className="space-y-3">
                                    {formData.children.map((child: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end group">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black opacity-30 uppercase ml-1">Qtd</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-pink/50"
                                                    value={child.quantity}
                                                    onChange={(e) => updateChild(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black opacity-30 uppercase ml-1">Idade</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-pink/50"
                                                    value={child.age}
                                                    onChange={(e) => updateChild(idx, 'age', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => removeChild(idx)}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2.5 rounded-xl transition-all"
                                            >
                                                <Icons.Trash size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5"><label className="text-xs font-bold opacity-60 ml-1">Status</label><select id="input-passenger-status" className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14" value={formData.status || ''} onChange={(e:any)=>setFormData({...formData, status:e.target.value})}>{['Ativo','Inativo'].map(x=><option key={x} value={x} className="bg-slate-900">{x}</option>)}</select></div>
                        <div className="pt-4"><Button themeKey={themeKey} id="btn-save-passenger" onClick={()=>save('passengers')}>Salvar</Button></div>
                    </>)}
                    
                    {modal === 'trip' && (
                        <>
                            {!suggestedTrip ? (
                                <div className="space-y-6">
                                    <div id="btn-trip-madrugada" className={`p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${formData.isMadrugada ? 'bg-indigo-500/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`} onClick={() => setFormData((prev:any) => ({...prev, isMadrugada: !prev.isMadrugada, driverId: '', responsibleUser: !prev.isMadrugada ? user.username : undefined}))}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isMadrugada ? 'bg-indigo-500 border-indigo-500' : 'border-white/30'}`}>{formData.isMadrugada && <Icons.Check size={14} className="text-white"/>}</div>
                                        <div><div className={`font-bold text-sm ${formData.isMadrugada ? 'text-indigo-300' : 'text-white'}`}>Viagem da Madrugada</div><div className="text-xs opacity-50">Filtra motoristas da tabela de madrugada</div></div>
                                    </div>

                                    {formData.isMadrugada && (
                                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3 anim-fade">
                                            <label className="text-xs font-bold text-indigo-300 ml-1 block mb-2">Quem é o responsável por receber desta viagem?</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {operators.map((u: any) => {
                                                    const isSelected = (formData.responsibleUser || (operators.find((op:any) => op.username === user.username) ? user.username : (operators[0]?.username || ''))) === u.username;
                                                    return (
                                                        <div 
                                                            key={u.username}
                                                            onClick={() => setFormData({...formData, responsibleUser: u.username})}
                                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-indigo-500/30 border-indigo-500 ring-1 ring-indigo-500' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                                                        >
                                                            <div className="relative">
                                                                <img 
                                                                    src={u.photoURL || getAvatarUrl(u.username)} 
                                                                    alt={u.username} 
                                                                    className="w-8 h-8 rounded-full object-cover border border-white/20" 
                                                                    referrerPolicy="no-referrer" 
                                                                />
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center border border-white/20">
                                                                        <Icons.Check size={8} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                                                {u.username}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold opacity-60 ml-1">Motorista</label>
                                        <div id="driver-grid-selection" className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar pb-2">
                                            {data.drivers.filter((d:any) => { 
                                                if (formData.isMadrugada) { 
                                                    const driverName = (d.name || '').trim().toLowerCase();
                                                    const spots = spList.filter((s:any) => (s?.name || '').trim().toLowerCase() === driverName);
                                                    return spots.some((s:any) => madrugadaList.includes(s.vaga));
                                                } 
                                                return d.status==='Ativo'; 
                                            }).sort((a:any, b:any) => a.name.localeCompare(b.name)).map((d:any) => {
                                                const isSelected = formData.driverId === d.id;
                                                let subLabel = `${d.capacity} lug`;
                                                if (formData.isMadrugada) {
                                                    const driverName = (d.name || '').trim().toLowerCase();
                                                    const sp = spList.find((s:any) => (s?.name || '').trim().toLowerCase() === driverName && madrugadaList.includes(s.vaga));
                                                    if (sp) subLabel = `Vaga ${sp.vaga} • ${subLabel}`;
                                                }

                                                return (
                                                    <div 
                                                        key={d.id}
                                                        onClick={() => setFormData({...formData, driverId: d.id})}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <img 
                                                                src={getAvatarUrl(d.name)} 
                                                                alt={d.name} 
                                                                className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-sm" 
                                                                referrerPolicy="no-referrer" 
                                                            />
                                                            {isSelected && (
                                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#1e293b]">
                                                                    <Icons.Check size={10} className="text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                                                {(() => {
                                                                    const parts = d.name.trim().split(/\s+/);
                                                                    if (parts.length <= 1) return parts[0] || d.name;
                                                                    const first = parts[0];
                                                                    const last = parts[parts.length - 1];
                                                                    return `${first} ${last[0]}.`;
                                                                })()}
                                                            </div>
                                                            <div className="text-[10px] opacity-50 font-bold truncate tracking-tight">{subLabel}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {formData.isMadrugada ? (<div className="flex flex-col gap-1.5"><label className="text-xs font-bold opacity-60 ml-1">Horário</label><select className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14" value={formData.time || ''} onChange={(e:any)=>setFormData({...formData, time:e.target.value})}><option value="" className="bg-slate-900">Selecione...</option><option value="04:00/04:45" className="bg-slate-900">4:00 as 4:45</option><option value="05:00/05:45" className="bg-slate-900">5:00 as 5:45</option><option value="06:00/06:45" className="bg-slate-900">6:00 as 6:45</option></select></div>) : (<Input themeKey={themeKey} id="input-trip-time" label="Horário (HH:mm)" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.time||''} onChange={(e:any)=>setFormData({...formData, time:e.target.value})} />)}
                                    <Button themeKey={themeKey} id="btn-generate-route" onClick={simulate} icon={Icons.Zap}>Gerar Rota</Button>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="bg-black/10 p-5 rounded-xl border border-white/10 flex-1 flex flex-col">
                                        <div className="flex flex-col gap-1.5 mb-4">
                                            <label className="text-xs font-bold opacity-60">Motorista</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                {data.drivers.filter((d: any) => { 
                                                    if (formData.isMadrugada) { 
                                                        const driverName = (d.name || '').trim().toLowerCase();
                                                        const spots = spList.filter((s:any) => (s?.name || '').trim().toLowerCase() === driverName);
                                                        return spots.some((s:any) => madrugadaList.includes(s.vaga));
                                                    } 
                                                    return d.status === 'Ativo'; 
                                                }).sort((a:any, b:any) => a.name.localeCompare(b.name)).map((d: any) => {
                                                    const isSelected = suggestedTrip.driver?.id === d.id;
                                                    let subLabel = `${d.capacity} lug`;
                                                    if (formData.isMadrugada) {
                                                        const driverName = (d.name || '').trim().toLowerCase();
                                                        const sp = spList.find((s:any) => (s?.name || '').trim().toLowerCase() === driverName && madrugadaList.includes(s.vaga));
                                                        if (sp) subLabel = `Vaga ${sp.vaga} • ${subLabel}`;
                                                    }

                                                    return (
                                                        <div 
                                                            key={d.id}
                                                            onClick={() => {
                                                                setFormData((prev: any) => ({ ...prev, driverId: d.id }));
                                                                setSuggestedTrip((prev: any) => ({ ...prev, driver: d }));
                                                            }}
                                                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                                                        >
                                                            <div className="relative shrink-0">
                                                                <img 
                                                                    src={getAvatarUrl(d.name)} 
                                                                    alt={d.name} 
                                                                    className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-sm" 
                                                                    referrerPolicy="no-referrer" 
                                                                />
                                                                {isSelected && (
                                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#1e293b]">
                                                                        <Icons.Check size={10} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                                                    {(() => {
                                                                        const parts = d.name.trim().split(/\s+/);
                                                                        if (parts.length <= 1) return parts[0] || d.name;
                                                                        const first = parts[0];
                                                                        const last = parts[parts.length - 1];
                                                                        return `${first} ${last[0]}.`;
                                                                    })()}
                                                                </div>
                                                                <div className="text-[10px] opacity-50 font-bold truncate tracking-tight">{subLabel}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-bold text-lg">Resumo</span>
                                            <span className={`text-sm px-3 py-1 rounded-full font-bold ${suggestedTrip.occupancy > (suggestedTrip.driver?.capacity || 0) ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{suggestedTrip.occupancy} / {suggestedTrip.driver?.capacity}</span>
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            <input className="bg-black/20 border border-white/10 rounded-xl px-4 flex-1 h-12" placeholder="ID ou Nome (separados por vírgula)" value={searchId} onChange={(e:any)=>setSearchId(e.target.value)} />
                                            <button onClick={addById} className="bg-white/10 px-4 rounded-xl font-bold h-12">Add</button>
                                        </div>
                                        <button id="btn-trip-autofill" onClick={autoFill} className={`w-full mb-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-white/10 anim-fade ${theme.accent}`}>
                                            <Icons.Refresh size={20}/> 🤖 Puxar Passageiros (Auto)
                                        </button>
                                        <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[40vh] custom-scrollbar">
                                            {suggestedTrip.passengers.map((p:any, i:number) => (
                                                <div key={p.id} className={`${theme.inner} p-4 rounded-2xl border ${theme.divider} flex justify-between items-center shadow-sm hover:shadow-md hover:border-white/20 transition-all group relative overflow-hidden`}>
                                                    {p.source === 'Site' && (
                                                        <div className="absolute top-0 right-0 z-10">
                                                            <div className="bg-blue-600 text-white text-[8px] px-2 py-0.5 font-black uppercase rounded-bl-lg shadow-lg tracking-widest">Site</div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white ${theme.primary} shadow-lg group-hover:scale-110 transition-transform`}>{i+1}</div>
                                                        <div>
                                                            <div className="text-sm font-black flex items-center gap-2">
                                                                {p.name} 
                                                                <span className="text-[9px] opacity-30 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                                                    #{p.id}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-3 mt-1">
                                                                <div className="text-[10px] opacity-50 font-bold uppercase tracking-wider flex items-center gap-1">
                                                                    <Icons.MapPin size={10} /> {p.neighborhood}
                                                                </div>
                                                                {p.time && (
                                                                    <div className="text-[10px] opacity-50 font-bold uppercase tracking-wider flex items-center gap-1">
                                                                        <Icons.Clock size={10} /> {p.time}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right flex flex-col items-end gap-1">
                                                            <div className={`flex items-center gap-1 text-xs font-bold bg-white/5 px-2 py-1 rounded-md ${theme.accent}`}>
                                                                <Icons.Users size={12} className="opacity-50"/> {p.passengerCount}
                                                            </div>
                                                            {p.luggageCount > 0 && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-md opacity-60">
                                                                    <Icons.Briefcase size={10} className="opacity-50"/> {p.luggageCount}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={()=>removePass(p.id)} 
                                                            className="text-red-400/40 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Remover"
                                                        >
                                                            <Icons.Trash size={18}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <Button themeKey={themeKey} variant="secondary" onClick={()=>setSuggestedTrip(null)}>Voltar</Button>
                                        <Button themeKey={themeKey} id="btn-confirm-trip" onClick={confirmTrip} variant="success">Confirmar</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {modal === 'driver' && (
                        <>
                            {formData.id && !formData.cpf && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-200 flex items-center gap-3 mb-4">
                                    <Icons.AlertTriangle size={20} className="shrink-0 text-amber-400"/>
                                    <div>
                                        <span className="font-bold block">Atenção!</span>
                                        Este motorista não possui CPF cadastrado. O preenchimento agora é obrigatório para salvar alterações.
                                    </div>
                                </div>
                            )}
                            <Input themeKey={themeKey} id="input-driver-name" label="Nome" value={formData.name||''} onChange={(e:any)=>setFormData({...formData, name:capitalize(e.target.value)})} />
                             <div className="flex flex-col gap-4">
                                 <div className="flex flex-col gap-2">
                                     <label className="text-xs font-bold opacity-60 ml-1">Telefones</label>
                                     {(formData.phones || [{name: '', phone: ''}]).map((p: any, i: number) => (
                                         <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                                             <input id={`input-driver-phone-name-${i}`} className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14 w-full" placeholder="Nome" value={p.name} onChange={(e:any) => {
                                                 const newPhones = [...(formData.phones || [{name: '', phone: ''}])];
                                                 newPhones[i].name = e.target.value;
                                                 setFormData({...formData, phones: newPhones});
                                             }} />
                                             <input id={`input-driver-phone-val-${i}`} className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14 w-full" placeholder="Telefone" value={p.phone} onChange={(e:any) => {
                                                 const newPhones = [...(formData.phones || [{name: '', phone: ''}])];
                                                 newPhones[i].phone = e.target.value;
                                                 setFormData({...formData, phones: newPhones});
                                             }} />
                                             <Button themeKey={themeKey} variant="danger" className="h-14 w-14 p-0 flex items-center justify-center shrink-0" onClick={() => {
                                                 const newPhones = (formData.phones || [{name: '', phone: ''}]).filter((_:any, index:number) => index !== i);
                                                 setFormData({...formData, phones: newPhones});
                                             }}><Icons.Trash size={16}/></Button>
                                         </div>
                                     ))}
                                     <Button themeKey={themeKey} id="btn-driver-add-phone" variant="secondary" className="h-14" onClick={() => setFormData({...formData, phones: [...(formData.phones || [{name: '', phone: ''}]), {name: '', phone: ''}]})}><Icons.Plus size={16}/> Adicionar Telefone</Button>
                                 </div>
                                 <Input themeKey={themeKey} id="input-driver-cpf" label="CPF" type="text" mask="cpf" placeholder="000.000.000-00" value={formData.cpf||''} onChange={(e:any)=>setFormData({...formData, cpf:e.target.value})} />
                             </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input themeKey={themeKey} id="input-driver-plate" label="Placa" value={formData.plate||''} onChange={(e:any)=>setFormData({...formData, plate:e.target.value})} />
                                <Input themeKey={themeKey} id="input-driver-capacity" label="Capacidade" type="number" value={formData.capacity||''} onChange={(e:any)=>setFormData({...formData, capacity:e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input themeKey={themeKey} id="input-driver-cnh" label="CNH" value={formData.cnh||''} onChange={(e:any)=>setFormData({...formData, cnh:e.target.value})} />
                                <Input themeKey={themeKey} id="input-driver-cnh-validity" label="Validade CNH" type="date" value={formData.cnhValidity||''} onChange={(e:any)=>setFormData({...formData, cnhValidity:e.target.value})} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold opacity-60 ml-1">Status</label>
                                <select id="input-driver-status" className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14" value={formData.status || ''} onChange={(e:any)=>setFormData({...formData, status:e.target.value})}>
                                    {['Ativo','Inativo'].map(x=><option key={x} value={x} className="bg-slate-900">{x}</option>)}
                                </select>
                            </div>
                            <div className="pt-4">
                                <Button themeKey={themeKey} id="btn-save-driver" onClick={()=>save('drivers')}>Salvar</Button>
                            </div>
                        </>
                    )}
                    
                    {modal === 'rescheduleAll' && (
                        <div className="space-y-6 anim-fade">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-200 flex items-center gap-3">
                                <Icons.AlertTriangle size={20} className="shrink-0"/>
                                <div>
                                    <span className="font-bold block">Tem certeza?</span>
                                    Todos os passageiros pendentes serão reagendados.
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input themeKey={themeKey} label="Horário de origem" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.sourceTime || ''} onChange={(e:any) => setFormData({...formData, sourceTime: e.target.value})} />
                                <Input themeKey={themeKey} label="Novo horário" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.newTime || ''} onChange={(e:any) => setFormData({...formData, newTime: e.target.value})} />
                            </div>
                            <div className="pt-2 grid grid-cols-2 gap-3">
                                <Button themeKey={themeKey} variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
                                <Button themeKey={themeKey} onClick={() => { save('rescheduleAll'); }} icon={Icons.Check}>Confirmar</Button>
                            </div>
                        </div>
                    )}
                    
                    {modal === 'reschedule' && (<div className="space-y-6 anim-fade"><div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200 flex items-center gap-3"><Icons.Clock size={20} className="shrink-0"/><div>Defina o novo horário para <span className="font-bold text-white text-base block">{formData.name}</span></div></div><div className="py-2"><Input theme={theme} label="Novo Horário (HH:mm)" type="text" mask="time" placeholder="HH:mm" maxLength={5} value={formData.time || ''} onChange={(e:any) => setFormData({...formData, time: e.target.value})} autoFocus/></div><div className="pt-2 grid grid-cols-2 gap-3"><Button theme={theme} variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button><Button theme={theme} onClick={() => { save('reschedule'); }} icon={Icons.Check}>Salvar</Button></div></div>)}
                    
                    {modal === 'lostFound' && (
                        <>
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs flex items-center gap-2 mb-2">
                                <Icons.Van size={14} className="text-blue-400"/>
                                <span>Cadastrando no sistema: <span className="font-bold text-blue-300">{systemContext}</span></span>
                            </div>
                            <Input themeKey={themeKey} label="O que foi encontrado?" value={formData.description||''} onChange={(e:any)=>setFormData({...formData, description:e.target.value})} placeholder="Ex: Guarda-chuva preto" />
                            <Input themeKey={themeKey} label="Local / Veículo" value={formData.location||''} onChange={(e:any)=>setFormData({...formData, location:e.target.value})} placeholder="Ex: Van do João" />
                            <Input themeKey={themeKey} label="Detalhes Adicionais" value={formData.details||''} onChange={(e:any)=>setFormData({...formData, details:e.target.value})} placeholder="Ex: Banco de trás, lado esquerdo" />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold opacity-60 ml-1">Status</label>
                                <select className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 h-14" value={formData.status || ''} onChange={(e:any)=>setFormData({...formData, status:e.target.value})}>
                                    {['Pendente','Entregue'].map(x=><option key={x} value={x} className="bg-slate-900">{x}</option>)}
                                </select>
                            </div>
                            <div className="pt-4">
                                <Button themeKey={themeKey} onClick={()=>save('lostFound')}>Salvar</Button>
                            </div>
                        </>
                    )}
                    
                    {modal === 'phoneSelection' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">
                                Selecione o telefone para enviar a mensagem:
                            </div>
                            <div className="space-y-2">
                                {(formData.phones || []).map((p: any, i: number) => (
                                    <Button key={i} theme={theme} onClick={() => {
                                        formData.onSelect(p.phone);
                                        setModal(null);
                                    }}>
                                        {p.name || 'Telefone'} - {p.phone}
                                    </Button>
                                ))}
                            </div>
                            <Button theme={theme} variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
                        </div>
                    )}

                    {modal === 'madrugadaVaga' && (<div className="space-y-6"><div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200">Digite o número da vaga do motorista para adicionar à tabela da Madrugada.</div><Input theme={theme} label="Número da Vaga" value={tempVagaMadrugada} onChange={(e:any) => setTempVagaMadrugada(e.target.value)} placeholder="Ex: 05" autoFocus /><div className="pt-4"><Button theme={theme} onClick={confirmAddMadrugadaVaga} icon={Icons.Check}>Confirmar Adição</Button></div></div>)}
                    
                    {modal === 'madrugadaBlock' && (<div className="space-y-6"><div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200">Justifique o por que riscou a vaga <span className="font-bold font-mono">{vagaToBlock}</span> na Madrugada.</div><Input theme={theme} label="Motivo (Opcional)" value={tempJustification} onChange={(e:any) => setTempJustification(e.target.value)} placeholder="Ex: Quebrou, Médico, Folga..." autoFocus /><div className="pt-4 grid grid-cols-2 gap-3"><Button theme={theme} variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button><Button theme={theme} onClick={confirmMadrugadaBlock} icon={Icons.Check} variant="danger">Bloquear</Button></div></div>)}

                    {modal === 'blockPassenger' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-200 flex items-center gap-3">
                                <Icons.Slash size={24} className="shrink-0 text-red-500"/>
                                <div>
                                    <span className="font-bold block">Bloquear Passageiro</span>
                                    Você está prestes a bloquear <span className="font-bold text-white">{formData.name}</span>. Ele não poderá ser agendado nem colocado em viagens.
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold opacity-60 ml-1">Motivo do Bloqueio</label>
                                <textarea 
                                    className="bg-black/10 border border-white/10 text-white rounded-xl px-4 py-3.5 w-full outline-none focus:border-white/50 transition-colors h-32 resize-none" 
                                    placeholder="Explique o motivo do bloqueio..." 
                                    value={formData.blockReason || ''} 
                                    onChange={(e:any)=>setFormData({...formData, blockReason:e.target.value})}
                                    autoFocus
                                />
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <Button theme={theme} variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button>
                                <Button theme={theme} onClick={()=>save('blockPassenger')} icon={Icons.Slash} variant="danger">Confirmar Bloqueio</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
