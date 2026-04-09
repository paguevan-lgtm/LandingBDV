import React, { useState, useEffect } from 'react';
import { Icons, formatCurrency, Button } from './components/MotoristaShared';

export default function HistoricoView() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    setRecords(JSON.parse(localStorage.getItem('motorista_records') || '[]'));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      const newRecords = records.filter(r => r.id !== id);
      setRecords(newRecords);
      localStorage.setItem('motorista_records', JSON.stringify(newRecords));
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl flex items-center gap-2">
          <Icons.List className="text-blue-400" /> Histórico
        </h2>
      </div>

      {records.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
          <Icons.Calendar size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhum registro encontrado.</p>
          <p className="text-sm text-slate-500 mt-2">Seus dias finalizados aparecerão aqui.</p>
        </div>
      ) : (
        <>
          {/* Mobile View (Cards) */}
          <div className="md:hidden space-y-4">
            {records.map((r) => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-lg">{r.date.split('-').reverse().join('/')}</p>
                    <p className="text-xs text-slate-400">ID: {r.id.slice(-6)}</p>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-slate-950 rounded-lg">
                    <Icons.Trash size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Ganhos</p>
                    <p className="font-bold text-green-400">{formatCurrency(r.ganhosTotal)}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Gastos</p>
                    <p className="font-bold text-red-400">{formatCurrency(r.gastosTotal)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
                  <span className="text-sm font-bold text-blue-200">Lucro Líquido</span>
                  <span className="font-bold text-lg text-white">{formatCurrency(r.lucro)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-bold">Data</th>
                    <th className="px-6 py-4 font-bold">Subida</th>
                    <th className="px-6 py-4 font-bold">Descida</th>
                    <th className="px-6 py-4 font-bold">Extras</th>
                    <th className="px-6 py-4 font-bold">Gastos</th>
                    <th className="px-6 py-4 font-bold">Lucro</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{r.date.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4 text-green-400">{formatCurrency(r.subidaTotal)}</td>
                      <td className="px-6 py-4 text-green-400">{formatCurrency(r.descidaTotal)}</td>
                      <td className="px-6 py-4 text-amber-400">{formatCurrency(r.ganhosTotal - r.subidaTotal - r.descidaTotal)}</td>
                      <td className="px-6 py-4 text-red-400">{formatCurrency(r.gastosTotal)}</td>
                      <td className="px-6 py-4 font-bold text-white">{formatCurrency(r.lucro)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                          <Icons.Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
