import React from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PricingSectionProps {
  onNavigate?: (route: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onNavigate }) => {
  const plans = [
    {
      id: 'starter',
      name: 'STARTER',
      tagline: 'Ideal para clubes pequeños o 1-2 canchas',
      price: '$19.990',
      period: '/ mes',
      popular: false,
      features: [
        'Hasta 2 canchas',
        'Bot de Reservas por WhatsApp',
        'Panel de control básico',
        'Gestión de horarios y precios',
        'Soporte por email y chat',
      ],
      ctaText: 'Comenzar con Starter',
    },
    {
      id: 'club',
      name: 'CLUB',
      tagline: 'El favorito de los clubes en crecimiento',
      price: '$39.990',
      period: '/ mes',
      popular: true,
      badge: 'MÁS POPULAR',
      features: [
        'Hasta 6 canchas',
        'Bot de Reservas por WhatsApp',
        'Matchmaking Automático 4/4',
        'Jugadores ilimitados en la base',
        'Panel completo en tiempo real',
        'Monetización de Horarios Valle',
        'Micrositio público digital del club',
        'Soporte prioritario por WhatsApp',
      ],
      ctaText: 'Probar Plan Club Gratis',
    },
    {
      id: 'pro',
      name: 'PRO',
      tagline: 'Para cadenas y clubes con alta demanda',
      price: '$69.990',
      period: '/ mes',
      popular: false,
      features: [
        'Múltiples sedes y canchas ilimitadas',
        'Todo lo del Plan Club',
        'Analítica y reportes de rentabilidad',
        'Automatizaciones de marketing avanzadas',
        'Prioridad absoluta en matchmaking',
        'Ejecutivo de cuenta dedicado',
        'Integración personalizada',
      ],
      ctaText: 'Contactar para Plan Pro',
    },
  ];

  return (
    <section id="precios" className="py-20 md:py-28 bg-[#F7F7F4] relative border-b border-[#D9D9D2] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Planes Transparentes
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            PRECIOS SIMPLES. <br />
            <span className="text-[#7C3AED]">SIN COMISIÓN POR RESERVA.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            Usted se queda con el 100% de lo que cobran sus canchas. Solo paga una suscripción fija mensual en pesos chilenos.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                plan.popular
                  ? 'bg-[#FFFFFF] border-2 border-[#7C3AED] shadow-xl lg:-translate-y-2'
                  : 'bg-[#FFFFFF] border border-[#D9D9D2] hover:border-[#7C3AED]/60 shadow-sm'
              }`}
            >
              {/* Most popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#7C3AED] text-white text-[11px] font-black tracking-wider uppercase px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C7F000]" />
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#101014] tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-[#62626A] mt-1">{plan.tagline}</p>
                </div>

                <div className="flex items-baseline gap-1 border-b border-[#D9D9D2]/70 pb-6">
                  <span className="text-4xl sm:text-5xl font-black text-[#101014] tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold text-[#62626A]">{plan.period}</span>
                </div>

                {/* Features list */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#101014] block">
                    Incluye:
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#101014]">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom CTA & Note */}
              <div className="pt-8 mt-6 border-t border-[#D9D9D2]/60 space-y-3">
                <button
                  onClick={() => onNavigate?.('/login')}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md'
                      : 'bg-[#F7F7F4] hover:bg-[#101014] text-[#101014] hover:text-white border border-[#D9D9D2]'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reassurance Banner */}
        <div className="mt-12 text-center text-xs text-[#62626A] flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-[#101014]">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            14 días de prueba gratis
          </span>
          <span className="text-[#D9D9D2]">•</span>
          <span className="font-semibold text-[#101014]">Sin contratos forzosos</span>
          <span className="text-[#D9D9D2]">•</span>
          <span className="font-semibold text-[#101014]">0% comisión por reserva</span>
        </div>

      </div>
    </section>
  );
};
