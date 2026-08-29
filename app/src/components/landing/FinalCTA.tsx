import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

interface FinalCTAProps {
  onNavigate?: (route: string) => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onNavigate }) => {
  return (
    <section className="py-20 md:py-28 bg-[#F7F7F4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Full-Width Stylized Padel Court Container */}
        <div className="relative rounded-3xl sm:rounded-[36px] bg-[#101014] text-white p-8 sm:p-14 lg:p-20 overflow-hidden border border-[#D9D9D2] shadow-2xl">
          
          {/* Synthetic turf & court lines background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A3A2A]/40 via-[#101014] to-[#7C3AED]/25 pointer-events-none" />
          
          {/* Subtle court lines watermark */}
          <svg
            className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
            fill="none"
          >
            <rect x="50" y="30" width="900" height="440" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="300" y1="30" x2="300" y2="470" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="700" y1="30" x2="700" y2="470" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="300" y1="250" x2="700" y2="250" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="500" y1="20" x2="500" y2="480" stroke="#C7F000" strokeWidth="3" strokeDasharray="6 6" />
          </svg>

          {/* Ball Finishing Trajectory */}
          <div className="absolute top-8 right-10 sm:top-12 sm:right-16 z-20">
            <PadelBall size={36} glow animated />
          </div>

          <div className="relative z-10 max-w-3xl space-y-6 text-center sm:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C7F000] text-[#101014] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Transforme su Club Hoy
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
              LLENE SUS CANCHAS. <br />
              <span className="text-[#C7F000]">NO SU TELÉFONO.</span>
            </h2>

            <p className="text-base sm:text-xl text-[#D9D9D2] font-light max-w-xl">
              Empiece a automatizar reservas, horarios valle y partidos 4/4 en su club en menos de 10 minutos.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button
                id="final-cta-btn"
                onClick={() => onNavigate?.('/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-base shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <span>Probar CanchaLlena Gratis</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => onNavigate?.('/club/padel-club-vitacura')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                <span>Ver Micrositio Público Demo</span>
              </button>
            </div>

            {/* Guarantees */}
            <div className="pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#D9D9D2]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C7F000]" />
                Prueba 14 días sin costo
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C7F000]" />
                Sin tarjeta de crédito requerida
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C7F000]" />
                Configuración guiada en Chile
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
