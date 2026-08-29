import React, { useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

export const MatchmakingShowcase: React.FC = () => {
  const [matchStatus, setMatchStatus] = useState<'3_players' | '4_players'>('4_players');

  const confirmedPlayers = [
    { id: 1, name: 'Juan Ignacio Silva', level: '3.5', pos: 'Drive (Derecha)', color: '#7C3AED', dir: 'desde Las Condes' },
    { id: 2, name: 'Pedro Valenzuela', level: '3.0', pos: 'Revés', color: '#16A34A', dir: 'desde Vitacura' },
    { id: 3, name: 'Carlos Domínguez', level: '3.2', pos: 'Drive', color: '#F59E0B', dir: 'desde Lo Barnechea' },
  ];

  return (
    <section id="matchmaking" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-[#D9D9D2] overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#C7F000]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#7C3AED]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            Matchmaking Deportivo Inteligente
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            UNA CANCHA LIBRE. <br />
            CUATRO JUGADORES. <br />
            <span className="text-[#7C3AED]">UN PARTIDO.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            CanchaLlena no empareja al azar: encuentra jugadores con el nivel exacto, disponibilidad inmediata y afinidad de juego para garantizar partidos competitivos y recurrentes.
          </p>
        </div>

        {/* Main Matchmaking Showcase Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Animated Court Match Visualizer */}
          <div className="lg:col-span-7 bg-[#F7F7F4] rounded-3xl p-6 sm:p-8 border border-[#D9D9D2] shadow-sm relative">
            
            {/* Top Bar of Match card */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9D9D2] pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#7C3AED] uppercase">Partido #1042</span>
                <h3 className="font-extrabold text-lg text-[#101014]">Hoy · 15:00 · Cancha 02 Cristal</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#62626A]">Nivel Sugerido:</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#D9D9D2] text-xs font-extrabold text-[#101014]">
                  3.0 — 3.5
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                    matchStatus === '4_players'
                      ? 'bg-[#C7F000] text-[#101014]'
                      : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                  }`}
                >
                  {matchStatus === '4_players' ? '4 / 4 · PARTIDO LISTO' : '3 / 4 · BUSCANDO JUGADOR'}
                </span>
              </div>
            </div>

            {/* Padel Court Top-Down Tactical Board */}
            <div className="relative aspect-16/10 rounded-2xl bg-[#1E513B]/20 border-2 border-[#7C3AED]/30 overflow-hidden flex items-center justify-center p-6 shadow-inner">
              
              {/* Synthetic turf texture */}
              <div className="absolute inset-0 bg-[#2D6A4F]/15" />

              {/* White Court Lines */}
              <svg
                className="w-full h-full relative z-10"
                viewBox="0 0 500 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="15" y="15" width="470" height="270" stroke="#FFFFFF" strokeWidth="3" rx="2" />
                <line x1="135" y1="15" x2="135" y2="285" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="365" y1="15" x2="365" y2="285" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="135" y1="150" x2="365" y2="150" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="250" y1="10" x2="250" y2="290" stroke="#101014" strokeWidth="3.5" strokeDasharray="4 4" />
              </svg>

              {/* Central Ball */}
              <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <PadelBall size={24} glow />
              </div>

              {/* Four Players Positions arriving from different corners */}
              {/* Player 1 - Top Left */}
              <div className="absolute top-8 left-10 z-30 flex flex-col items-center animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-[#7C3AED] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  JS
                </div>
                <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#101014] shadow-2xs mt-1 text-center">
                  Juan · 3.5
                  <span className="block text-[8px] text-[#62626A]">{confirmedPlayers[0].pos}</span>
                </div>
              </div>

              {/* Player 2 - Bottom Left */}
              <div className="absolute bottom-8 left-10 z-30 flex flex-col items-center animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  PV
                </div>
                <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#101014] shadow-2xs mt-1 text-center">
                  Pedro · 3.0
                  <span className="block text-[8px] text-[#62626A]">{confirmedPlayers[1].pos}</span>
                </div>
              </div>

              {/* Player 3 - Top Right */}
              <div className="absolute top-8 right-10 z-30 flex flex-col items-center animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                  CD
                </div>
                <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#101014] shadow-2xs mt-1 text-center">
                  Carlos · 3.2
                  <span className="block text-[8px] text-[#62626A]">{confirmedPlayers[2].pos}</span>
                </div>
              </div>

              {/* Player 4 - Bottom Right (The Matchmaking Slot) */}
              <div className="absolute bottom-8 right-10 z-30 flex flex-col items-center transition-all duration-500">
                {matchStatus === '4_players' ? (
                  <div className="flex flex-col items-center animate-scaleUp">
                    <div className="w-10 h-10 rounded-full bg-[#3B82F6] text-white font-bold text-xs flex items-center justify-center border-2 border-[#C7F000] ring-4 ring-[#C7F000]/40 shadow-md">
                      AE
                    </div>
                    <div className="bg-[#C7F000] px-2 py-0.5 rounded-md text-[10px] font-extrabold text-[#101014] shadow-2xs mt-1 text-center flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Andrés · 3.2
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#7C3AED] bg-white/70 flex items-center justify-center text-xs font-bold text-[#7C3AED] animate-pulse">
                      +
                    </div>
                    <div className="bg-white/90 px-2 py-0.5 rounded-md text-[9px] font-bold text-[#7C3AED] shadow-2xs mt-1">
                      Buscando 4to...
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Interactive Toggle Button */}
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#62626A]">
              <span>Prueba cómo reacciona el sistema:</span>
              <button
                onClick={() => setMatchStatus(matchStatus === '4_players' ? '3_players' : '4_players')}
                className="font-bold text-xs px-3.5 py-1.5 rounded-xl bg-white border border-[#D9D9D2] hover:border-[#7C3AED] text-[#101014] transition-all shadow-2xs cursor-pointer"
              >
                {matchStatus === '4_players' ? 'Quitar 4to jugador' : '⚡ Asignar Andrés Edwards (94%)'}
              </button>
            </div>

          </div>

          {/* Right: Section 14 Match Score Compatibility Matrix */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#D9D9D2] shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-[#D9D9D2]/70 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#62626A] uppercase tracking-wider block">
                    Cálculo de Afinidad
                  </span>
                  <h4 className="text-xl font-extrabold text-[#101014]">
                    Compatibilidad: <span className="text-[#7C3AED]">94%</span>
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#C7F000] flex items-center justify-center text-[#101014] font-black text-sm shadow-xs">
                  94%
                </div>
              </div>

              {/* 4 Score Progress Bars */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#101014] mb-1">
                    <span>Nivel Deportivo (3.0 a 3.5)</span>
                    <span className="text-[#7C3AED]">96%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#101014] mb-1">
                    <span>Horario & Disponibilidad Hoy</span>
                    <span className="text-[#7C3AED]">98%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#101014] mb-1">
                    <span>Preferencia de Puesto (Revés/Drive)</span>
                    <span className="text-[#7C3AED]">90%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-[#101014] mb-1">
                    <span>Afinidad con Club Vitacura</span>
                    <span className="text-[#7C3AED]">92%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              {/* Commercial Clarity Note */}
              <div className="bg-[#F7F7F4] rounded-2xl p-4 border border-[#D9D9D2] text-xs text-[#62626A] space-y-1">
                <p className="font-bold text-[#101014]">
                  🎾 CanchaLlena encuentra jugadores que tienen sentido para ese partido.
                </p>
                <p>
                  Evite partidos desbalanceados (un primera contra un quinta) que aburren a los jugadores y no vuelven.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
