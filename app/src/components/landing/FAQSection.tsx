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
      q: '¿Puedo seguir usando el mismo número de WhatsApp de mi club?',
      a: 'Sí. Conectamos su línea oficial existente mediante un enlace seguro vía código QR. Sus clientes seguirán viendo su nombre, logo y número habitual.',
    },
    {
      q: '¿Qué ocurre si un jugador cancela su reserva a última hora?',
      a: 'El sistema libera el cupo al instante y, si está activado el matchmaking, envía alertas automatizadas a jugadores compatibles en lista de espera para rellenar la cancha antes del inicio del turno.',
    },
    {
      q: '¿Cómo encuentra jugadores CanchaLlena para armar partidos?',
      a: 'A través de los perfiles históricos y categorías (Nivel 2.5 a 5.0) de los jugadores de su club. El algoritmo evalúa nivel deportivo, horario de preferencia y cercanía para sugerir partidos equilibrados 4/4.',
    },
    {
      q: '¿Puedo administrar varias canchas y sedes simultáneamente?',
      a: 'Sí. Puede configurar desde 1 hasta más de 20 canchas con superficies diferenciadas (panorámica, techada, outdoor) y precios variables por día y hora.',
    },
    {
      q: '¿Puedo intervenir manualmente en cualquier momento?',
      a: 'Siempre. Usted y su equipo conservan el control total del panel. Pueden bloquear canchas para mantenimiento o torneos, modificar reservas o cambiar estados con un solo clic.',
    },
    {
      q: '¿Qué sucede durante los 14 días de prueba gratis?',
      a: 'Tiene acceso completo a todas las funciones del Plan Club: conexión de WhatsApp, matchmaking y panel en tiempo real. No le pedimos tarjeta de crédito para iniciar.',
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
