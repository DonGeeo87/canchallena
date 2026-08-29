import React, { useState } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';

interface ValueCalculatorProps {
  onNavigate?: (route: string) => void;
}

export const ValueCalculator: React.FC<ValueCalculatorProps> = ({ onNavigate }) => {
  const [courtsCount, setCourtsCount] = useState<number>(3);
  const [emptyHoursPerDay, setEmptyHoursPerDay] = useState<number>(3);
  const [pricePerSlot, setPricePerSlot] = useState<number>(16000);
  const [fillRatePercentage] = useState<number>(55); // estimated % of valley hours recovered

  // Calculation: Courts * EmptyHours * (fillRate / 100) * Price * 30 days
  const recoveredHoursPerDay = courtsCount * (emptyHoursPerDay / 1.5) * (fillRatePercentage / 100);
  const monthlyExtraRevenue = Math.round(recoveredHoursPerDay * pricePerSlot * 30);
  const annualExtraRevenue = monthlyExtraRevenue * 12;

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section id="calculadora" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            Simulador de Retorno de Inversión
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            ¿CUÁNTO PODRÍA RECUPERAR <br />
            <span className="text-[#7C3AED]">CON SUS HORAS VALLE?</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            Ajuste los parámetros de su club y descubra el impacto directo en sus ingresos mensuales al automatizar reservas y matchmaking.
          </p>
        </div>

        {/* Calculator Main Interactive Container */}
        <div className="bg-[#F7F7F4] rounded-3xl p-6 sm:p-10 border border-[#D9D9D2] shadow-sm max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Inputs Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input 1: Courts count */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-[#101014]">
                <span>Número de Canchas en su Club</span>
                <span className="text-[#7C3AED] font-extrabold">{courtsCount} canchas</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={courtsCount}
                onChange={(e) => setCourtsCount(Number(e.target.value))}
                className="w-full h-2 bg-[#D9D9D2] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[10px] text-[#62626A]">
                <span>1 cancha</span>
                <span>6 canchas</span>
                <span>12 canchas</span>
              </div>
            </div>

            {/* Input 2: Empty hours per day */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-[#101014]">
                <span>Horas vacías promedio al día por cancha</span>
                <span className="text-[#7C3AED] font-extrabold">{emptyHoursPerDay} hrs / día</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={emptyHoursPerDay}
                onChange={(e) => setEmptyHoursPerDay(Number(e.target.value))}
                className="w-full h-2 bg-[#D9D9D2] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[10px] text-[#62626A]">
                <span>1 hora</span>
                <span>4 horas</span>
                <span>8 horas</span>
              </div>
            </div>

            {/* Input 3: Price per slot */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-[#101014]">
                <span>Precio promedio por tanda (90 min)</span>
                <span className="text-[#7C3AED] font-extrabold">{formatCLP(pricePerSlot)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="30000"
                step="2000"
                value={pricePerSlot}
                onChange={(e) => setPricePerSlot(Number(e.target.value))}
                className="w-full h-2 bg-[#D9D9D2] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[10px] text-[#62626A]">
                <span>$10.000</span>
                <span>$20.000</span>
                <span>$30.000</span>
              </div>
            </div>

            {/* Input 4: Target Recovery Rate */}
            <div className="bg-white rounded-2xl p-4 border border-[#D9D9D2] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#101014]">
                <span>Tasa de llenado estimada con CanchaLlena</span>
                <span className="text-[#16A34A]">{fillRatePercentage}% de ocupación extra</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div className="bg-[#16A34A] h-full" style={{ width: `${fillRatePercentage}%` }} />
              </div>
              <p className="text-[10px] text-[#62626A]">
                Estimación conservadora basada en clubes activos en Santiago y regiones.
              </p>
            </div>

          </div>

          {/* Right Dynamic Result Card */}
          <div className="lg:col-span-5 bg-[#101014] text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-[#D9D9D2] shadow-xl text-center">
            
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#C7F000] uppercase tracking-wider block">
                Potencial Estimado Adicional
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatCLP(monthlyExtraRevenue)}
              </div>
              <span className="text-xs text-[#D9D9D2] font-medium block">
                ingresos extras al mes
              </span>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-left">
              <div className="flex justify-between text-[#D9D9D2]">
                <span>Proyección Anual:</span>
                <span className="font-bold text-white">{formatCLP(annualExtraRevenue)}</span>
              </div>
              <div className="flex justify-between text-[#D9D9D2]">
                <span>Costo plan CLUB CanchaLlena:</span>
                <span className="font-bold text-[#C7F000]">$39.990 / mes</span>
              </div>
              <div className="flex justify-between text-[#D9D9D2]">
                <span>Retorno mensual estimado (ROI):</span>
                <span className="font-bold text-[#16A34A]">
                  {Math.round((monthlyExtraRevenue / 39990))}x la inversión
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate?.('/login')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Comenzar prueba gratis 14 días</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-gray-400">
              * Cálculo basado en escenarios operativos reales. No constituye una garantía legal contractual.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
