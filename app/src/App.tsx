import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPanel } from './components/LoginPanel'
import { DashboardToday } from './components/DashboardToday'

export const API_BASE_URL = '/api' // hardcoded para MSYS2 (no import.meta.env)

export default function App() {
  const token = localStorage.getItem('canchallena_token')
  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPanel />} />
        <Route path="/" element={token ? <DashboardToday /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
