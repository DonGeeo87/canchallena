import React from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface PricingSectionProps {
  onNavigate?: (route: string) => void;
  onComprar?: (plan: string, nombre: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onNavigate, onComprar }) => {
  const plans = [
    {
      id: 'club',
      name: 'CLUB',
      tagline: 'Para clubes con hasta 6 canchas',
      price: '$39.990',
      period: '/ mes',
      popular: true,
      badge: 'MÁS POPULAR',
      features: [
        'Hasta 6 canchas',
        'Asistente de reservas por WhatsApp',
        'Matchmaking 4/4 por nivel (3ª a 6ª)',
        'Duplas automáticas con invitación y espera',
        'Coach de progreso personalizado por socio',
        'Reconocimiento de socios por WhatsApp',
        'Cancelación con reemplazo inmediato',
        'Jugadores ilimitados en la base',
        'Panel del club completo',
      ],
      ctaText: 'Probar Plan Club',
    },
    {
      id: 'pro',
      name: 'PRO',
      tagline: 'Para clubes grandes, cadenas y quienes quieren su propia marca',
      price: '$69.990',
      period: '/ mes',
      popular: false,
      badge: 'PARA CRECER',
      features: [
        'Canchas ilimitadas y múltiples sedes',
        'Todo lo del Plan Club',
        'Número de WhatsApp propio (chip dedicado a pedido)',
        'Setup de chip dedicado + activación asistida',
        'Recordatorios automáticos de partidos',
        'Resumen y métricas del club en el panel',
        'Llenado de horas valle prioritario (multi-nivel)',
        'Coach de jugadores con planes de progreso avanzados',
        'Reportes de retención y actividad de socios',
        'Soporte prioritario por WhatsApp',
        'Onboarding acompañado por nuestro equipo',
      ],
      ctaText: 'Cotizar Plan Pro',
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

        {/* 2 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
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
                  onClick={() => onComprar?.(plan.id, plan.name)}
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

        {/* Founder Access Banner */}
        <div className="mt-12 max-w-4xl mx-auto bg-[#101014] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-xs text-[#C7F000] font-black uppercase tracking-wider inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Acceso Fundadores — 50% OFF
            </span>
            <p className="text-sm text-[#F7F7F4] max-w-lg">
              Primeros clubes en unirse con <strong className="text-[#C7F000]">50% de descuento durante 1 mes</strong> en el plan Club o Pro. Cupos limitados.
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('/login')}
            className="shrink-0 inline-flex items-center gap-2 bg-[#C7F000] hover:bg-[#B6DE00] text-[#101014] font-black text-sm px-6 py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Reclamar 50% OFF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Chip dedicado note — a pedido, setup único cubre el primer mes y desde el segundo se paga la mensualidad Pro */}
        <div className="mt-8 max-w-4xl mx-auto bg-[#FFFFFF] border border-[#7C3AED]/30 rounded-2xl p-5 text-sm text-[#62626A]">
          <p className="font-bold text-[#7C3AED] mb-1">Número de WhatsApp propio (chip dedicado) — a pedido, solo en Pro</p>
          <p className="text-xs leading-relaxed">
            Su propio número de WhatsApp con la marca de su club, sin compartir sesión con otros clubes. Incluido en el Plan Pro. <strong className="text-[#101014]">El primer mes se paga solo el setup de activación</strong> (entrega del chip, pareo y configuración del asistente) y <strong className="text-[#101014]">desde el segundo mes la mensualidad del Pro</strong>. Contáctenos para su cotización del setup.
          </p>
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
