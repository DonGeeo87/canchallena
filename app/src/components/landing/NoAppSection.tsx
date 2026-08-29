import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

export const NoAppSection: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-[#101014] text-white relative border-b border-[#2D2D34] overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C7F000]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Giant "WhatsApp" Word */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C7F000] text-[#101014] text-xs font-black uppercase tracking-wider">
              Cero Resistencia de Adopción
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              SUS JUGADORES NO TIENEN <br />
              <span className="text-[#C7F000]">QUE APRENDER NADA NUEVO.</span>
            </h2>

            <div className="py-2">
              <span className="text-5xl sm:text-7xl font-black tracking-tighter text-white bg-clip-text flex items-center justify-center lg:justify-start gap-4">
                WhatsApp<span className="text-[#25D366]">.</span>
              </span>
            </div>

            <div className="space-y-3 text-lg sm:text-xl text-[#D9D9D2] font-light max-w-xl mx-auto lg:mx-0">
              <p className="font-normal">
                <strong className="text-white font-bold">Ellos escriben.</strong> CanchaLlena responde en milisegundos.
              </p>
              <p className="text-sm text-gray-400">
                Olvídese de obligar a jugadores de 45 años a recordar contraseñas, validar emails o ingresar tarjetas en apps desconocidas.
              </p>
            </div>

            {/* Comparison Pill Matrix */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 text-left text-xs">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <X className="w-4 h-4" />
                  Otras Apps del Mercado
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Descargar app pesada, crear cuenta, ingresar tarjeta, jugador la borra a los 3 días.
                </p>
              </div>

              <div className="bg-[#7C3AED]/20 border border-[#7C3AED] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#C7F000] font-bold">
                  <Check className="w-4 h-4" />
                  CanchaLlena
                </div>
                <p className="text-gray-200 leading-relaxed">
                  Directo en WhatsApp. Conversacional, natural, 100% amigable para cualquier edad.
                </p>
              </div>
            </div>
          </div>

          {/* Right Phone with Conversational Flow */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-xs">
                    💬
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Canal WhatsApp Oficial</h4>
                    <p className="text-[10px] text-[#C7F000]">Conectado a CanchaLlena Engine</p>
                  </div>
                </div>
                <PadelBall size={20} glow />
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-xs">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Jugador habitual:</span>
                  <p className="text-white font-medium">"Rodri, reserva para 4 mañana a las 20:00"</p>
                </div>

                <div className="bg-[#7C3AED]/30 border border-[#7C3AED]/50 p-3.5 rounded-2xl rounded-tr-xs ml-4">
                  <span className="text-[10px] text-[#C7F000] font-bold block mb-0.5">CanchaLlena:</span>
                  <p className="text-white font-semibold">
                    "✅ ¡Listo! Cancha 01 agendada para mañana 20:00. Link de confirmación enviado a tu WhatsApp."
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3 text-xs text-gray-300">
                <ShieldCheck className="w-5 h-5 text-[#C7F000] shrink-0" />
                <span>Usted mantiene el control total de su base de datos de jugadores.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
