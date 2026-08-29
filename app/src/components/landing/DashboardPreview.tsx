import React from 'react';
import { LayoutDashboard, CheckCircle2, Circle, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface DashboardPreviewProps {
  onNavigate?: (route: string) => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({ onNavigate }) => {

  return (
    <section className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Panel de Control en Vivo
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            CENTRO DE MANDO <br />
            <span className="text-[#7C3AED]">DISEÑADO PARA DUEÑOS DE CLUB.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            Toda la información crítica de su club en una sola pantalla clara, accesible y sin tablas interminables.
          </p>
        </div>

        {/* Interactive Live Dashboard Mockup */}
        <div className="bg-[#F7F7F4] rounded-3xl p-4 sm:p-8 border border-[#D9D9D2] shadow-lg max-w-5xl mx-auto space-y-6">
          
          {/* Top Admin Summary Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#D9D9D2] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#62626A]">
                  Pádel Club Vitacura · Hoy
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#101014] mt-0.5">
                Buenas tardes, Rodrigo
              </h3>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center sm:text-right">
              <div className="bg-[#F7F7F4] px-3 py-2 rounded-xl border border-[#D9D9D2]">
                <div className="text-lg font-extrabold text-[#101014]">12</div>
                <div className="text-[10px] text-[#62626A] font-medium">Reservas Hoy</div>
              </div>
              <div className="bg-[#F7F7F4] px-3 py-2 rounded-xl border border-[#D9D9D2]">
                <div className="text-lg font-extrabold text-[#7C3AED]">3</div>
                <div className="text-[10px] text-[#62626A] font-medium">Partidos 4/4</div>
              </div>
              <div className="bg-[#F7F7F4] px-3 py-2 rounded-xl border border-[#D9D9D2]">
                <div className="text-lg font-extrabold text-[#16A34A]">87%</div>
                <div className="text-[10px] text-[#62626A] font-medium">Ocupación</div>
              </div>
            </div>
          </div>

          {/* Intelligent Opportunity Banner (Section 28 Preview) */}
          <div className="bg-gradient-to-r from-[#7C3AED]/15 via-[#C7F000]/15 to-[#7C3AED]/15 rounded-2xl p-4 sm:p-5 border border-[#7C3AED]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#7C3AED] text-white shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#101014] flex items-center gap-1.5">
                  💡 Oportunidad detectada por CanchaLlena
                </h4>
                <p className="text-xs text-[#62626A] mt-0.5">
                  Tiene 2 canchas libres hoy a las 15:00. Encontramos 8 jugadores disponibles compatibles (Nivel 3.0 - 3.5).
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate?.('/login')}
              className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold shrink-0 shadow-2xs transition-all active:scale-95"
            >
              Crear partidos abiertos
            </button>
          </div>

          {/* Court Status Real-Time Matrix */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#D9D9D2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#101014] uppercase tracking-wider">
                Grilla de Canchas en Vivo
              </h4>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-[#62626A]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Libre
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Reservada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Partido Abierto
                </span>
              </div>
            </div>

            {/* Matrix table / cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Cancha 1 */}
              <div className="bg-[#F7F7F4] rounded-xl p-4 border border-[#D9D9D2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#101014]">Cancha 01</span>
                  <span className="text-xs font-bold text-[#7C3AED] bg-white px-2 py-0.5 rounded-md border border-[#D9D9D2]">
                    92% Ocupada
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">18:00</span>
                    <span className="font-bold text-[#7C3AED] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reservada (WhatsApp)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">19:30</span>
                    <span className="font-bold text-[#F59E0B] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Partido #1048 (4/4)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">21:00</span>
                    <span className="font-bold text-[#7C3AED] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reservada
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancha 2 */}
              <div className="bg-[#F7F7F4] rounded-xl p-4 border border-[#D9D9D2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#101014]">Cancha 02</span>
                  <span className="text-xs font-bold text-[#16A34A] bg-white px-2 py-0.5 rounded-md border border-[#D9D9D2]">
                    83% Ocupada
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">15:00</span>
                    <span className="font-bold text-[#F59E0B] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Match #1042 (3/4)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">18:00</span>
                    <span className="font-bold text-[#7C3AED] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reservada (Gonzalo F.)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">19:30</span>
                    <span className="font-bold text-[#16A34A] flex items-center gap-1">
                      <Circle className="w-3 h-3" /> Libre (Horario Disponible)
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancha 3 */}
              <div className="bg-[#F7F7F4] rounded-xl p-4 border border-[#D9D9D2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#101014]">Cancha 03</span>
                  <span className="text-xs font-bold text-[#101014] bg-white px-2 py-0.5 rounded-md border border-[#D9D9D2]">
                    75% Ocupada
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">16:30</span>
                    <span className="font-bold text-[#F59E0B] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Match #1045 (2/4)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">18:00</span>
                    <span className="font-bold text-[#7C3AED] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reservada
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#D9D9D2]/70">
                    <span className="font-medium text-[#62626A]">19:30</span>
                    <span className="font-bold text-[#7C3AED] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reservada
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 17: "Usted Sigue Teniendo el Control" */}
          <div className="bg-white rounded-2xl p-6 border border-[#D9D9D2] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-extrabold text-[#7C3AED] uppercase">
                <Shield className="w-4 h-4" />
                Seguridad & Autonomía Total
              </div>
              <h4 className="text-lg font-extrabold text-[#101014]">
                CanchaLlena automatiza. Usted decide siempre.
              </h4>
              <p className="text-xs text-[#62626A] max-w-xl">
                Bloquee canchas para torneos propios, ajuste precios en tiempo real o intervenga manualmente en cualquier reserva con un solo clic.
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('/login')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101014] text-white font-bold text-xs hover:bg-[#7C3AED] transition-colors shrink-0 cursor-pointer"
            >
              <span>Explorar Centro de Mando</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
