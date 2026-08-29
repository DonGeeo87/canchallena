import React from 'react';
import { Settings, MessageSquare, Zap, CheckCircle2 } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Configure su club en 5 minutos',
      description: 'Defina la cantidad de canchas (cristal, panorámicas, techadas), sus tarifas por horario punta/valle y sus horas de operación.',
      icon: Settings,
      details: ['3 canchas iniciales pre-cargadas', 'Precios diferenciados punta vs valle', 'Duración de turnos (60 / 90 min)'],
      color: '#7C3AED',
    },
    {
      num: '02',
      title: 'Conecte su número de WhatsApp',
      description: 'Sus jugadores continúan escribiendo al número oficial del club que ya tienen guardado en sus contactos. Sin cambiar de línea.',
      icon: MessageSquare,
      details: ['Escaneo QR seguro en 30 segundos', 'Mensajes con el tono y branding de su club', 'Sin perder contacto con clientes'],
      color: '#16A34A',
    },
    {
      num: '03',
      title: 'CanchaLlena hace el resto',
      description: 'El sistema atiende 24/7, confirma reservas al segundo y activa el matchmaking para llenar los horarios valle y partidos incompletos.',
      icon: Zap,
      details: ['Reservas automáticas al instante', 'Matchmaking 4/4 compatible', 'Sincronización en tiempo real con su panel'],
      color: '#C7F000',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Implementación Sin Fricción
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            PUESTA EN MARCHA EN <br />
            <span className="text-[#7C3AED]">3 SIMPLES PASOS.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            Sin instalaciones técnicas complicadas ni capacitaciones eternas para su personal.
          </p>
        </div>

        {/* 3 Step Connected Cards with Court Line SVG Path */}
        <div className="relative">
          
          {/* Connecting Padel Court Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-1 bg-[#D9D9D2] -translate-y-6 z-0">
            <div className="h-full bg-gradient-to-r from-[#7C3AED] via-[#16A34A] to-[#C7F000]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-[#F7F7F4] rounded-3xl p-8 border border-[#D9D9D2] hover:border-[#7C3AED] transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Step Pill & Icon */}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shadow-xs text-white"
                        style={{ backgroundColor: step.color === '#C7F000' ? '#101014' : step.color }}
                      >
                        <Icon className="w-6 h-6" style={{ color: step.color === '#C7F000' ? '#C7F000' : '#FFFFFF' }} />
                      </div>
                      <span className="text-2xl font-black text-[#101014]/30">{step.num}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-[#101014] leading-snug">
                      {step.title}
                    </h3>

                    <p className="text-sm text-[#62626A] leading-relaxed">
                      {step.description}
                    </p>

                    {/* Bullet details */}
                    <ul className="space-y-2 pt-2 border-t border-[#D9D9D2]/70 text-xs text-[#101014] font-medium">
                      {step.details.map((item, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {idx === 2 && (
                    <div className="mt-6 pt-4 border-t border-[#D9D9D2]/80 flex items-center gap-2 text-xs font-extrabold text-[#7C3AED]">
                      <PadelBall size={16} glow={false} />
                      <span>¡Canchas llenas desde el día 1!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
