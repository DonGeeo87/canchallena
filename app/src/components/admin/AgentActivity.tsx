import { useEffect, useState } from 'react';
import { Bot, MessageSquare, CalendarCheck, UserCheck, Activity } from 'lucide-react';
import { api } from '../../services/api';

interface AgentActivityData {
  club_id: string;
  hoy: Record<string, number>;
  ultimos7dias: Record<string, number>;
  resumen_hoy: { conversaciones: number; reservas_gestionadas: number; invitaciones_aceptadas: number; invitaciones_rechazadas: number; total_eventos: number };
  timeline: Array<{ event: string; data: string; created_at: string; player_name?: string }>;
}

// Iconos y etiquetas por tipo de evento del agente
const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  mensaje: { icon: '💬', label: 'Respondió consulta', color: '#3B82F6' },
  reserva_ok: { icon: '📅', label: 'Confirmó reserva', color: '#16A34A' },
  invitacion_si: { icon: '🎾', label: 'Jugador aceptó partido', color: '#7C3AED' },
  invitacion_no: { icon: '↩️', label: 'Jugador rechazó partido', color: '#EF4444' },
  invitacion_expirada: { icon: '⏳', label: 'Invitación expirada', color: '#F59E0B' },
  bot_paused: { icon: '🔕', label: 'Bot pausado', color: '#62626A' },
  bot_activated: { icon: '🔔', label: 'Bot activado', color: '#16A34A' },
  unirse_partido: { icon: '🎾', label: 'Jugador se unió', color: '#7C3AED' },
};

export default function AgentActivity() {
  const [data, setData] = useState<AgentActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const d = await api.agent.getActivity();
        setData(d);
      } catch (e) {
        setError('No se pudo cargar la actividad del agente. ' + (e instanceof Error ? e.message : ''));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="py-10 text-center text-[#62626A]">Cargando actividad del agente...</p>;
  if (error) return <p className="py-10 text-center text-[#EF4444]">{error}</p>;
  if (!data) return null;

  const kpis = [
    { label: 'Conversaciones hoy', value: data.resumen_hoy.conversaciones, icon: MessageSquare, color: '#3B82F6' },
    { label: 'Reservas gestionadas', value: data.resumen_hoy.reservas_gestionadas, icon: CalendarCheck, color: '#16A34A' },
    { label: 'Partidos aceptados', value: data.resumen_hoy.invitaciones_aceptadas, icon: UserCheck, color: '#7C3AED' },
    { label: 'Total acciones del agente', value: data.resumen_hoy.total_eventos, icon: Activity, color: '#F59E0B' },
  ];

  const fmtTime = (utc: string) => {
    if (!utc) return '';
    const d = new Date(utc.replace(' ', 'T') + 'Z');
    return d.toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-extrabold">Actividad del Agente</h2>
            <p className="text-white/80 text-sm">Lo que CanchaLlena hizo hoy por tu club, sin intervención humana.</p>
          </div>
        </div>
      </div>

      {/* KPIs del agente */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-[#D9D9D2]">
            <k.icon className="w-5 h-5 mb-2" style={{ color: k.color }} />
            <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] text-[#62626A] font-bold uppercase mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Comparativa 7 días */}
      <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2]">
        <h3 className="font-extrabold mb-3 text-sm">📊 Últimos 7 días</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { e: 'mensaje', label: 'Consultas' },
            { e: 'reserva_ok', label: 'Reservas' },
            { e: 'invitacion_si', label: 'Aceptaciones' },
            { e: 'invitacion_no', label: 'Rechazos' },
          ].map((it) => (
            <div key={it.e} className="flex items-center justify-between bg-[#FAFAF8] rounded-xl px-4 py-3">
              <span className="text-xs text-[#62626A]">{it.label}</span>
              <span className="font-extrabold">{data.ultimos7dias[it.e] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2]">
        <h3 className="font-extrabold mb-4 text-sm">🕐 Últimas acciones del agente</h3>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-[#62626A]">Aún no hay actividad registrada. Cuando el bot trabaje (reservas, partidos, consultas), aparecerá aquí el resumen.</p>
        ) : (
          <div className="space-y-3">
            {data.timeline.map((ev, i) => {
              const meta = EVENT_META[ev.event] || { icon: '🤖', label: ev.event, color: '#62626A' };
              return (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#D9D9D2]/60 last:border-0">
                  <span className="text-xl">{meta.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</p>
                    {ev.player_name && <p className="text-xs text-[#101014]">Jugador: {ev.player_name}</p>}
                  </div>
                  <span className="text-[10px] text-[#62626A] whitespace-nowrap">{fmtTime(ev.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
