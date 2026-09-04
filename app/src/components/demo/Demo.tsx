import { useEffect, useState, useRef } from 'react';

// ============================================================
// /demo — Lab interactivo de CanchaLlena
// "Un empleado digital trabaja por tu club"
// 4 historias · WhatsApp grande · canchas reactivas
// ============================================================

interface Player { id: string; name: string; categoria: string; nivel: string; es_nuevo: number; dias_sin_jugar: number }
interface CourtCard { id: string; name: string; price: number; status: 'libre' | 'reservada'; time: string }
interface DemoEvent {
  type: string; message: string; at: string;
  player?: { name: string; categoria: string };
  court?: { name: string; time: string };
  match?: { parejaA: { name: string; categoria: string }[]; parejaB: { name: string; categoria: string }[]; courtName: string; time: string };
  reemplazo?: { name: string; categoria: string };
}
interface DemoState {
  club: { name: string; slug: string; city: string };
  courts: { id: string; name: string; price: number }[];
  courtCards: CourtCard[];
  players: Player[];
  occupancyRate: number; occupiedCount: number; freeCount: number; reservationsToday: number;
  openMatches: { id: string; court: string; at: string; status: string }[];
}

// Las 4 historias (escenarios)
const STORIES = [
  { key: 'reserva', num: '01', icon: '🎾', title: 'Reservar una cancha', desc: 'Un cliente quiere jugar', action: 'CanchaLlena atiende → reserva → confirma' },
  { key: 'cancelacion', num: '02', icon: '🔄', title: 'Recuperar una cancelación', desc: 'Un jugador cancela', action: 'CanchaLlena detecta → busca reemplazo → contacta' },
  { key: 'disponibilidad', num: '03', icon: '💬', title: 'Atender una consulta', desc: 'Un cliente pregunta qué hay disponible', action: 'CanchaLlena consulta → responde → ofrece opciones' },
  { key: 'crear_partido', num: '04', icon: '🧩', title: 'Armar un partido', desc: 'Hay jugadores disponibles', action: 'CanchaLlena analiza → forma parejas → invita' },
];

const AGENT_STATES = {
  idle: { label: 'Operativo', color: '#16A34A', sub: 'Listo para trabajar' },
  processing: { label: 'Procesando', color: '#F59E0B', sub: 'Analizando...' },
  executing: { label: 'Ejecutando', color: '#3B82F6', sub: 'Contactando jugadores...' },
  done: { label: 'Listo', color: '#16A34A', sub: 'Tarea resuelta automáticamente' },
};

