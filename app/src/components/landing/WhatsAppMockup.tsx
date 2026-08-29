import React, { useState } from 'react';
import { CheckCheck, Send, Zap, ShieldCheck } from 'lucide-react';
import { PadelBall } from '../common/PadelBall';

export const WhatsAppMockup: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{ id: number; sender: 'player' | 'bot'; text: string; time: string; options?: string[] }>
  >([
    { id: 1, sender: 'player', text: 'Hola! ¿Tienen cancha disponible hoy en la tarde?', time: '16:04' },
    {
      id: 2,
      sender: 'bot',
      text: '🎾 ¡Hola Ignacio! Sí, tenemos las siguientes tandas para hoy en Pádel Club Vitacura:',
      time: '16:04',
      options: ['18:00 · Cancha 02 (Cristal)', '19:30 · Cancha 01 (Panorámica)', '21:00 · Cancha 03 (Outdoor)'],
    },
    { id: 3, sender: 'player', text: 'La de las 19:30 en Cancha 1 por favor!', time: '16:05' },
    {
      id: 4,
      sender: 'bot',
      text: '✅ ¡Reserva confirmada con éxito!\n\n📍 Cancha 01 (Panorámica Central)\n⏰ Hoy · 19:30 - 21:00\n💰 $18.000\n\n¿Quieres que invite a jugadores de tu grupo habitual (Juan, Pedro, Carlos) automáticamente?',
      time: '16:05',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const simulatePlayerChoice = (choiceText: string) => {
    if (isTyping) return;

    // Add player message
    const playerMsg = {
      id: Date.now(),
      sender: 'player' as const,
      text: choiceText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, playerMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let botReply = '';
      if (choiceText.includes('invitar')) {
        botReply = '🎾 ¡Listo! Enviamos la convocatoria por WhatsApp a Juan, Pedro y Carlos. En cuanto confirmen, el partido queda 4/4 en tu panel.';
      } else if (choiceText.includes('partido abierto')) {
        botReply = '🎾 Buscando 1 jugador nivel 3.5 para completar tu partido. Encontramos a Andrés Edwards (94% compatibilidad). ¿Lo confirmamos?';
      } else {
        botReply = '🎾 ¡Perfecto! Tu cancha y luces están reservadas automáticamente. ¡Nos vemos en la cancha!';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  return (
    <section id="whatsapp-bot" className="py-20 md:py-28 bg-[#F7F7F4] relative border-b border-[#D9D9D2] overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#7C3AED]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Automatización 24/7
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101014] tracking-tight">
            CANCHALLENA TRABAJA <br />
            <span className="text-[#7C3AED]">MIENTRAS USTED TRABAJA.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#62626A]">
            Sus jugadores escriben al WhatsApp de su club de toda la vida. CanchaLlena responde de inmediato, verifica disponibilidad y cierra la reserva en segundos.
          </p>
        </div>

        {/* WhatsApp Phone Mockup Experience */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Explanatory Highlights */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#101014] font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                Sin descargas ni registros pesados
              </div>
              <p className="text-xs text-[#62626A] leading-relaxed">
                El 98% de los jugadores en Chile ya usan WhatsApp. No obligue a sus clientes a bajar otra app que van a borrar.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#101014] font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                Sincronización instantánea con el Panel
              </div>
              <p className="text-xs text-[#62626A] leading-relaxed">
                Cada reserva tomada por el bot bloquea el slot inmediatamente en la grilla del club, evitando sobreventas o errores humanos.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 text-[#101014] font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C7F000]" />
                Interactúa con la demo:
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => simulatePlayerChoice('Sí, invitar al grupo habitual')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all"
                >
                  "Invitar grupo habitual"
                </button>
                <button
                  onClick={() => simulatePlayerChoice('¿Tienen un partido abierto de nivel 3.5?')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-[#D9D9D2] text-[#101014] hover:bg-[#F7F7F4] transition-all"
                >
                  "Buscar partido abierto"
                </button>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup Container */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative mx-auto max-w-sm sm:max-w-md bg-[#101014] rounded-[40px] p-3 shadow-2xl border-4 border-[#2D2D34]">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#101014] rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#222] mr-2" />
                <div className="w-8 h-1 bg-[#333] rounded-full" />
              </div>

              {/* Phone Screen */}
              <div className="relative rounded-[32px] overflow-hidden bg-[#EFEAE2] flex flex-col h-[520px]">
                
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075E54] text-white px-4 py-3.5 flex items-center justify-between shadow-xs z-20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#075E54] font-bold text-xs border border-white">
                        <PadelBall size={18} glow={false} />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                        Pádel Club Vitacura
                        <span className="text-[10px] bg-[#25D366]/20 text-[#25D366] px-1 rounded font-normal">BOT</span>
                      </h4>
                      <p className="text-[10px] text-white/80">en línea · CanchaLlena AI</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#25D366]" />
                </div>

                {/* WhatsApp Chat Body Messages */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-[radial-gradient(#d3cbbf_1px,transparent_1px)] [background-size:16px_16px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'player' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-2xs text-xs leading-relaxed relative ${
                          msg.sender === 'player'
                            ? 'bg-[#D9FDD3] text-[#111B21] rounded-tr-xs'
                            : 'bg-[#FFFFFF] text-[#111B21] rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {msg.options && (
                          <div className="mt-2.5 space-y-1.5 border-t border-black/5 pt-2">
                            {msg.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="bg-[#F0F2F5] hover:bg-[#E2E8F0] p-1.5 rounded-lg font-semibold text-[11px] text-[#7C3AED] flex items-center justify-between"
                              >
                                <span>{opt}</span>
                                <span className="text-[10px] text-[#16A34A] font-bold">Disponible</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-gray-500">
                          <span>{msg.time}</span>
                          {msg.sender === 'player' && <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start">
                      <div className="bg-[#FFFFFF] rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="text-[11px]">CanchaLlena escribiendo</span>
                        <span className="inline-flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce [animation-delay:0.4s]" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Chat Input Bar */}
                <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2 border-t border-[#D9D9D2]/60">
                  <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 text-xs text-gray-400 border border-gray-200 truncate">
                    Escribe un mensaje o elige una opción...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center text-white cursor-pointer shadow-xs">
                    <Send className="w-4 h-4 ml-0.5" />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
