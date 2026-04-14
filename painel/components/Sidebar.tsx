
import React from 'react';
import { Icons } from './Shared';
import { getAvatarUrl } from '../utils';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

const SortableMenuItem = ({ item, isMobile, view, setView, setMenuOpen, theme }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.3 : 1,
        touchAction: isDragging ? 'none' : 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
    } as React.CSSProperties;

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className="relative rounded-xl mb-1 group cursor-grab active:cursor-grabbing select-none"
            {...attributes}
            {...listeners}
        >
                <button 
                    id={`menu-btn-${item.id}${isMobile ? '-mobile' : ''}`} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setView(item.id);
                        if(isMobile) setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative z-10 ${view === item.id ? `${theme.primary} shadow-lg` : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                >
                <item.i size={20}/>
                <div className="flex-1 text-left">
                    <div className="text-sm font-bold">{item.l}</div>
                    <div className="text-[10px] opacity-50">{item.d}</div>
                </div>
                <div className="p-1 opacity-0 group-hover:opacity-40 transition-opacity">
                    <Icons.GripVertical size={14}/>
                </div>
            </button>
        </div>
    );
};

const Logo = ({ theme, systemContext }: any) => (
    <div className="relative w-12 h-12 flex items-center justify-center group cursor-pointer">
        {/* Camadas de fundo com efeito de vidro e brilho */}
        <div className="absolute inset-0 bg-brand-purple/20 rounded-2xl rotate-6 scale-90 blur-sm group-hover:rotate-12 transition-all duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple via-brand-pink to-brand-purple rounded-2xl shadow-xl shadow-brand-purple/30 transform group-hover:-rotate-6 transition-all duration-500"></div>
        
        {/* Brilho interno */}
        <div className="absolute inset-[2px] bg-gradient-to-tl from-white/10 to-transparent rounded-[14px] z-10"></div>

        {/* Conteúdo Central: Letra B Estilizada */}
        <div className="relative z-20 flex flex-col items-center justify-center">
            <span className="text-white font-black text-2xl italic leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">B</span>
            {/* Linha de movimento */}
            <div className="w-6 h-1 bg-white/40 rounded-full -mt-0.5 blur-[0.5px] transform -skew-x-12"></div>
        </div>

        {/* Badge do Van: Representando o "Bora de Van" */}
        <div className="absolute -bottom-1.5 -right-1.5 bg-white text-brand-pink rounded-xl p-1.5 shadow-2xl border-2 border-brand-pink/10 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 z-30">
            <Icons.Van size={16} strokeWidth={3} />
        </div>
        
        {/* Efeito de "Velocidade" */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/20 rounded-full blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-2 bg-white/10 rounded-full blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity delay-75"></div>
    </div>
);

export const Sidebar = ({ 
    theme, 
    view, 
    setView, 
    menuOpen, 
    setMenuOpen, 
    user, 
    orderedMenuItems, 
    setOrderedMenuItems,
    daysRemaining,
    renewalDate,
    setRunTour,
    systemContext,
    isOnline,
    isDbConnected,
    pendingOpsCount,
    db
}: any) => {
    const { logout } = useAuth();
    const [activeId, setActiveId] = React.useState<string | null>(null);
    
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 300,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        if (active.id !== over?.id) {
            const oldIndex = orderedMenuItems.findIndex((i: any) => i.id === active.id);
            const newIndex = orderedMenuItems.findIndex((i: any) => i.id === over.id);
            const newList = arrayMove(orderedMenuItems, oldIndex, newIndex);
            setOrderedMenuItems(newList);
            // Persist order
            localStorage.setItem(`menu_order_${user?.username}`, JSON.stringify(newList.map((i: any) => i.id)));
            if (db && user?.username) {
                db.ref(`user_data/${user.username}/preferences/menuOrder`).set(newList.map((i: any) => i.id));
            }
        }
    };

    const renderMenuContent = (isMobile: boolean) => (
        <div onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') e.stopPropagation(); }} className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Logo theme={theme} systemContext={systemContext} />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tight leading-tight">Bora de <span className="text-brand-pink">Van</span></h1>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                                {systemContext === 'Mistura' && user?.username !== 'Breno' ? 'Pg' : systemContext} • Painel
                            </div>
                        </div>
                    </div>
                </div>
                {isMobile && <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.X /></button>}
            </div>

            <div id="sidebar-scroll-container" className="flex-1 overflow-y-auto px-4 py-2 pb-4 space-y-1">
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                >
                    <SortableContext 
                        items={orderedMenuItems.map((i: any) => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {orderedMenuItems.map((item: any) => (
                            <SortableMenuItem 
                                key={item.id}
                                item={item}
                                isMobile={isMobile}
                                view={view}
                                setView={setView}
                                setMenuOpen={setMenuOpen}
                                theme={theme}
                            />
                        ))}
                    </SortableContext>
                    <DragOverlay>
                        {activeId ? (
                            <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${theme.primary} shadow-2xl opacity-80 scale-105 pointer-events-none`}>
                                {(() => {
                                    const item = orderedMenuItems.find((i: any) => i.id === activeId);
                                    if (!item) return null;
                                    return (
                                        <>
                                            <item.i size={20}/>
                                            <div className="flex-1 text-left">
                                                <div className="text-sm font-bold">{item.l}</div>
                                                <div className="text-[10px] opacity-50">{item.d}</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <div className="p-4 border-t border-white/5 mt-auto">
                {user?.isImpersonated && (
                    <button 
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all mb-4 group"
                    >
                        <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                            <Icons.Zap size={18} />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-xs font-bold">Impersonando</div>
                            <div className="text-[10px] opacity-70">Clique para sair</div>
                        </div>
                    </button>
                )}
                {/* Offline Status Indicator */}
                <div className="px-4 py-2 mb-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Status</span>
                        <div className={`w-2 h-2 rounded-full ${isOnline && isDbConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px]">
                            {isOnline ? <Icons.Wifi size={12} className="text-green-400" /> : <Icons.WifiOff size={12} className="text-red-400" />}
                            <span className={isOnline ? 'text-green-400/80' : 'text-red-400/80'}>{isOnline ? 'Internet OK' : 'Sem Internet'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            {isDbConnected ? <Icons.Database size={12} className="text-green-400" /> : <Icons.CloudOff size={12} className="text-red-400" />}
                            <span className={isDbConnected ? 'text-green-400/80' : 'text-red-400/80'}>{isDbConnected ? 'Banco Conectado' : 'Banco Offline'}</span>
                        </div>
                        {pendingOpsCount > 0 && (
                            <div className="flex items-center gap-2 text-[11px] mt-1 text-amber-400 animate-pulse">
                                <Icons.RefreshCw size={12} />
                                <span>{pendingOpsCount} pendentes</span>
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={() => { setView('dashboard'); setRunTour(true); if(isMobile) setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors rounded-xl mb-2">
                    <Icons.HelpCircle size={20}/>
                    <span className="text-sm font-bold">Como usar (Tour)</span>
                </button>
                <button 
                    id={`menu-btn-user${isMobile ? '-mobile' : ''}`}
                    onClick={() => { setView('settings'); if(isMobile) setMenuOpen(false); }} 
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-all duration-200 rounded-xl border border-white/10 shadow-sm hover:shadow-md active:scale-95 active:border-white/20"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-2 ring-white/10">
                        <img src={getAvatarUrl(user?.username || 'User')} alt="User" />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="text-sm font-bold">{user?.displayName || user?.username}</div>
                        <div className="text-[10px] opacity-70">{user?.role === 'admin' ? 'Coordenação' : user?.role}</div>
                        {daysRemaining !== null && (
                            <div className={`text-[9px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${daysRemaining === 'Expirado' || daysRemaining === 'Sem Assinatura' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {daysRemaining === 'Expirado' || daysRemaining === 'Sem Assinatura' ? 'Expirado' : 'Ativo'}
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div id="sidebar-nav" className={`hidden md:flex w-64 h-full ${theme.card} border-r ${theme.border} flex-col flex-shrink-0 z-20`}>
                {renderMenuContent(false)}
            </div>

            {/* Mobile Sidebar Overlay */}
            <div 
                className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setMenuOpen(false)}
            >
                <div 
                    id="mobile-sidebar" 
                    className={`absolute top-0 bottom-0 left-0 w-64 ${theme.card} border-r ${theme.border} transform transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl`} 
                    onClick={e => e.stopPropagation()}
                >
                    {renderMenuContent(true)}
                </div>
            </div>
        </>
    );
};
