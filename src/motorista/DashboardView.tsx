import React, { useState, useEffect } from 'react';
import { Icons, formatCurrency, getTodayDate } from './components/MotoristaShared';

export default function DashboardView() {
  const [metrics, setMetrics] = useState({
    hojeGanhos: 0,
    hojeGastos: 0,
    hojeLucro: 0,
    mesGanhos: 0,
    mesGastos: 0,
    mesLucro: 0
  });

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('motorista_records') || '[]');
    const today = getTodayDate();
    const currentMonth = today.substring(0, 7); // YYYY-MM

    let hGanhos = 0, hGastos = 0, hLucro = 0;
    let mGanhos = 0, mGastos = 0, mLucro = 0;

    records.forEach((r: any) => {
      if (r.date === today) {
        hGanhos += r.ganhosTotal || 0;
        hGastos += r.gastosTotal || 0;
        hLucro += r.lucro || 0;
      }
      if (r.date.startsWith(currentMonth)) {
        mGanhos += r.ganhosTotal || 0;
        mGastos += r.gastosTotal || 0;
        mLucro += r.lucro || 0;
      }
    });

    setMetrics({
      hojeGanhos: hGanhos, hojeGastos: hGastos, hojeLucro: hLucro,
      mesGanhos: mGanhos, mesGastos: mGastos, mesLucro: mLucro
    });
  }, []);

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="font-bold text-xl flex items-center gap-2 mb-4">
        <Icons.Home className="text-blue-400" /> Visão Geral
      </h2>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hoje</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.TrendingUp size={48}/></div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Ganhos</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(metrics.hojeGanhos)}</p>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.TrendingDown size={48}/></div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Gastos</p>
            <p className="text-xl font-bold text-red-400">{formatCurrency(metrics.hojeGastos)}</p>
          </div>
        </div>
        <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-xs text-blue-300 uppercase font-bold mb-1">Lucro Líquido (Hoje)</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(metrics.hojeLucro)}</p>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-full text-blue-400">
            <Icons.DollarSign size={24} />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Este Mês</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ganhos</p>
            <p className="text-lg font-bold text-green-400/80">{formatCurrency(metrics.mesGanhos)}</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Gastos</p>
            <p className="text-lg font-bold text-red-400/80">{formatCurrency(metrics.mesGastos)}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-300">Lucro do Mês</span>
          <span className="font-bold text-xl text-white">{formatCurrency(metrics.mesLucro)}</span>
        </div>
      </div>
    </div>
  );
}
