
import React from 'react';
import { Icons, IconButton } from '../components/Shared';
import { formatDisplayDate } from '../utils';

export default function Achados({ data, theme, searchTerm, searchType = 'all', dbOp, del, notify, systemContext }: any) {

    const [limit, setLimit] = React.useState(30);

    const filteredList = data.lostFound.filter((item:any) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase().trim();
        
        if (searchType === 'id') return String(item.id).toLowerCase().includes(lower);
        if (searchType === 'item') return item.description && item.description.toLowerCase().includes(lower);
        
        return (item.description && item.description.toLowerCase().includes(lower)) || 
               (item.location && item.location.toLowerCase().includes(lower)) ||
               (String(item.id).toLowerCase().includes(lower));
    });

    const displayedList = filteredList.slice(0, limit);

    return (
        <div className="space-y-4">
            {displayedList.length === 0 ? (
                <div className={`p-8 text-center ${theme.card} ${theme.radius} border ${theme.border} opacity-50`}>
                    <Icons.Box size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Nenhum item encontrado</p>
                </div>
            ) : (
                displayedList.map((item:any, i:number) => ( 
                    <div key={item.id} style={{animationDelay: `${i * 50}ms`}} className={`${theme.card} p-4 ${theme.radius} border ${theme.border} relative overflow-hidden stagger-in`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'Entregue' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <div className="pl-3">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-bold text-lg">{item.description}</h3>
                                    {systemContext === 'Mistura' && item.system && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 w-fit">
                                            Sistema: {item.system}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${item.status === 'Entregue' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                                    {item.status}
                                </span>
                            </div>
                            <p className="text-sm opacity-70 mt-1">📍 {item.location} • 📅 {formatDisplayDate(item.date)}</p>
                            {item.details && <p className="text-xs opacity-50 mt-2 italic">"{item.details}"</p>}
                        </div>
                        <div className="pl-3 flex justify-end gap-2 mt-3 pt-2 border-t border-white/10">
                            <button 
                                onClick={() => { 
                                    const newStatus = item.status === 'Pendente' ? 'Entregue' : 'Pendente'; 
                                    dbOp('update', 'lostFound', { id: item.id, status: newStatus }); 
                                }} 
                                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                {item.status === 'Pendente' ? 'Marcar Entregue' : 'Marcar Pendente'}
                            </button>
                            <IconButton theme={theme} variant="danger" onClick={()=>del('lostFound', item.id)} icon={Icons.Trash}/>
                        </div>
                    </div> 
                ))
            )}
            {limit < filteredList.length && (
                <div className="flex justify-center pt-4 pb-10">
                    <button 
                        onClick={() => setLimit(prev => prev + 30)}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm tracking-wider transition-colors"
                    >
                        Carregar mais {Math.min(30, filteredList.length - limit)} itens
                    </button>
                </div>
            )}
        </div>
    );
}
