import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MotoristaLogin from './MotoristaLogin';
import MotoristaDashboard from './MotoristaDashboard';

export default function MotoristaApp() {
  return (
    <Routes>
      <Route path="/" element={<MotoristaLogin />} />
      <Route path="/dashboard" element={<MotoristaDashboard />} />
    </Routes>
  );
}
