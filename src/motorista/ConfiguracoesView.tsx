import React, { useState } from 'react';
import { Button, Input, Icons } from './components/MotoristaShared';

export default function ConfiguracoesView() {
  const [expense, setExpense] = useState('');
  const [expenses, setExpenses] = useState<string[]>(JSON.parse(localStorage.getItem('motorista_expenses') || '["Combustível", "Almoço"]'));

  const addExpense = () => {
    if (!expense.trim()) return;
    const newExpenses = [...expenses, expense.trim()];
    setExpenses(newExpenses);
    localStorage.setItem('motorista_expenses', JSON.stringify(newExpenses));
    setExpense('');
  };

  const removeExpense = (index: number) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(newExpenses);
    localStorage.setItem('motorista_expenses', JSON.stringify(newExpenses));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="font-bold text-xl mb-2 flex items-center gap-2">
          <Icons.Settings className="text-blue-400" /> Configurações
        </h2>
        <p className="text-sm text-slate-400 mb-6">Gerencie os tipos de gastos que aparecerão no seu cadastro diário.</p>
        
        <div className="flex gap-2 items-end mb-6">
          <div className="flex-1">
            <Input 
              label="Novo Tipo de Gasto" 
              placeholder="Ex: Pedágio, Manutenção..." 
              value={expense} 
              onChange={(e:any) => setExpense(e.target.value)} 
            />
          </div>
          <Button onClick={addExpense} icon={Icons.Plus} className="h-[58px] px-6">Adicionar</Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold opacity-60 ml-1">Gastos Cadastrados</h3>
          {expenses.length === 0 ? (
            <p className="text-slate-500 text-sm italic p-4 bg-slate-950 rounded-xl border border-slate-800">Nenhum gasto cadastrado.</p>
          ) : (
            expenses.map((e, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                <span className="font-bold">{e}</span>
                <button 
                  onClick={() => removeExpense(i)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                >
                  <Icons.Trash size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
