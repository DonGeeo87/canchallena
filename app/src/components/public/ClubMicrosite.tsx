import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  MessageSquare,
  CheckCircle2,
  Trophy,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { PadelBall } from '../common/PadelBall';
import { api } from '../../services/api';
import { Court, OpenMatch } from '../../types';

interface ClubMicrositeProps {
  slug?: string;
  onNavigateHome: () => void;
  onOpenAuth: () => void;
}

export const ClubMicrosite: React.FC<ClubMicrositeProps> = ({
  slug = 'padel-club-vitacura',
  onNavigateHome,
  onOpenAuth,
}) => {
  const [clubData, setClubData] = useState<any>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<OpenMatch[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const cData = await api.public.getClub(slug);
        setClubData(cData);
        // El endpoint público devuelve canchas (con cupos libres) y el club.
        // Las llamadas a courts/matchmaking req. auth no aplican en contexto público.
        setCourts((cData as any)._courts || []);
        setMatches([]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClub();
  }, [slug]);

  const handleBookViaWhatsApp = (courtName: string, time: string, price: number) => {
    const msg = `¡Hola! Quiero reservar en ${clubData?.name || 'Pádel Club Vitacura'}: ${courtName} para hoy a las ${time} ($${price.toLocaleString('es-CL')}).`;
    const encoded = encodeURIComponent(msg);
    // WhatsApp direct link simulation
    window.open(`https://wa.me/56987654321?text=${encoded}`, '_blank');
    setSuccessToast(`Abriendo WhatsApp para confirmar ${courtName} a las ${time}...`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleJoinMatch = (matchId: string) => {
    setSuccessToast(`¡Te sumaste al partido #${matchId}! Te enviamos los detalles a WhatsApp.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#101014] flex flex-col">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#101014] text-white px-4 py-3 rounded-2xl border border-[#C7F000] shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <PadelBall size={16} glow />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-[#D9D9D2] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-bold text-[#62626A] hover:text-[#101014] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver a CanchaLlena</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold text-[#7C3AED] hover:underline"
            >
              ¿Eres el dueño del club? Acceder
            </button>
          </div>
        </div>
      </header>

      {/* Main Club Hero Header */}
      <div className="bg-white border-b border-[#D9D9D2] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#7C3AED] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
                <PadelBall size={36} glow />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[10px] font-black uppercase">
                    Club Verificado CanchaLlena
                  </span>
                  <span className="text-xs text-[#62626A] font-medium">3 Canchas Pro</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101014] tracking-tight">
                  {clubData?.name || 'Pádel Club Vitacura'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#62626A]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
                    Av. Vitacura 7800, Vitacura, Santiago
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                    Lunes a Domingo · 08:00 - 23:30
                  </span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBookViaWhatsApp('Cancha 01', '19:30', 18000)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Reservar por WhatsApp Directo</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        
        {/* Section 1: Disponibilidad Hoy en Vivo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#101014]">
                Disponibilidad Hoy en Canchas
              </h2>
              <p className="text-xs text-[#62626A]">
                Selecciona tu horario preferido y confirma directamente en WhatsApp en 2 segundos
              </p>
            </div>
            <span className="text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" /> En Vivo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div
                key={court.id}
                className="bg-white rounded-3xl p-6 border border-[#D9D9D2] shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#D9D9D2] pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#101014]">{court.name}</h3>
                    <span className="text-xs text-[#62626A]">{court.surface} · {court.type}</span>
                  </div>
                  <span className="text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2.5 py-1 rounded-lg">
                    ${court.pricePeak.toLocaleString('es-CL')}
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-2">
                  {court.slots.map((slot) => {
                    const isFree = slot.status === 'free';
                    return (
                      <div
                        key={slot.time}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isFree
                            ? 'bg-[#F7F7F4] hover:bg-[#C7F000]/20 border-[#D9D9D2] cursor-pointer'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                        onClick={() => {
                          if (isFree) {
                            handleBookViaWhatsApp(court.name, slot.time, slot.price || court.pricePeak);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#101014]">{slot.time}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isFree ? 'bg-[#16A34A]' : 'bg-[#7C3AED]'
                            }`}
                          />
                          <span className="text-xs font-semibold text-[#101014]">
                            {isFree ? 'Disponible' : 'Ocupada'}
                          </span>
                        </div>

                        {isFree ? (
                          <span className="text-xs font-extrabold text-[#7C3AED] flex items-center gap-1">
                            <span>Reservar</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">No disponible</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Partidos Abiertos 4/4 del Club */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#101014] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#7C3AED]" />
              Partidos Abiertos con Cupos Disponibles
            </h2>
            <p className="text-xs text-[#62626A]">
              ¿Te falta pareja o quieres jugar hoy sin coordinar 4 personas? Súmate a un partido de tu nivel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-3xl p-6 border border-[#D9D9D2] shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#D9D9D2] pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#101014]">
                      {match.courtName} · {match.time} hrs
                    </h3>
                    <span className="text-xs text-[#7C3AED] font-bold">Nivel: {match.targetLevel}</span>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#C7F000] text-[#101014]">
                    {match.players.length}/4 JUGADORES
                  </span>
                </div>

                {/* Player avatars */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {match.players.map((p) => (
                    <div key={p.id} className="bg-[#F7F7F4] p-2 rounded-xl border border-[#D9D9D2] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[10px]">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#101014] truncate">{p.name}</span>
                    </div>
                  ))}

                  {match.players.length < 4 && (
                    <div className="bg-[#7C3AED]/10 p-2 rounded-xl border border-dashed border-[#7C3AED] flex items-center justify-center text-xs font-bold text-[#7C3AED]">
                      + Cupo Disponible
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-[#101014]">
                    ${match.pricePerPlayer.toLocaleString('es-CL')} / jugador
                  </span>

                  <button
                    onClick={() => handleJoinMatch(match.id)}
                    className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold transition-all shadow-xs"
                  >
                    Sumarme a este Partido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Club Amenities */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D9D2] shadow-2xs space-y-4">
          <h3 className="text-lg font-extrabold text-[#101014]">Servicios e Instalaciones del Club</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-[#101014]">
            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#D9D9D2] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>3 Canchas Cristal Panorámicas</span>
            </div>
            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#D9D9D2] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Estacionamiento Privado</span>
            </div>
            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#D9D9D2] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Pro Shop & Test de Palas</span>
            </div>
            <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#D9D9D2] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Café & Tercer Tiempo Lounge</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#D9D9D2] py-6 text-center text-xs text-[#62626A]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Pádel Club Vitacura. Impulsado por CanchaLlena SaaS.</p>
          <button
            onClick={onNavigateHome}
            className="text-[#7C3AED] font-bold hover:underline"
          >
            Conoce CanchaLlena para tu club →
          </button>
        </div>
      </footer>

    </div>
  );
};
