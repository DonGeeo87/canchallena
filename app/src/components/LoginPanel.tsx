import { useState } from 'react'
import { API_BASE_URL } from '../App'

export function LoginPanel() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
      localStorage.setItem('canchallena_token', data.token)
      window.location.href = '/'
    } catch (e: any) {
      setError(e.message || 'No se pudo conectar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-brand-surface p-6">
        <h1 className="text-xl font-bold text-white">CanchaLlena</h1>
        <p className="mt-1 text-sm text-white/60">Panel de administración del club</p>
        <button
          onClick={login}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Conectando…' : 'Iniciar sesión (demo)'}
        </button>
        {error && <p className="mt-3 text-sm text-brand-danger">{error}</p>}
        <p className="mt-4 text-xs text-white/40">Demo: un solo admin por club. La auth completa se define en Sprint 3.</p>
      </div>
    </div>
  )
}
