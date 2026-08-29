import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../App'

interface Slot {
  id: string
  court_name: string
  starts_at: string
  status: string
  price: number
}
interface Court {
  id: string
  name: string
  price_per_slot: number
}

export function DashboardToday() {
  const [courts, setCourts] = useState<Court[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('canchallena_token')
    Promise.all([
      fetch(`${API_BASE_URL}/admin/today`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/courts`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([today, courts]) => {
      setSlots(today.slots || [])
      setCourts(courts || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Hoy</h1>
          <p className="text-sm text-white/50">Tablero de canchas — {new Date().toLocaleDateString('es-CL')}</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('canchallena_token')
            window.location.href = '/login'
          }}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white"
        >
          Salir
        </button>
      </header>

      {loading ? (
        <p className="text-white/50">Cargando…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {courts.map((court) => (
            <div key={court.id} className="rounded-xl border border-white/10 bg-brand-surface p-3">
              <h3 className="font-medium text-white">{court.name}</h3>
              <p className="text-xs text-white/50">${court.price_per_slot.toLocaleString('es-CL')}</p>
              <ul className="mt-2 space-y-1">
                {slots
                  .filter((s) => s.court_name === court.name)
                  .map((s) => (
                    <li key={s.id} className="flex justify-between rounded-lg bg-white/5 px-2 py-1 text-xs">
                      <span className="text-white/80">
                        {new Date(s.starts_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="italic text-white/40">{s.status}</span>
                    </li>
                  ))}
                {slots.filter((s) => s.court_name === court.name).length === 0 && (
                  <li className="text-xs italic text-white/30">Sin ocupación hoy</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
