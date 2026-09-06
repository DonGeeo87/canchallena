import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Necesito instalar algún programa en las computadoras del club?',
      a: 'No. CanchaLlena es 100% web en la nube. Puede acceder desde cualquier navegador en su computador, tablet o teléfono móvil sin descargar ejecutables.',
    },
    {
      q: '¿Mis jugadores necesitan descargar una aplicación móvil?',
      a: 'No. La gran ventaja de CanchaLlena es que sus jugadores interactúan directamente por WhatsApp, la herramienta que ya tienen instalada y usan a diario. Cero fricción de adopción.',
    },
    {
      q: '¿Mis socios usan el número o una aplicación nueva?',
      a: 'Sus socios interactúan por WhatsApp con el asistente de CanchaLlena. No instalan ninguna app, no crean cuentas ni ingresan tarjetas: reservan conversando, como ya lo hacen a diario.',
    },
    {
      q: '¿Qué ocurre si un jugador cancela su reserva a última hora?',
      a: 'El sistema libera el cupo al instante y busca un reemplazo compatible por WhatsApp, escalando de nivel si hace falta, para que el partido no se caiga y la cancha no quede vacía.',
    },
    {
      q: '¿Cómo encuentra jugadores CanchaLlena para armar partidos?',
      a: 'Usa las categorías chilenas (3ª a 6ª) de cada socio, sus horarios de preferencia y su historial para armar partidos equilibrados 4/4. Los socios nuevos (6ª) siempre juegan, emparejados con un mejor, para que aprendan y vuelvan.',
    },
    {
      q: '¿Puedo administrar varias canchas?',
      a: 'Sí, cada cancha con su nombre y precio por turno, y horarios de apertura definidos por día de la semana. El plan Club incluye hasta 6 canchas y el Pro canchas ilimitadas.',
    },
    {
      q: '¿Puedo intervenir manualmente en cualquier momento?',
      a: 'Siempre. Usted y su equipo conservan el control total del panel: pueden editar canchas, horarios, socios o estados de reserva con un solo clic. El asistente toma los datos que usted carga.',
    },
    {
      q: '¿Qué sucede durante los 14 días de prueba gratis?',
      a: 'Tiene acceso completo al Plan Club. No le pedimos tarjeta de crédito para iniciar.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Resolviendo Dudas
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            PREGUNTAS FRECUENTES.
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            Todo lo que necesita saber antes de transformar la gestión de su club.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#F7F7F4] rounded-2xl border border-[#D9D9D2] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-extrabold text-sm sm:text-base text-[#101014] hover:text-[#7C3AED] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#62626A] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#7C3AED]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#62626A] leading-relaxed border-t border-[#D9D9D2]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
