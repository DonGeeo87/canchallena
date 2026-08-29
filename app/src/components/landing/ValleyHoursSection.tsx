import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

export const ValleyHoursSection: React.FC = () => {
  const [valleFilled, setValleFilled] = useState(true);

  return (
    <section id="horarios-valle" className="py-20 md:py-28 bg-[#F7F7F4] relative border-b border-[#D9D9D2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5" />
            Impacto Económico Directo
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            LAS HORAS VACÍAS <br />
            <span className="text-[#7C3AED]">TAMBIÉN PUEDEN GENERAR INGRESOS.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            La diferencia entre un club rentable y uno con problemas de flujo no está en las 20:00 hrs, sino en monetizar las canchas entre las 11:00 y las 17:00.
          </p>
        </div>

        {/* Timeline Visualization Box */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-10 border border-[#D9D9D2] shadow-sm max-w-5xl mx-auto space-y-8">
          
          {/* Top Control Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D9D2]/80 pb-5">
            <div>
              <span className="text-xs font-bold text-[#62626A] uppercase">Ocupación del Club durante el día</span>
              <h3 className="text-xl font-extrabold text-[#101014]">Línea Temporal de Demanda (3 Canchas)</h3>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F7F4] p-1 rounded-xl border border-[#D9D9D2]">
              <button
                onClick={() => setValleFilled(false)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                  !valleFilled ? 'bg-[#DC2626] text-white' : 'text-[#62626A] hover:text-[#101014]'
                }`}
              >
                Sin CanchaLlena (Horas Muertas)
              </button>
              <button
                onClick={() => setValleFilled(true)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                  valleFilled ? 'bg-[#7C3AED] text-white' : 'text-[#62626A] hover:text-[#101014]'
                }`}
              >
                ⚡ Con CanchaLlena (Automatizado)
              </button>
            </div>
          </div>

          {/* Graphical Timeline Bar Slots */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              
              {/* 09:00 Slot */}
              <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#D9D9D2] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#101014]">
                  <span>09:00</span>
                  <span className="text-[#16A34A]">85%</span>
                </div>
                <div className="h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-[10px] text-[#62626A] block">Clases & Matinales</span>
              </div>

              {/* 12:00 Slot */}
              <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#D9D9D2] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#101014]">
                  <span>12:00</span>
                  <span className="text-[#16A34A]">70%</span>
                </div>
                <div className="h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="text-[10px] text-[#62626A] block">Turno Almuerzo</span>
              </div>

              {/* 15:00 Slot — THE VALLEY HOUR */}
              <div
                className={`rounded-2xl p-4 border-2 transition-all duration-500 space-y-2 relative ${
                  valleFilled
                    ? 'bg-[#7C3AED]/10 border-[#7C3AED] shadow-sm'
                    : 'bg-[#DC2626]/5 border-dashed border-[#DC2626]/60'
                }`}
              >
                {valleFilled && (
                  <span className="absolute -top-2.5 right-2 bg-[#C7F000] text-[#101014] text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                    RECUPERADO
                  </span>
                )}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#101014]">15:00 (Valle)</span>
                  <span className={valleFilled ? 'text-[#7C3AED] font-extrabold' : 'text-[#DC2626]'}>
                    {valleFilled ? '90%' : '15%'}
                  </span>
                </div>
                <div className="h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      valleFilled ? 'bg-[#7C3AED]' : 'bg-[#DC2626]'
                    }`}
                    style={{ width: valleFilled ? '90%' : '15%' }}
                  />
                </div>
                <span className="text-[10px] font-bold block text-[#7C3AED]">
                  {valleFilled ? 'Matchmaking 4/4 Activo' : 'Canchas Vacías'}
                </span>
              </div>

              {/* 18:00 Slot */}
              <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#D9D9D2] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#101014]">
                  <span>18:00 (Punta)</span>
                  <span className="text-[#16A34A]">100%</span>
                </div>
                <div className="h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[10px] text-[#62626A] block">Lleno Total</span>
              </div>

              {/* 21:00 Slot */}
              <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#D9D9D2] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#101014]">
                  <span>21:00 (Punta)</span>
                  <span className="text-[#16A34A]">100%</span>
                </div>
                <div className="h-4 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[10px] text-[#62626A] block">Lleno Total</span>
              </div>

            </div>
          </div>

          {/* Action Sequence Pathway (Section 15 Specification) */}
          <div className="pt-4 border-t border-[#D9D9D2]/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#62626A] mb-4 text-center">
              Ciclo de Monetización Automática en Horarios Valle
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#D9D9D2]">
                <span className="text-[#101014] font-bold block">1. Cancha Libre</span>
                <span className="text-[10px] text-[#62626A]">15:00 desocupada</span>
              </div>
              <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#D9D9D2]">
                <span className="text-[#7C3AED] font-bold block">2. Matchmaking</span>
                <span className="text-[10px] text-[#62626A]">Filtra nivel 3.0-3.5</span>
              </div>
              <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#D9D9D2]">
                <span className="text-[#7C3AED] font-bold block">3. Invitaciones</span>
                <span className="text-[10px] text-[#62626A]">WhatsApp automático</span>
              </div>
              <div className="bg-[#F7F7F4] p-3 rounded-xl border border-[#D9D9D2]">
                <span className="text-[#101014] font-bold block">4. 4 Jugadores</span>
                <span className="text-[10px] text-[#62626A]">Cupos confirmados</span>
              </div>
              <div className="bg-[#C7F000] p-3 rounded-xl border border-[#101014]/20 shadow-2xs font-extrabold text-[#101014]">
                <span className="block">5. Reserva Pagada</span>
                <span className="text-[10px] opacity-80">+$18.000 generados</span>
              </div>
            </div>
          </div>

          {/* Bottom Revenue Summary */}
          <div className="bg-[#101014] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs text-[#C7F000] font-bold uppercase tracking-wider">
                Impacto Mensual Promedio por Club (4 Canchas)
              </span>
              <p className="text-sm text-[#D9D9D2]">
                Llenar solo 2 tandas valle extras al día equivale a más de <strong className="text-white font-bold">$1.080.000 CLP</strong> adicionales al mes.
              </p>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <span className="text-xs text-[#D9D9D2] block">Recuperación estimada</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#C7F000]">+$1.080.000</span>
              <span className="text-[10px] text-gray-400 block">CLP / mes</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
