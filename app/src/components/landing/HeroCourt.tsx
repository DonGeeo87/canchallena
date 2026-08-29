import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

interface HeroCourtProps {
  onNavigate?: (route: string) => void;
}

export const HeroCourt: React.FC<HeroCourtProps> = ({ onNavigate }) => {
  const [courtStep, setCourtStep] = useState<0 | 1 | 2 | 3>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isIsometric, setIsIsometric] = useState(true);

  // Auto-advance narrative cycle: Cancha Vacía -> Detectando -> 3 Jugadores -> Match 4/4 Cancha Llena
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCourtStep((prev) => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const stepLabels = [
    { state: 'CANCHA LIBRE', sub: 'Horario valle 15:00 disponible', badgeBg: 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30', dot: '#16A34A' },
    { state: 'DETECTANDO JUGADORES', sub: 'Escaneando compatibilidad y WhatsApp...', badgeBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30', dot: '#F59E0B' },
    { state: '3 JUGADORES ENCONTRADOS', sub: 'Nivel 3.0 - 3.5 en línea', badgeBg: 'bg-[#7C3AED]/15 text-[#7C3AED] border-[#7C3AED]/30', dot: '#7C3AED' },
    { state: 'MATCH CREADO 4/4', sub: '¡Cancha 100% llena sin intervención!', badgeBg: 'bg-[#C7F000] text-[#101014] border-[#101014]/20', dot: '#101014' },
  ];

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-court-subtle">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#7C3AED]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-[#C7F000]/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Top Tagline */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#D9D9D2] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#C7F000] animate-ping" />
              <span className="text-xs font-bold text-[#101014] tracking-wide uppercase">
                SaaS Inteligente para Clubes de Pádel
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#101014] tracking-tight leading-[1.08]">
              SU CANCHA DISPONIBLE <br />
              <span className="text-[#7C3AED]">NO VUELVE A QUEDARSE</span> <br />
              <span className="relative inline-block">
                VACÍA.
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#C7F000]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,15 Q50,0 100,15" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-[#62626A] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              CanchaLlena automatiza las reservas y encuentra jugadores compatibles para llenar sus partidos y horarios valle, <strong className="text-[#101014] font-semibold">directamente desde WhatsApp</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                id="hero-cta-primary"
                onClick={() => onNavigate?.('/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <span>Probar gratis 14 días</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <a
                href="#como-funciona"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F7F4] text-[#101014] border border-[#D9D9D2] font-semibold text-base transition-colors shadow-2xs"
              >
                <span>Ver cómo funciona</span>
                <ChevronDown className="w-4 h-4 text-[#62626A]" />
              </a>
            </div>

            {/* Social Proof / Guarantee stats */}
            <div className="pt-6 border-t border-[#D9D9D2]/70 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-2xl font-extrabold text-[#101014] flex items-center">
                  +38%
                  <span className="text-[#16A34A] text-xs ml-1 font-bold">▲</span>
                </div>
                <div className="text-xs text-[#62626A] font-medium">Ocupación en horas valle</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#7C3AED]">0</div>
                <div className="text-xs text-[#62626A] font-medium">Apps nuevas para jugadores</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#101014]">100%</div>
                <div className="text-xs text-[#62626A] font-medium">Vía WhatsApp oficial</div>
              </div>
            </div>
          </div>

          {/* Right Cinematic Court Composition */}
          <div className="lg:col-span-6 relative">
            {/* Perspective View Toggle Controls */}
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#101014] uppercase tracking-wider">
                  Simulación en tiempo real
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              </div>
              
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#D9D9D2] shadow-2xs">
                <button
                  onClick={() => setIsIsometric(false)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                    !isIsometric ? 'bg-[#7C3AED] text-white' : 'text-[#62626A] hover:text-[#101014]'
                  }`}
                >
                  Vista Cenital (2D)
                </button>
                <button
                  onClick={() => setIsIsometric(true)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                    isIsometric ? 'bg-[#7C3AED] text-white' : 'text-[#62626A] hover:text-[#101014]'
                  }`}
                >
                  Perspectiva 3D
                </button>
              </div>
            </div>

            {/* Main Court Container */}
            <div
              className={`relative bg-[#FFFFFF] rounded-2xl p-4 sm:p-6 border border-[#D9D9D2] shadow-xl transition-transform duration-700 ease-out ${
                isIsometric ? 'transform perspective-1000 rotateX-12' : ''
              }`}
              style={{
                transform: isIsometric
                  ? 'perspective(1200px) rotateX(16deg) rotateZ(-2deg)'
                  : 'none',
              }}
            >
              {/* Top Court Header Bar */}
              <div className="flex items-center justify-between border-b border-[#D9D9D2]/80 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#7C3AED]" />
                  <span className="font-bold text-sm text-[#101014]">Cancha 02 — Cristal Pro</span>
                  <span className="text-xs text-[#62626A]">Hoy · 15:00</span>
                </div>

                {/* State Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${
                    stepLabels[courtStep].badgeBg
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stepLabels[courtStep].dot }}
                  />
                  {stepLabels[courtStep].state}
                </div>
              </div>

              {/* Padel Court Graphic Canvas/SVG */}
              <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden bg-[#2D6A4F]/10 border-2 border-[#7C3AED]/40 shadow-inner flex items-center justify-center p-4">
                
                {/* Court Synthetic Grass Base */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E513B]/20 via-[#2D6A4F]/15 to-[#1E513B]/20" />
                
                {/* Court Lines SVG */}
                <svg
                  className="w-full h-full relative z-10"
                  viewBox="0 0 600 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer boundary */}
                  <rect x="20" y="20" width="560" height="320" stroke="#FFFFFF" strokeWidth="3.5" rx="4" />
                  
                  {/* Service boxes */}
                  <line x1="160" y1="20" x2="160" y2="340" stroke="#FFFFFF" strokeWidth="2.5" />
                  <line x1="440" y1="20" x2="440" y2="340" stroke="#FFFFFF" strokeWidth="2.5" />
                  
                  {/* Center line */}
                  <line x1="160" y1="180" x2="440" y2="180" stroke="#FFFFFF" strokeWidth="2.5" />
                  
                  {/* Central Net */}
                  <line x1="300" y1="10" x2="300" y2="350" stroke="#101014" strokeWidth="4" strokeDasharray="5 5" />
                  
                  {/* Glass Wall Edges */}
                  <line x1="20" y1="20" x2="20" y2="340" stroke="#C7F000" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                  <line x1="580" y1="20" x2="580" y2="340" stroke="#C7F000" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                </svg>

                {/* Animated Ball Rally Simulation */}
                <div
                  className="absolute z-20 transition-all duration-700 ease-out"
                  style={{
                    top: courtStep === 0 ? '50%' : courtStep === 1 ? '35%' : courtStep === 2 ? '65%' : '48%',
                    left: courtStep === 0 ? '50%' : courtStep === 1 ? '68%' : courtStep === 2 ? '30%' : '52%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <PadelBall size={26} glow animated />
                </div>

                {/* Court Players Layer based on step */}
                {/* Player 1 (Top Left) */}
                <div
                  className={`absolute z-30 transition-all duration-500 flex flex-col items-center ${
                    courtStep >= 2 ? 'opacity-100 scale-100 top-12 left-16' : 'opacity-0 scale-50 top-4 left-4'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                    JS
                  </div>
                  <span className="text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1 text-[#101014]">
                    Juan · 3.5
                  </span>
                </div>

                {/* Player 2 (Bottom Left) */}
                <div
                  className={`absolute z-30 transition-all duration-500 flex flex-col items-center ${
                    courtStep >= 2 ? 'opacity-100 scale-100 bottom-12 left-16' : 'opacity-0 scale-50 bottom-4 left-4'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                    PV
                  </div>
                  <span className="text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1 text-[#101014]">
                    Pedro · 3.0
                  </span>
                </div>

                {/* Player 3 (Top Right) */}
                <div
                  className={`absolute z-30 transition-all duration-500 flex flex-col items-center ${
                    courtStep >= 2 ? 'opacity-100 scale-100 top-12 right-16' : 'opacity-0 scale-50 top-4 right-4'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                    CD
                  </div>
                  <span className="text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1 text-[#101014]">
                    Carlos · 3.2
                  </span>
                </div>

                {/* Player 4 (Bottom Right) - The Missing Player filled by Matchmaking! */}
                <div
                  className={`absolute z-30 transition-all duration-500 flex flex-col items-center ${
                    courtStep === 3
                      ? 'opacity-100 scale-100 bottom-12 right-16'
                      : 'opacity-80 scale-95 bottom-12 right-16'
                  }`}
                >
                  {courtStep === 3 ? (
                    <>
                      <div className="w-9 h-9 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-[#C7F000] ring-4 ring-[#C7F000]/40 animate-bounce">
                        AE
                      </div>
                      <span className="text-[10px] font-extrabold bg-[#C7F000] px-2 py-0.5 rounded shadow-xs mt-1 text-[#101014] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Andrés · 3.2
                      </span>
                    </>
                  ) : (
                    <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#101014]/40 bg-white/60 flex items-center justify-center text-xs font-bold text-[#62626A]">
                      ?
                    </div>
                  )}
                </div>

                {/* Floating WhatsApp Live Toast */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 bg-[#FFFFFF]/95 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#D9D9D2] shadow-md flex items-center gap-2.5 max-w-[90%]">
                  <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-[#101014] truncate">
                      {courtStep === 0 && 'WhatsApp: "Cancha 2 disponible a las 15:00."'}
                      {courtStep === 1 && 'WhatsApp: "Invitando jugadores nivel 3.0-3.5..."'}
                      {courtStep === 2 && 'WhatsApp: "Juan, Pedro y Carlos listos. Falta 1..."'}
                      {courtStep === 3 && 'WhatsApp: "✅ Andrés confirmó. ¡Partido listo 4/4!"'}
                    </p>
                    <span className="text-[10px] text-[#62626A]">Automatizado por CanchaLlena</span>
                  </div>
                </div>
              </div>

              {/* Narrative Step Progress Bar */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[#D9D9D2]/70">
                {[0, 1, 2, 3].map((stepIdx) => (
                  <button
                    key={stepIdx}
                    onClick={() => {
                      setCourtStep(stepIdx as 0 | 1 | 2 | 3);
                      setIsPlaying(false);
                    }}
                    className={`text-left p-2 rounded-lg transition-all ${
                      courtStep === stepIdx
                        ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/30'
                        : 'hover:bg-black/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#62626A]">0{stepIdx + 1}</span>
                      {courtStep === stepIdx && <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                    </div>
                    <div className="text-xs font-extrabold text-[#101014] truncate mt-0.5">
                      {stepIdx === 0 && 'Vacía'}
                      {stepIdx === 1 && 'Buscando'}
                      {stepIdx === 2 && '3 Jugadores'}
                      {stepIdx === 3 && 'Partido 4/4'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
