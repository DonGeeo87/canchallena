import React from 'react';
import { Trophy, Users, UserCheck, RotateCcw, Layers, BellRing, BarChart3, Sparkles } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

const funcionalidades = [
  {
    icon: UserCheck,
    title: 'Reconoce a cada socio',
    desc: 'Identifica por su WhatsApp, saluda por nombre y arma su ficha con su objetivo, horario y modalidad de juego.',
    color: '#7C3AED',
  },
  {
    icon: Trophy,
    title: 'Coach de progreso personalizado',
    desc: 'Combina la ficha del socio con su historial de partidos y genera un plan único: qué mejorar, con quién jugar y cómo subir de nivel.',
    color: '#C7F000',
  },
  {
    icon: Users,
    title: 'Duplas automáticas',
    desc: '¿Le falta compañero? Busca el socio más afín, lo invita por WhatsApp, espera su respuesta y avisa al recién al confirmar.',
    color: '#16A34A',
  },
  {
    icon: RotateCcw,
    title: 'Cancelación con reemplazo',
    desc: 'Si un jugador se baja, libera el cupo y busca un reemplazo al instante para que el partido no se caiga.',
    color: '#F59E0B',
  },
  {
    icon: Layers,
    title: 'Matchmaking por nivel',
    desc: 'Empareja por categoría chilena (3ª a 6ª). Los nuevos 6ª siempre juegan, con un mejor como pareja para que aprendan y vuelvan.',
    color: '#3B82F6',
  },
  {
    icon: BellRing,
    title: 'Recordatorios de partido',
    desc: 'Avisa a los jugadores confirmados antes de su partido para reducir no-shows y last-minute.',
    color: '#EC4899',
  },
  {
    icon: BarChart3,
    title: 'Resumen del club para el dueño',
    desc: 'Socios, ocupación, partidos en curso y actividad del agente en tiempo real desde su panel.',
    color: '#10B981',
  },
];

export const FuncionalidadesSection: React.FC = () => {
  return (
    <section id="funcionalidades" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Todo lo que su club necesita
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            UN ASISTENTE PARA <br /><span className="text-[#7C3AED]">EL CLUB Y PARA CADA SOCIO.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#62626A]">
            CanchaLlena no solo llena canchas: conoce a sus jugadores, los hace mejorar y cuida que vuelvan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {funcionalidades.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="bg-[#F7F7F4] rounded-3xl p-6 border border-[#D9D9D2] hover:border-[#7C3AED]/50 transition-all duration-300 hover:shadow-md flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${f.color}22`, color: f.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-[#101014] text-sm leading-snug">{f.title}</h3>
                <p className="text-xs text-[#62626A] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Banner destacado llenado valle */}
        <div className="mt-12 relative rounded-3xl bg-[#101014] text-white p-8 md:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs bg-[#C7F000] text-[#101014] font-black px-3 py-1 rounded-full">
                <Layers className="w-3.5 h-3.5" /> Llenado de horas valle
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">Si falta un jugador por nivel, busca en otros niveles hasta cubrir la cancha.</h3>
              <p className="text-sm text-[#D9D9D2]">
                El agente monitorea los partidos incompletos, detecta canchas 3/4 o 2/4 y contacta a socios compatibles por WhatsApp — ampliando el nivel si es necesario — para que ninguna cancha quede vacía.
              </p>
            </div>
            <div className="shrink-0"><PadelBall size={48} glow /></div>
          </div>
        </div>
      </div>
    </section>
  );
};