export default function Demo({ onNavigateHome }: { onNavigateHome: () => void }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentState, setAgentState] = useState<'idle' | 'processing' | 'executing' | 'done'>('idle');
  // Timeline del proceso (plegable, secundario)
  const [processLog, setProcessLog] = useState<DemoEvent[]>([]);
  const [showProcess, setShowProcess] = useState(false);
  // Resultado del último escenario
  const [result, setResult] = useState<DemoEvent | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  // Conversación simulada del WhatsApp
  const [chat, setChat] = useState<{ role: 'cliente' | 'bot'; text: string }[]>([]);
  const [interventions, setInterventions] = useState(0); // siempre 0 → el agente no requiere admin
  const [kpiPulse, setKpiPulse] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Autoscroll al final del chat simulado
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const loadState = async () => {
    try {
      const r = await fetch('/api/demo/state');
      setState(await r.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadState(); }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Narrativa por escenario: qué "cliente" dice y qué responde el bot
  const scriptFor = (action: string, ev: DemoEvent) => {
    switch (action) {
      case 'reserva':
        return [
          { role: 'cliente' as const, text: 'Hola! ¿Tienen cancha a las 20:00?' },
          { role: 'bot' as const, text: `¡Sí! Tengo ${ev.court?.name || 'Cancha'} disponible por $8.000. ¿La reservo?` },
          { role: 'cliente' as const, text: 'Sí, la quiero.' },
          { role: 'bot' as const, text: `✅ ${ev.player?.name} (${ev.player?.categoria}). Reserva confirmada en ${ev.court?.name} a las ${ev.court?.time}. Cliente notificado.` },
        ];
      case 'cancelacion':
        return [
          { role: 'cliente' as const, text: 'Disculpe, tengo que cancelar mi reserva.' },
          { role: 'bot' as const, text: 'Lo siento 😔 Libero el cupo. Buscando un jugador para aprovecharlo...' },
          ...(ev.reemplazo ? [{ role: 'bot' as const, text: `✅ ${ev.reemplazo.name} (${ev.reemplazo.categoria}) ocupó el cupo. Partido se mantiene.` }] : []),
        ];
      case 'disponibilidad':
        return [
          { role: 'cliente' as const, text: '¿Qué canchas tienen hoy?' },
          { role: 'bot' as const, text: '¡Hola! 👋 Tengo estas opciones hoy:\n• Cancha 1 · 19:30 · $8.000\n• Cancha 2 · 19:30 · $8.000\n¿Cuál prefiere?' },
        ];
      case 'crear_partido':
        return [
          { role: 'cliente' as const, text: '¿Hay partido para jugar?' },
          { role: 'bot' as const, text: `Encontré 4 jugadores compatibles en ${ev.match?.courtName}. Formando parejas...` },
          { role: 'bot' as const, text: `🎾 ${ev.match?.parejaA[0].name} + ${ev.match?.parejaA[1].name} vs ${ev.match?.parejaB[0].name} + ${ev.match?.parejaB[1].name}. Envié 4 invitaciones.` },
        ];
      default: return [];
    }
  };

  const runAction = async (action: string) => {
    const story = STORIES.find((s) => s.key === action);
    if (!story) return;
    setActing(action);
    setAgentState('processing');
    setInterventions(0);
    setResult(null);

    try {
      // Simular procesamiento → ejecutando
      await sleep(600);
      setAgentState('executing');

      const r = await fetch('/api/demo/act', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      const ev: DemoEvent = data.event;
      if (data.state) setState(data.state);

      // Construir la conversación del WhatsApp con pausas (typing)
      const script = scriptFor(action, ev);
      const newChat: typeof chat = [];
      for (const m of script) {
        newChat.push(m);
        setChat([...newChat]);
        await sleep(m.role === 'bot' ? 900 : 500);
      }
      setChat([...newChat]);

      // Registrar en el log de proceso
      setProcessLog((prev) => [ev, ...prev]);
      setResult(ev);
      setAgentState('done');
      setKpiPulse(true);
      setTimeout(() => setKpiPulse(false), 800);
    } catch (e) {
      console.error(e);
      setAgentState('idle');
    } finally {
      setActing(null);
    }
  };

  const statusDot = AGENT_STATES[agentState];
  const kpis = [
    { label: 'Reservas hoy', value: state?.reservationsToday ?? 0, suffix: '', color: '#7C3AED' },
    { label: 'Canchas ocupadas', value: state ? `${state.occupiedCount}/${state.occupiedCount + state.freeCount}` : '0', suffix: '', color: '#16A34A' },
    { label: 'Ocupación', value: `${state?.occupancyRate ?? 0}%`, suffix: '', color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#101014]">
      {/* Banner de simulación */}
      <div className="bg-[#101014] text-white text-center py-2 text-xs font-bold tracking-widest">
        🧪 ENTORNO DE SIMULACIÓN — Datos ficticios · Flujos reales del motor
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ← volver */}
        <button onClick={onNavigateHome} className="text-sm font-semibold text-[#62626A] hover:text-[#7C3AED] mb-3">← Volver a la página</button>

        {/* Hero: misión (compacto) */}
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-black">🤖 Ponga a CanchaLlena a trabajar</h1>
          <p className="text-sm text-[#62626A] mt-1">
            Elija una escena abajo y vea cómo el agente conversa y gestiona el club solo.
          </p>
        </div>

        {/* Estado del agente + KPIs (compacto, 2x2 en móvil) */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2.5 border border-[#D9D9D2]">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusDot.color }} />
                <span className="font-extrabold text-xs" style={{ color: statusDot.color }}>{statusDot.label}</span>
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-[#7C3AED] ml-auto">{statusDot.sub}</span>
        </div>

        {/* KPIs reactivos: 2 filas en móvil */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {kpis.map((k) => (
            <div key={k.label} className={`bg-white rounded-2xl px-3 py-2.5 border border-[#D9D9D2] text-center transition-transform ${kpiPulse ? 'scale-105' : ''}`}>
              <p className="text-[9px] text-[#62626A] font-bold uppercase">{k.label}</p>
              <p className="text-lg font-extrabold" style={{ color: k.color }}>{k.value}{k.suffix}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp PRIMERO (prominente en móvil) */}
        <div className="bg-[#E5DED5] rounded-3xl overflow-hidden border border-[#D9D9D2] mb-4">
          <div className="bg-[#075E54] text-white px-4 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-base">🤖</div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">CanchaLlena</p>
              <p className="text-[9px] text-white/80"><span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C7F000]" /> {state?.club.name} · Operativo</p>
            </div>
            <span className="text-[9px] bg-white/15 px-2 py-1 rounded-lg font-bold">🧪 Simulado</span>
          </div>
          <div ref={chatRef} className="bg-[#ECE5DD] p-4 space-y-2 min-h-[260px] max-h-[320px] overflow-y-auto">
            {chat.length === 0 ? (
              <p className="text-center text-[#62626A] text-sm pt-12">
                Elige una escena abajo → mira cómo conversa 👇
              </p>
            ) : (
              chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'cliente' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === 'cliente' ? 'bg-[#DCF8C6] rounded-br-md' : 'bg-white rounded-bl-md'}`}>
                    <span className="block text-[9px] font-bold mb-0.5" style={{ color: m.role === 'cliente' ? '#128C7E' : '#075E54' }}>
                      {m.role === 'cliente' ? 'Cliente' : 'CanchaLlena'}
                    </span>
                    <span className="whitespace-pre-line">{m.text}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-2 bg-[#E5DED5] border-t border-black/5 flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[#62626A] text-xs">Escribe un mensaje...</div>
          </div>
        </div>

        {/* Escenarios compactos 2x2 en móvil */}
        <div className="mb-4">
          <h2 className="text-sm font-extrabold mb-2">¿Qué escena quiere probar?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {STORIES.map((s) => (
              <button
                key={s.key}
                disabled={!!acting}
                onClick={() => runAction(s.key)}
                className={`text-left bg-white rounded-2xl p-3 border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${acting === s.key ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/30' : 'border-[#D9D9D2] hover:border-[#7C3AED]'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-[9px] font-black text-[#7C3AED]">{s.num}</span>
                </div>
                <p className="font-extrabold text-xs leading-tight">{s.title}</p>
                <p className="text-[10px] text-[#62626A] mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
          {acting && <p className="text-xs text-[#7C3AED] mt-2 font-bold animate-pulse">⏳ CanchaLlena está trabajando...</p>}
        </div>


        {/* Canchas reactivas + resultado (después de escenarios) */}
        <div className="mb-6">
          <div className="bg-white rounded-3xl p-4 border border-[#D9D9D2]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm">🏟️ El club ahora</h3>
              <p className="text-[9px] bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-1 rounded-lg font-bold">EN TIEMPO REAL</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {state?.courtCards.map((c) => (
                <div key={c.id} className={`rounded-2xl p-3 border transition-colors ${c.status === 'libre' ? 'bg-white border-[#16A34A]/40' : 'bg-[#7C3AED]/5 border-[#7C3AED]/40'}`}>
                  <div className="text-lg mb-1">🎾</div>
                  <p className="font-bold text-xs">{c.name}</p>
                  <p className="text-[10px] text-[#62626A]">${c.price.toLocaleString('de-DE')}/tanda</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${c.status === 'libre' ? 'bg-[#16A34A]' : 'bg-[#7C3AED]'}`} />
                    <span className={`text-[10px] font-bold ${c.status === 'libre' ? 'text-[#16A34A]' : 'text-[#7C3AED]'}`}>
                      {c.status === 'libre' ? 'LIBRE' : 'OCUPADA'}
                    </span>
                  </div>
                </div>
              )) || (
                <>
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-3 border border-[#D9D9D2] animate-pulse"><div className="h-4 bg-gray-200 rounded mb-2"/><div className="h-3 bg-gray-100 rounded"/></div>
                  ))}
                </>
              )}
            </div>
          </div>

            {/* Resultado del último escenario */}
            {result && (
              <div className="bg-[#101014] text-white rounded-3xl p-4 border border-white/10 mt-3">
                <p className="text-[10px] font-bold text-[#C7F000] uppercase mb-1">Resultado</p>
                <p className="text-sm whitespace-pre-line">{result.message}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <span className="text-lg">👤</span>
                  <p className="text-xs text-white/80">
                    Intervenciones del administrador: <span className="text-[#C7F000] font-extrabold text-base">{interventions}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

        {/* Timeline de proceso (plegable, secundario) */}
        <div className="bg-white rounded-3xl p-5 border border-[#D9D9D2] mb-6">
          <button onClick={() => setShowProcess(!showProcess)} className="flex items-center gap-2 font-bold text-sm">
            <span>{showProcess ? '▾' : '▸'}</span> Ver actividad del agente (proceso)
            <span className="text-[10px] text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-0.5 rounded-lg font-bold">MODO EXPERTO</span>
          </button>
          {showProcess && (
            <div className="mt-3 space-y-2">
              {processLog.length === 0 ? (
                <p className="text-xs text-[#62626A]">Aún no hay actividad. Ejecuta un escenario.</p>
              ) : (
                processLog.map((e, i) => (
                  <div key={i} className="text-xs text-[#62626A] flex gap-2 pb-1 border-b border-[#D9D9D2]/60 last:border-0">
                    <span className="font-mono">{e.at?.slice(11, 19)}</span>
                    <span className="text-[#7C3AED] font-bold">{e.type}</span>
                    <span className="whitespace-pre-line">{e.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CTA resultado */}
        {result && (
          <div className="bg-[#7C3AED] text-white py-8 px-6 rounded-3xl text-center">
            <h2 className="text-xl font-black mb-1">Esto acaba de ocurrir sin intervención humana.</h2>
            <p className="text-white/90 text-sm mb-4">CanchaLlena atendió al cliente, gestionó la operación y actualizó el club. Usted no hizo nada.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={onNavigateHome} className="px-6 py-3 rounded-xl bg-white text-[#7C3AED] font-extrabold">Configurar mi demostración</button>
              <button onClick={() => (window.location.href = 'https://wa.me/56939688275')} className="px-6 py-3 rounded-xl border border-white/40 font-bold hover:bg-white/10">Hablar con un asesor</button>
            </div>
          </div>
        )}
      </div>

      {loading && <p className="text-center py-10 text-[#62626A]">Cargando demo...</p>}
    </div>
  );
}
