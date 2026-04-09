import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MotoristaCadastro() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    subidaQtd: 0,
    subidaVal: 0,
    descidaQtd: 0,
    descidaVal: 0,
    gastos: [] as { name: string, value: number }[]
  });
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Cadastro do Dia</h2>
        
        {step === 1 && (
          <div className="space-y-4">
            <input 
              type="number"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white"
              placeholder="Passageiros Subida"
              onChange={(e) => setData({...data, subidaQtd: Number(e.target.value)})}
            />
            <input 
              type="number"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white"
              placeholder="Valor Subida"
              onChange={(e) => setData({...data, subidaVal: Number(e.target.value)})}
            />
            <button onClick={handleNext} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Próximo</button>
          </div>
        )}
        
        {/* Add more steps here */}
      </div>
    </div>
  );
}
