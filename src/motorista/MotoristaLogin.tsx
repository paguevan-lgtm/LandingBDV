import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';

export default function MotoristaLogin() {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const driversRef = db.ref('drivers');
      driversRef.once('value', (snapshot: any) => {
        const driversData = snapshot.val();
        const drivers = driversData ? Object.values(driversData) : [];
        console.log('Fetched drivers:', drivers);
        
        const sanitizedInputCpf = cpf.replace(/\D/g, '');
        const driver = drivers.find((d: any) => {
          console.log('Checking driver object:', d);
          const sanitizedStoredCpf = (d.cpf || '').replace(/\D/g, '');
          console.log('Comparing:', d.name, 'with', name, '| CPF:', sanitizedStoredCpf, 'with', sanitizedInputCpf);
          return d.name === name && sanitizedStoredCpf.substring(0, 6) === sanitizedInputCpf;
        });
        
        if (driver) {
          localStorage.setItem('motorista_session', JSON.stringify(driver));
          navigate('/motorista/dashboard');
        } else {
          setError('Nome ou CPF inválido.');
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao fazer login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Login Motorista</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <input 
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-4"
          placeholder="Nome do Motorista"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input 
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white mb-6"
          placeholder="6 primeiros dígitos do CPF"
          value={cpf}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setCpf(val.substring(0, 6));
          }}
        />
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
