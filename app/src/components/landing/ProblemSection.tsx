import React, { useState } from 'react';
import { MessageSquare, AlertCircle, Clock, Users, ArrowRight, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

export const ProblemSection: React.FC = () => {
  const [activeProblem, setActiveProblem] = useState<number>(0);

  const problems = [
    {
      id: 0,
      number: '01',
      badge: 'Mensajería Caótica',
      icon: MessageSquare,
      title: '¿Tiene cancha libre hoy?',
      description:
        'Decenas de audios y mensajes diarios en WhatsApp pidiendo horarios, precios y confirmaciones que consumen hasta 4 horas al día al administrador.',
      messages: [
        { sender: 'Matías (14:12)', text: 'Hola Rodrigo! Hay cancha a las 7 hoy? Ojalá la 1' },
        { sender: 'Rodrigo Admin (14:20)', text: 'Hola Matías, a las 19:00 está ocupada, tengo 21:00' },
        { sender: 'Matías (14:35)', text: 'Ah pucha, y a las 18:00? Déjame preguntarle a los cabros...' },
        { sender: 'Gonzalo (14:40)', text: 'Hola tienen paletas de test hoy??' },
      ],
      impact: 'Pérdida de clientes por respuestas lentas y desorden en reservas simultáneas.',
    },
    {
      id: 1,
      number: '02',
      badge: 'Partidos Incompletos',
      icon: Users,
      title: '¿Quién viene? ¿Falta uno?',
      description:
        'Jugadores que reservan para 4, a última hora se les baja uno a las 18:30 y cancelan la cancha completa a minutos de comenzar.',
      messages: [
        { sender: 'Felipe (17:45)', text: 'Rodri se nos cayó el 4to por pega 🤦‍♂️' },
        { sender: 'Felipe (17:46)', text: '¿Conoces a alguien 3ra/4ta que esté allá para meterlo?' },
        { sender: 'Rodrigo Admin (17:50)', text: 'Chuta voy a ver si pillo a alguien en el club...' },
        { sender: 'Felipe (18:10)', text: 'No conseguimos. Vamos a tener que cancelar la de las 18:30 sry' },
      ],
      impact: 'Canchas canceladas de imprevisto y dinero perdido por falta de red de reemplazo.',
    },
    {
      id: 2,
      number: '03',
      badge: 'El Agujero Económico',
      icon: Clock,
      title: 'Cancha vacía a las 15:00',
      description:
        'Mientras el horario punta (19:00 - 22:30) está con lista de espera, las horas valle (11:00 a 17:00) quedan desiertas con luces encendidas y costos fijos.',
      messages: [
        { sender: 'Sistema (15:00)', text: '🎾 Cancha 1: Vacía' },
        { sender: 'Sistema (15:00)', text: '🎾 Cancha 2: Vacía' },
        { sender: 'Sistema (15:00)', text: '🎾 Cancha 3: Vacía' },
        { sender: 'Balance', text: 'Pérdida estimada: $48.000 / día en horas muertas' },
      ],
      impact: 'Hasta un 40% de ingresos potenciales no realizados cada mes.',
    },
  ];

  return (
    <section id="problema" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            La Realidad de los Clubes
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight leading-tight">
            ADMINISTRAR UNA CANCHA NO DEBERÍA SIGNIFICAR{' '}
            <span className="text-[#7C3AED]">VIVIR EN WHATSAPP.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            La gestión manual en libreta o chat genera fricción, cancelaciones de último minuto y horas valle sin ingresos.
          </p>
        </div>

        {/* 3 Problems Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            const isSelected = activeProblem === idx;
            return (
              <div
                key={prob.id}
                onMouseEnter={() => setActiveProblem(idx)}
                onClick={() => setActiveProblem(idx)}
                className={`relative rounded-2xl p-6 transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#F7F7F4] border-[#7C3AED] shadow-md -translate-y-1'
                    : 'bg-white border-[#D9D9D2] hover:border-[#62626A]/40'
                }`}
              >
                {/* Top Number & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-extrabold text-[#7C3AED]">{prob.number}</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#D9D9D2] text-[#62626A]">
                    {prob.badge}
                  </span>
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#7C3AED] text-white' : 'bg-[#F7F7F4] text-[#101014]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-[#101014] leading-snug">
                    {prob.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-[#62626A] leading-relaxed mb-4">
                  {prob.description}
                </p>

                {/* WhatsApp Chat Preview Snippet */}
                <div className="bg-white rounded-xl p-3 border border-[#D9D9D2]/80 space-y-2 text-xs">
                  {prob.messages.slice(0, 2).map((m, mIdx) => (
                    <div key={mIdx} className="bg-[#F7F7F4] rounded-lg p-2">
                      <span className="font-bold text-[#101014] block text-[10px] text-[#7C3AED]">{m.sender}</span>
                      <span className="text-[#62626A]">{m.text}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom Impact Note */}
                <div className="mt-4 pt-3 border-t border-[#D9D9D2]/60 text-xs font-semibold text-[#DC2626] flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{prob.impact}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* TRANSICIÓN PROBLEMA -> SOLUCIÓN (Section 11: Caos -> Orden -> Automatización) */}
        <div className="relative rounded-3xl bg-[#101014] text-white p-8 md:p-12 overflow-hidden border border-[#D9D9D2]">
          {/* Background Geometry */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#C7F000]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C7F000] text-[#101014] text-xs font-extrabold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                La Transformación CanchaLlena
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                DEL CAOS MANUAL <br />
                <span className="text-[#C7F000]">A LA CANCHA LLENA.</span>
              </h3>
              <p className="text-sm text-[#D9D9D2] leading-relaxed">
                Transformamos las conversaciones desordenadas de WhatsApp en reservas confirmadas al instante y partidos llenos automáticamente con jugadores afines.
              </p>

              {/* State Transition Indicator */}
              <div className="flex items-center gap-3 pt-2">
                <div className="px-3 py-1 rounded-md bg-white/10 text-xs font-mono line-through opacity-60">
                  CAOS
                </div>
                <ArrowRight className="w-4 h-4 text-[#C7F000]" />
                <div className="px-3 py-1 rounded-md bg-white/20 text-xs font-mono">
                  ORDEN
                </div>
                <ArrowRight className="w-4 h-4 text-[#C7F000]" />
                <div className="px-3 py-1 rounded-md bg-[#7C3AED] text-white text-xs font-bold font-mono">
                  AUTOMATIZACIÓN
                </div>
              </div>
            </div>

            {/* Visual Transformation Box */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-red-400 font-bold">
                  <span>ANTES (MANUAL)</span>
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="space-y-2 text-xs opacity-75">
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-red-300 font-medium">"¿Hola, queda cancha?"</p>
                    <p className="text-[10px] text-gray-400">Esperando respuesta 45 min...</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded">
                    <p className="text-red-300 font-medium">"Se nos cayó uno a las 18:30"</p>
                    <p className="text-[10px] text-gray-400">Cancha cancelada vacía</p>
                  </div>
                </div>
              </div>

              {/* After Card (CanchaLlena) */}
              <div className="bg-[#7C3AED]/20 border border-[#7C3AED] rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <PadelBall size={18} glow />
                </div>
                <div className="flex items-center justify-between text-xs text-[#C7F000] font-bold">
                  <span>CON CANCHALLENA</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="bg-[#FFFFFF]/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                    <p className="text-white font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F000]" />
                      RESERVA CONFIRMADA
                    </p>
                    <p className="text-[11px] text-[#C7F000] mt-0.5">Cancha 01 · 19:30 · En 2 seg</p>
                  </div>
                  <div className="bg-[#FFFFFF]/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                    <p className="text-white font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F000]" />
                      MATCH COMPLETO 4/4
                    </p>
                    <p className="text-[11px] text-[#C7F000] mt-0.5">Andrés (Nivel 3.2) incorporado</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
