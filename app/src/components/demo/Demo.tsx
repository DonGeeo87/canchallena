import { useEffect, useState } from 'react';

// ============================================================
// /demo — Sandbox de ventas de CanchaLlena
// Club Deportivo Los Guerreros (ficticio). Muestra el sistema trabajando.
// ============================================================

interface AgentEvent {
  type: string;
  message: string;
  at: string;
}

interface DemoState {
  club: { name: string; slug: string; city: string };
  courts: { id: string; name: string; price: number }[];
  players: { id: string; name: string; categoria: string; nivel: string; es_nuevo: number; dias_sin_jugar: number }[];
  occupancyRate: number;
  occupiedCount: number;
  freeCount: number;
  reservationsToday: number;
  openMatches: { id: string; court: string; at: string; status: string }[];
}

export default function Demo({ onNavigateHome }: { onNavigateHome: () => void }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [simChat, setSimChat] = useState<{ role: string; text: string }[]>([
    { role: 'cliente', text: 'Hola! ¿Tienen cancha hoy?' },
    { role: 'bot', text: '¡Hola! 👋 Sí, tenemos disponibilidad. Te paso las opciones de hoy.' },
  ]);

  const loadState = async () => {
    try {
      const r = await fetch('/api/demo/state');
      const data = await r.json();
      setState(data);
    } catch (e) {
      console.error('demo state error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadState(); }, []);

  const runAction = async (action: string, label: string) => {
    setActing(action);
    try {
      const r = await fetch('/api/demo/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      // Agregar evento a la timeline
      setEvents((prev) => [{ type: data.event.type, message: data.event.message, at: new Date().toLocaleTimeString() }, ...prev]);
      if (data.state) setState(data.state);
      // Simular conversación del WhatsApp
      setSimChat((prev) => [...prev, { role: 'cliente', text: label }, { role: 'bot', text: data.event.message.split('\n')[0] }]);
    } catch (e) {
      console.error('demo action error', e);
    } finally {
      setActing(null);
    }
  };

  const typeIcon: Record<string, string> = {
    reserva: '📅', cancelacion: '⚠️', disponibilidad: '💬', match: '🎾', error: '⛔',
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#101014]">
      {/* Banner superior de simulación */}
      <div className="bg-[#101014] text-white text-center py-2 text-xs font-bold tracking-widest">
        🧪 ENTORNO DE SIMULACIÓN — Los datos son ficticios · La interfaz y flujos son los reales
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">🏟️ {state?.club.name || 'Club Deportivo Los Guerreros'}</h1>
            <p className="text-[#62626A] text-sm">{state?.club.city}, {state?.club.slug}</p>
          </div>
          <button onClick={onNavigateHome} className="px-4 py-2 rounded-xl bg-white border border-[#D9D9D2] text-sm font-bold hover:border-[#7C3AED]">
            ← Volver
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-[#D9D9D2]">
            <p className="text-[10px] text-[#62626A] font-bold uppercase">Ocupación</p>
            <p className="text-2xl font-extrabold">{state?.occupancyRate ?? 0}%</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#D9D9D2]">
            <p className="text-[10px] text-[#62626A] font-bold uppercase">Reservas hoy</p>
            <p className="text-2xl font-extrabold">{state?.reservationsToday ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#D9D9D2]">
            <p className="text-[10px] text-[#62626A] font-bold uppercase">Canchas ocupadas</p>
            <p className="text-2xl font-extrabold">{state?.occupiedCount ?? 0}/{state ? state.occupiedCount + state.freeCount : 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[#7C3AED] text-[#7C3AED]">
            <p className="text-[10px] font-bold uppercase">🤖 Agent · Operativo</p>
            <p className="text-sm font-extrabold">{state?.openMatches.length ?? 0} partidos armando</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Columna izquierda: Simulador */}
          <div>
            {/* Barra de simulador */}
            <div className="bg-white rounded-2xl p-6 border border-[#D9D9D2] mb-6">
              <h2 className="text-lg font-extrabold mb-1">🎮 ¿Qué quieres probar?</h2>
              <p className="text-sm text-[#62626A] mb-4">Toca un botón — el sistema ejecuta el flujo completo en la DB real del club demo.</p>
              <div className="flex flex-wrap gap-2">
                <button disabled={!!acting} onClick={() => runAction('reserva', 'reservar una cancha')}
                  className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-sm font-bold disabled:opacity-50">➕ Nueva reserva</button>
                <button disabled={!!acting} onClick={() => runAction('cancelacion', 'cancelar una reserva')}
                  className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-sm font-bold disabled:opacity-50">✖️ Cancelación</button>
                <button disabled={!!acting} onClick={() => runAction('disponibilidad', 'preguntar por disponibilidad')}
                  className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-bold disabled:opacity-50">💬 ¿Disponibilidad?</button>
                <button disabled={!!acting} onClick={() => runAction('crear_partido', 'crear un partido')}
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold disabled:opacity-50">🎾 Crear partido</button>
              </div>
              {acting && <p className="text-xs text-[#7C3AED] mt-3 font-bold animate-pulse">⏳ Ejecutando flujo real...</p>}
            </div>

            {/* WhatsApp simulado */}
            <div className="bg-[#E5DED5] rounded-2xl p-4 border border-[#D9D9D2] mb-6">
              <div className="bg-[#075E54] text-white px-4 py-2 rounded-t-xl text-xs font-bold">🤖 CanchaLlena · WhatsApp (simulado)</div>
              <div className="bg-[#ECE5DD] p-4 rounded-b-xl space-y-2 max-h-64 overflow-y-auto">
                {simChat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${m.role === 'cliente' ? 'bg-[#DCF8C6]' : 'bg-white'}`}>
                      <span className="block font-bold">{m.role === 'cliente' ? 'Cliente' : 'CanchaLlena'}</span>
                      <span className="whitespace-pre-line">{m.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#62626A] mt-1">🧪 Conversación ficticia — solo para demostrar el flujo</p>
            </div>

            {/* Canchas */}
            <div className="bg-white rounded-2xl p-6 border border-[#D9D9D2]">
              <h3 className="text-base font-extrabold mb-3">🏟 Canchas ({state?.courts.length ?? 0})</h3>
              <div className="grid grid-cols-2 gap-2">
                {state?.courts.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-[#D9D9D2] bg-[#FAFAF8]">
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-[10px] text-[#62626A]">${c.price.toLocaleString('es-CL')}/tanda</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha: Timeline del agente */}
          <div className="bg-white rounded-2xl p-6 border border-[#D9D9D2] h-fit lg:sticky lg:top-4">
            <h3 className="text-base font-extrabold mb-3">🤖 Actividad del Agente</h3>
            {events.length === 0 ? (
              <p className="text-sm text-[#62626A]">Presiona un botón del simulador para ver cómo el agente opera el club en tiempo real.</p>
            ) : (
              <div className="space-y-3">
                {events.map((e, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-[#D9D9D2] last:border-0">
                    <span className="text-2xl">{typeIcon[e.type] || '🤖'}</span>
                    <div>
                      <p className="text-xs font-bold">{e.at}</p>
                      <p className="text-sm whitespace-pre-line">{e.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div className="bg-[#7C3AED] text-white py-10 mt-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold mb-2">Esto es CanchaLlena</h2>
          <p className="mb-6">Mientras tú administras tu club, CanchaLlena se encarga del trabajo repetitivo: reservas, consultas, partidos y cupos.</p>
          <button onClick={onNavigateHome} className="px-8 py-3 rounded-xl bg-white text-[#7C3AED] font-extrabold">Quiero esto para mi club</button>
        </div>
      </div>

      {loading && <p className="text-center py-10 text-[#62626A]">Cargando demo...</p>}
    </div>
  );
}
