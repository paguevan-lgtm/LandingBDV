import React from 'react';

export const Icon = ({ children, size=20, className="" }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);

export const Icons = {
    Home: (p:any) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></Icon>,
    Plus: (p:any) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>,
    List: (p:any) => <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></Icon>,
    Settings: (p:any) => <Icon {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></Icon>,
    LogOut: (p:any) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></Icon>,
    Trash: (p:any) => <Icon {...p}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></Icon>,
    Edit: (p:any) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></Icon>,
    Check: (p:any) => <Icon {...p}><polyline points="20 6 9 17 4 12"></polyline></Icon>,
    ChevronRight: (p:any) => <Icon {...p}><polyline points="9 18 15 12 9 6"></polyline></Icon>,
    ChevronLeft: (p:any) => <Icon {...p}><polyline points="15 18 9 12 15 6"></polyline></Icon>,
    DollarSign: (p:any) => <Icon {...p}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></Icon>,
    Users: (p:any) => <Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></Icon>,
    TrendingUp: (p:any) => <Icon {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></Icon>,
    TrendingDown: (p:any) => <Icon {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></Icon>,
    Calendar: (p:any) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></Icon>,
};

export const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export const Button = ({ onClick, children, variant='primary', className='', icon:IconComp, disabled=false }: any) => {
    let baseClass = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-sm px-4 py-3 text-sm ";
    if (disabled) baseClass += 'bg-slate-800 text-slate-500 cursor-not-allowed ';
    else if (variant === 'primary') baseClass += 'bg-blue-600 text-white hover:opacity-90 ';
    else if (variant === 'secondary') baseClass += 'bg-slate-800 text-white hover:bg-slate-700 ';
    else if (variant === 'danger') baseClass += 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ';
    else if (variant === 'success') baseClass += 'bg-green-600 text-white hover:opacity-90 ';
    
    return (
        <button className={`${baseClass} ${className}`} onClick={onClick} disabled={disabled}>
            {IconComp && <IconComp size={18} />}
            {children}
        </button>
    );
};

export const Input = ({ label, value, onChange, type='text', placeholder, icon:IconComp, min, max, step }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-bold opacity-60 ml-1">{label}</label>}
        <div className="relative">
            {IconComp && <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50"><IconComp size={18}/></div>}
            <input 
                type={type}
                className={`w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors ${IconComp ? 'pl-12' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                step={step}
            />
        </div>
    </div>
);
