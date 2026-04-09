import React, { useState, useEffect } from 'react';
import { Button, Input, Icons, formatCurrency, getTodayDate } from './components/MotoristaShared';

export default function CadastroView({ onFinish }: { onFinish?: () => void }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(getTodayDate());
  const [data, setData] = useState({
    subidaQtd: '', subidaVal: '',
    descidaQtd: '', descidaVal: '',
    ganhosExtras: '',
    observacoes: ''
  });
  const [gastos, setGastos] = useState<{ [key: string]: string }>({});
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);

  useEffect(() => {
    setExpenseTypes(JSON.parse(localStorage.getItem('motorista_expenses') || '["Combustível", "Almoço"]'));
  }, []);

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const handleSave = () => {
    const records = JSON.parse(localStorage.getItem('motorista_records') || '[]');
    
    const subidaTotal = (Number(data.subidaQtd) || 0) * (Number(data.subidaVal) || 0);
    const descidaTotal = (Number(data.descidaQtd) || 0) * (Number(data.descidaVal) || 0);
    const extrasTotal = Number(data.ganhosExtras) || 0;
    const ganhosTotal = subidaTotal + descidaTotal + extrasTotal;
    
    const gastosTotal = Object.values(gastos).reduce((acc, val) => acc + (Number(val) || 0), 0);
    const lucro = ganhosTotal - gastosTotal;

    const newRecord = {
      id: Date.now().toString(),
      date,
      ...data,
      gastos,
      subidaTotal,
      descidaTotal,
      ganhosTotal,
      gastosTotal,
      lucro
    };

    localStorage.setItem('motorista_records', JSON.stringify([newRecord, ...records]));
    if (onFinish) onFinish();
    else {
      alert('Dia finalizado com sucesso!');
      setStep(1);
      setData({ subidaQtd: '', subidaVal: '', descidaQtd: '', descidaVal: '', ganhosExtras: '', observacoes: '' });
      setGastos({});
    }
  };

  const subidaTotal = (Number(data.subidaQtd) || 0) * (Number(data.subidaVal) || 0);
  const descidaTotal = (Number(data.descidaQtd) || 0) * (Number(data.descidaVal) || 0);
  const extrasTotal = Number(data.ganhosExtras) || 0;
  const ganhosTotal = subidaTotal + descidaTotal + extrasTotal;
  const gastosTotal = Object.values(gastos).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const lucro = ganhosTotal - gastosTotal;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-xl">Novo Dia</h2>
        <div className="text-sm font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          Passo {step} de 5
        </div>
      </div>

      <div className="w-full bg-slate-900 h-2 rounded-full mb-8 overflow-hidden">
        <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div>
      </div>

      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Icons.TrendingUp size={24} />
            <h3 className="font-bold text-lg text-white">Subida</h3>
          </div>
          <Input label="Data" type="date" value={date} onChange={(e:any) => setDate(e.target.value)} icon={Icons.Calendar} />
          <Input label="Quantos passageiros você SUBIU hoje?" type="number" placeholder="Ex: 15" value={data.subidaQtd} onChange={(e:any) => setData({...data, subidaQtd: e.target.value})} icon={Icons.Users} />
          <Input label="Qual o valor por passageiro na SUBIDA?" type="number" placeholder="Ex: 10.50" step="0.01" value={data.subidaVal} onChange={(e:any) => setData({...data, subidaVal: e.target.value})} icon={Icons.DollarSign} />
          
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center">
            <span className="text-sm font-bold text-blue-200">Total Subida:</span>
            <span className="text-xl font-bold text-blue-400">{formatCurrency(subidaTotal)}</span>
          </div>

          <Button onClick={next} className="w-full h-14 text-lg" icon={Icons.ChevronRight}>Próximo</Button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Icons.TrendingDown size={24} />
            <h3 className="font-bold text-lg text-white">Descida</h3>
          </div>
          <Input label="Quantos passageiros você DESCEU hoje?" type="number" placeholder="Ex: 12" value={data.descidaQtd} onChange={(e:any) => setData({...data, descidaQtd: e.target.value})} icon={Icons.Users} />
          <Input label="Qual o valor por passageiro na DESCIDA?" type="number" placeholder="Ex: 10.50" step="0.01" value={data.descidaVal} onChange={(e:any) => setData({...data, descidaVal: e.target.value})} icon={Icons.DollarSign} />
          
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex justify-between items-center">
            <span className="text-sm font-bold text-indigo-200">Total Descida:</span>
            <span className="text-xl font-bold text-indigo-400">{formatCurrency(descidaTotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={prev} variant="secondary" className="h-14" icon={Icons.ChevronLeft}>Voltar</Button>
            <Button onClick={next} className="h-14" icon={Icons.ChevronRight}>Próximo</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <Icons.DollarSign size={24} />
            <h3 className="font-bold text-lg text-white">Gastos do Dia</h3>
          </div>
          
          {expenseTypes.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum tipo de gasto configurado. Vá em Configurações para adicionar.</p>
          ) : (
            <div className="space-y-4">
              {expenseTypes.map(e => (
                <Input 
                  key={e}
                  label={`Quanto você gastou com ${e} hoje?`} 
                  type="number" 
                  placeholder="Ex: 50.00" 
                  step="0.01"
                  value={gastos[e] || ''} 
                  onChange={(ev:any) => setGastos({...gastos, [e]: ev.target.value})} 
                  icon={Icons.DollarSign} 
                />
              ))}
            </div>
          )}

          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center">
            <span className="text-sm font-bold text-red-200">Total Gastos:</span>
            <span className="text-xl font-bold text-red-400">{formatCurrency(gastosTotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={prev} variant="secondary" className="h-14" icon={Icons.ChevronLeft}>Voltar</Button>
            <Button onClick={next} className="h-14" icon={Icons.ChevronRight}>Próximo</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <Icons.Plus size={24} />
            <h3 className="font-bold text-lg text-white">Extras & Observações</h3>
          </div>
          
          <Input label="Ganhos Extras (Opcional)" type="number" placeholder="Ex: 20.00" step="0.01" value={data.ganhosExtras} onChange={(e:any) => setData({...data, ganhosExtras: e.target.value})} icon={Icons.DollarSign} />
          
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold opacity-60 ml-1">Observações do dia</label>
            <textarea 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors h-32 resize-none"
              placeholder="Ex: Trânsito intenso na volta, pneu furou..."
              value={data.observacoes}
              onChange={(e:any) => setData({...data, observacoes: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={prev} variant="secondary" className="h-14" icon={Icons.ChevronLeft}>Voltar</Button>
            <Button onClick={next} className="h-14" icon={Icons.ChevronRight}>Próximo</Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <Icons.Check size={24} />
            <h3 className="font-bold text-lg text-white">Resumo do Dia</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Total Ganhos</span>
              <span className="font-bold text-green-400">{formatCurrency(ganhosTotal)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Total Gastos</span>
              <span className="font-bold text-red-400">{formatCurrency(gastosTotal)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <span className="font-bold text-blue-200">Lucro Líquido</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(lucro)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button onClick={prev} variant="secondary" className="h-14" icon={Icons.ChevronLeft}>Voltar</Button>
            <Button onClick={handleSave} variant="success" className="h-14" icon={Icons.Check}>Finalizar Dia</Button>
          </div>
        </div>
      )}
    </div>
  );
}
