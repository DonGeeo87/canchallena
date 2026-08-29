import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  Settings,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  Zap,
  TrendingUp,
  LogOut,
  X
} from 'lucide-react';
import { PadelBall } from '../common/PadelBall';
import { api } from '../../services/api';
import { User, Court, Player, OpenMatch } from '../../types';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'grid' | 'matchmaking' | 'players' | 'settings'>('overview');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<OpenMatch[]>([]);
  
  // Quick Action Modal states
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [botActive, setBotActive] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // New Match Form State
  const [newMatchCourtId, setNewMatchCourtId] = useState('c2');
  const [newMatchTime, setNewMatchTime] = useState('15:00');
  const [newMatchTargetLevel, setNewMatchTargetLevel] = useState('3.0 - 3.5');

  // Load Dashboard Data
  const loadData = async () => {
    try {
      const [todayRes, courtsRes, playersRes, matchesRes] = await Promise.all([
        api.admin.getTodaySummary(),
        api.courts.getAll(),
        api.players.getAll(),
        api.matchmaking.getOpenMatches(),
      ]);
      setSummaryData(todayRes);
      setCourts(courtsRes);
      setPlayers(playersRes);
      setMatches(matchesRes);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Toggle Court Slot status
  const handleToggleSlot = async (courtId: string, slotTime: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'free' ? 'reserved' : currentStatus === 'reserved' ? 'open_match' : 'free';
    try {
      await api.courts.updateSlotStatus(courtId, slotTime, nextStatus as any);
      triggerNotification(`Horario ${slotTime} actualizado a ${nextStatus.toUpperCase()}`);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Autocomplete 4th player in Open Match
  const handleAutocompleteMatch = async (matchId: string) => {
    try {
      await api.matchmaking.autocompleteMatch(matchId);
      triggerNotification('⚡ ¡4to jugador asignado vía Matchmaking! Partido 4/4 completo.');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Create new Open Match
  const handleCreateOpenMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.matchmaking.createOpenMatch({
        courtId: newMatchCourtId,
        courtName: courts.find((c) => c.id === newMatchCourtId)?.name || 'Cancha',
        time: newMatchTime,
        date: 'Hoy',
        targetLevel: newMatchTargetLevel,
        pricePerPlayer: 4500,
        organizerPlayerId: players[0]?.id || 'p1',
      });
      setShowNewMatchModal(false);
      triggerNotification('✅ Partido Abierto creado y convocatoria enviada por WhatsApp');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#101014] flex flex-col">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#101014] text-white px-4 py-3 rounded-2xl border border-[#C7F000] shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <PadelBall size={16} glow />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-[#D9D9D2] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Club Badge */}
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-xs">
                <PadelBall size={20} glow={false} />
              </div>
              <div className="text-left">
                <span className="text-base font-black tracking-tight text-[#101014] block leading-none">
                  Cancha<span className="text-[#7C3AED]">Llena</span>
                </span>
                <span className="text-[10px] font-bold text-[#62626A]">Centro de Control</span>
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#D9D9D2]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-xs font-extrabold text-[#101014]">
                Pádel Club Vitacura
              </span>
            </div>
          </div>

          {/* Right Action Tools & User Profile */}
          <div className="flex items-center gap-3">
            {/* WhatsApp Bot Status toggle */}
            <button
              onClick={() => {
                setBotActive(!botActive);
                triggerNotification(
                  botActive ? 'WhatsApp Bot pausado temporalmente' : 'WhatsApp Bot activo y respondiendo 24/7'
                );
              }}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                botActive
                  ? 'bg-[#25D366]/10 text-[#075E54] border-[#25D366]/40'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{botActive ? 'Bot WhatsApp Conectado' : 'Bot Pausado'}</span>
            </button>

            {/* User Dropdown / Logout */}
            <div className="flex items-center gap-2 bg-[#F7F7F4] p-1.5 rounded-xl border border-[#D9D9D2]">
              <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center text-xs font-bold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-[#101014] hidden md:inline">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                title="Cerrar Sesión"
                className="p-1 rounded-lg hover:bg-white text-[#62626A] hover:text-[#DC2626] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Dashboard Sub-Nav Tabs */}
      <div className="bg-white border-b border-[#D9D9D2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Resumen Diario', icon: LayoutDashboard },
              { id: 'grid', label: 'Grilla de Canchas', icon: Calendar },
              { id: 'matchmaking', label: 'Matchmaking & Partidos 4/4', icon: Trophy },
              { id: 'players', label: 'Comunidad de Jugadores', icon: Users },
              { id: 'settings', label: 'Configuración de Canchas', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#7C3AED] text-[#7C3AED]'
                      : 'border-transparent text-[#62626A] hover:text-[#101014]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Section 28: Intelligent Opportunity Banner */}
            <div className="bg-gradient-to-r from-[#7C3AED]/15 via-[#C7F000]/20 to-[#7C3AED]/15 rounded-3xl p-6 border border-[#7C3AED]/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-[#7C3AED] text-white shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#C7F000] text-[#101014] rounded-md">
                      Oportunidad Detectada
                    </span>
                    <span className="text-xs text-[#62626A]">Hoy · 15:00 hrs</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#101014] mt-0.5">
                    Tiene 2 canchas libres a las 15:00. Hay 8 jugadores compatibles disponibles.
                  </h3>
                  <p className="text-xs text-[#62626A] mt-0.5">
                    Podemos lanzar la convocatoria automática por WhatsApp a jugadores categoría 3.0 - 3.5 ahora mismo.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNewMatchModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Lanzar Matchmaking WhatsApp</span>
              </button>
            </div>

            {/* Stat Cards Grid (Section 24) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Ocupación Hoy */}
              <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#62626A]">
                  <span>Ocupación Hoy</span>
                  <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                </div>
                <div className="text-3xl font-black text-[#101014]">
                  {summaryData?.occupancyRate || '87%'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
                  <span>▲ +18%</span>
                  <span className="text-[#62626A] font-normal">vs. promedio sin bot</span>
                </div>
              </div>

              {/* Reservas Activas */}
              <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#62626A]">
                  <span>Reservas del Día</span>
                  <Calendar className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="text-3xl font-black text-[#101014]">
                  {summaryData?.totalBookings || '12'}
                </div>
                <div className="text-xs text-[#62626A]">
                  <strong className="text-[#101014] font-bold">10</strong> vía WhatsApp · <strong className="text-[#101014] font-bold">2</strong> panel
                </div>
              </div>

              {/* Partidos 4/4 Llenos */}
              <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#62626A]">
                  <span>Partidos 4/4 Llenados</span>
                  <Trophy className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="text-3xl font-black text-[#7C3AED]">
                  {summaryData?.openMatches || '3'}
                </div>
                <div className="text-xs text-[#62626A]">
                  12 jugadores convocados automáticamente
                </div>
              </div>

              {/* Ingresos Estimados */}
              <div className="bg-white rounded-2xl p-5 border border-[#D9D9D2] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#62626A]">
                  <span>Ingresos Proyectados</span>
                  <PadelBall size={18} glow={false} />
                </div>
                <div className="text-3xl font-black text-[#101014]">
                  ${Number(summaryData?.estimatedRevenue || 216000).toLocaleString('es-CL')}
                </div>
                <div className="text-xs text-[#16A34A] font-semibold">
                  100% recaudado directamente
                </div>
              </div>

            </div>

            {/* Real-Time Live Courts Quick Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-[#D9D9D2] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#101014]">
                    Estado de las Canchas en Tiempo Real
                  </h3>
                  <p className="text-xs text-[#62626A]">
                    Haga clic en cualquier bloque horario para cambiar su estado (Libre, Reservada, Partido Abierto).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl bg-[#F7F7F4] hover:bg-[#E5E7EB] border border-[#D9D9D2] text-[#101014] text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualizar</span>
                  </button>
                  <button
                    onClick={() => setShowNewMatchModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Partido Abierto</span>
                  </button>
                </div>
              </div>

              {/* Courts Grid Rows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courts.map((court) => (
                  <div
                    key={court.id}
                    className="bg-[#F7F7F4] rounded-2xl p-5 border border-[#D9D9D2] space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#D9D9D2] pb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#101014]">{court.name}</h4>
                        <span className="text-[10px] text-[#62626A]">{court.surface} · {court.type}</span>
                      </div>
                      <span className="text-xs font-bold text-[#7C3AED] bg-white px-2.5 py-1 rounded-lg border border-[#D9D9D2]">
                        {court.pricePeak.toLocaleString('es-CL')} / tanda
                      </span>
                    </div>

                    {/* Slots List */}
                    <div className="space-y-2">
                      {court.slots.map((slot) => {
                        const isFree = slot.status === 'free';
                        const isReserved = slot.status === 'reserved';
                        const isOpenMatch = slot.status === 'open_match';

                        return (
                          <div
                            key={slot.time}
                            onClick={() => handleToggleSlot(court.id, slot.time, slot.status)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isFree
                                ? 'bg-white border-[#16A34A]/40 hover:border-[#16A34A]'
                                : isReserved
                                ? 'bg-white border-[#7C3AED]/40 hover:border-[#7C3AED]'
                                : 'bg-white border-[#F59E0B]/40 hover:border-[#F59E0B]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-black text-[#101014] w-12">{slot.time}</span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isFree ? 'bg-[#16A34A]' : isReserved ? 'bg-[#7C3AED]' : 'bg-[#F59E0B]'
                                }`}
                              />
                              <span className="text-xs font-bold text-[#101014]">
                                {isFree && 'Libre'}
                                {isReserved && (slot.bookedBy || 'Reservada')}
                                {isOpenMatch && (slot.matchInfo ? `Match (${slot.matchInfo.confirmedPlayers}/4)` : 'Partido Abierto')}
                              </span>
                            </div>

                            <span className="text-[10px] text-[#62626A] font-semibold">
                              {isFree && 'Clic para reservar'}
                              {isReserved && 'Confirmada'}
                              {isOpenMatch && 'Buscando 4to'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: GRID / CALENDAR DETAILED */}
        {activeTab === 'grid' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D9D2] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D9D2] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#101014]">Grilla Completa de Canchas</h3>
                <p className="text-xs text-[#62626A]">Vista interactiva por horarios y canchas para hoy</p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Libre
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Reservada
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Partido Abierto 4/4
                </span>
              </div>
            </div>

            {/* Time Slot Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#D9D9D2] text-[#62626A] uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">Horario</th>
                    {courts.map((court) => (
                      <th key={court.id} className="py-3 px-4">
                        {court.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D2]/60">
                  {['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00'].map((time) => (
                    <tr key={time} className="hover:bg-[#F7F7F4]/50">
                      <td className="py-3.5 px-4 font-black text-[#101014] bg-[#F7F7F4] w-28 rounded-lg">
                        {time}
                      </td>
                      {courts.map((court) => {
                        const slot = court.slots.find((s) => s.time === time) || {
                          time,
                          status: 'free',
                          price: court.pricePeak,
                        };

                        const isFree = slot.status === 'free';
                        const isReserved = slot.status === 'reserved';
                        const isOpenMatch = slot.status === 'open_match';

                        return (
                          <td key={court.id} className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleSlot(court.id, time, slot.status)}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                                isFree
                                  ? 'bg-[#16A34A]/5 border-[#16A34A]/30 text-[#16A34A] hover:bg-[#16A34A]/15'
                                  : isReserved
                                  ? 'bg-[#7C3AED]/5 border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/15'
                                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20'
                              }`}
                            >
                              <div className="font-extrabold flex items-center justify-between">
                                <span>
                                  {isFree && 'DISPONIBLE'}
                                  {isReserved && (slot.bookedBy || 'RESERVADA')}
                                  {isOpenMatch && 'MATCH 4/4'}
                                </span>
                                <span className="text-[10px] opacity-70">${slot.price?.toLocaleString('es-CL')}</span>
                              </div>
                              <span className="text-[10px] text-[#62626A] block mt-0.5">
                                {isFree && 'Clic para agendar'}
                                {isReserved && 'Vía WhatsApp Bot'}
                                {isOpenMatch && '3/4 jugadores confirmados'}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MATCHMAKING & OPEN MATCHES (Section 27) */}
        {activeTab === 'matchmaking' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#101014]">Partidos Abiertos & Matchmaking Activo</h3>
                <p className="text-xs text-[#62626A]">Partidos con cupos abiertos buscando jugadores compatibles en el club</p>
              </div>

              <button
                onClick={() => setShowNewMatchModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Partido Abierto</span>
              </button>
            </div>

            {/* Matches List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match) => {
                const isComplete = match.players.length === 4;

                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-3xl p-6 border border-[#D9D9D2] shadow-2xs space-y-4 relative overflow-hidden"
                  >
                    {/* Top Tag & Time */}
                    <div className="flex items-center justify-between border-b border-[#D9D9D2]/70 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#7C3AED] uppercase">Partido #{match.id}</span>
                        <span className="text-xs font-bold text-[#101014]">· {match.courtName}</span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                          isComplete ? 'bg-[#C7F000] text-[#101014]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        }`}
                      >
                        {isComplete ? '4 / 4 COMPLETO' : `${match.players.length} / 4 JUGADORES`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#62626A]">Horario:</span>{' '}
                        <strong className="text-[#101014] font-bold">{match.date} · {match.time}</strong>
                      </div>
                      <div>
                        <span className="text-[#62626A]">Nivel Sugerido:</span>{' '}
                        <strong className="text-[#7C3AED] font-bold">{match.targetLevel}</strong>
                      </div>
                    </div>

                    {/* 4 Players Roster */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#62626A] uppercase block">Jugadores Confirmados:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {match.players.map((p) => (
                          <div key={p.id} className="bg-[#F7F7F4] p-2.5 rounded-xl border border-[#D9D9D2] flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-bold text-xs text-[#101014] block truncate">{p.name}</span>
                              <span className="text-[10px] text-[#62626A]">Nivel {p.level} · {p.position}</span>
                            </div>
                          </div>
                        ))}

                        {/* Missing player slot */}
                        {!isComplete && (
                          <div className="bg-[#7C3AED]/5 p-2.5 rounded-xl border border-dashed border-[#7C3AED] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-white border border-dashed border-[#7C3AED] flex items-center justify-center font-bold text-xs text-[#7C3AED]">
                                ?
                              </div>
                              <div>
                                <span className="font-bold text-xs text-[#7C3AED] block">Buscando 4to...</span>
                                <span className="text-[10px] text-[#62626A]">Nivel {match.targetLevel}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAutocompleteMatch(match.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white text-[10px] font-bold hover:bg-[#6D28D9] transition-all shadow-2xs"
                            >
                              ⚡ Asignar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-[#D9D9D2]/70 flex items-center justify-between text-xs">
                      <span className="text-[#62626A]">Cuota por jugador: <strong>${match.pricePerPlayer.toLocaleString('es-CL')}</strong></span>
                      
                      <button
                        onClick={() => triggerNotification('Notificación de recordatorio enviada por WhatsApp a los jugadores.')}
                        className="text-[#7C3AED] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Avisar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PLAYERS COMMUNITY (Section 29) */}
        {activeTab === 'players' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D9D2] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9D9D2] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#101014]">Base de Jugadores del Club ({players.length})</h3>
                <p className="text-xs text-[#62626A]">Perfiles, niveles deportivos (1.0 a 7.0) y estadísticas de asistencia</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#62626A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar jugador por nombre o nivel..."
                  className="pl-9 pr-4 py-2 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] text-xs font-semibold focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            {/* Players Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D9D9D2] text-[#62626A] uppercase font-bold text-[10px]">
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4">Nivel Pádel</th>
                    <th className="py-3 px-4">Lado Preferido</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Partidos Jugados</th>
                    <th className="py-3 px-4">Asistencia</th>
                    <th className="py-3 px-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D2]/60">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-[#F7F7F4]/50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
                            {player.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-[#101014] block">{player.name}</span>
                            <span className="text-[10px] text-[#62626A]">{player.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white font-extrabold text-xs">
                          {player.level.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#101014]">
                        {player.position}
                      </td>
                      <td className="py-3.5 px-4 text-[#62626A]">
                        {player.phone}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#101014]">
                        {player.matchesPlayed} partidos
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[#16A34A] font-bold">
                          {player.reliabilityScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => triggerNotification(`Mensaje directo enviado por WhatsApp a ${player.name}`)}
                          className="p-2 rounded-lg bg-[#F7F7F4] hover:bg-[#7C3AED] hover:text-white text-[#62626A] transition-all"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D9D2] shadow-sm max-w-4xl space-y-6">
            <h3 className="text-xl font-extrabold text-[#101014]">Configuración del Club & Canchas</h3>
            
            <div className="space-y-4">
              <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#D9D9D2] space-y-2">
                <h4 className="font-bold text-sm text-[#101014]">Nombre y Datos del Club</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#62626A] mb-1 font-semibold">Nombre del Club</label>
                    <input
                      type="text"
                      defaultValue="Pádel Club Vitacura"
                      className="w-full p-2.5 rounded-xl bg-white border border-[#D9D9D2] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#62626A] mb-1 font-semibold">Comuna / Ciudad</label>
                    <input
                      type="text"
                      defaultValue="Vitacura, Santiago"
                      className="w-full p-2.5 rounded-xl bg-white border border-[#D9D9D2] font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#F7F7F4] p-4 rounded-2xl border border-[#D9D9D2] space-y-2">
                <h4 className="font-bold text-sm text-[#101014]">Tarifas por Turno (90 min)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#62626A] mb-1 font-semibold">Horario Punta (18:00 - 22:30)</label>
                    <input
                      type="number"
                      defaultValue={18000}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#D9D9D2] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#62626A] mb-1 font-semibold">Horario Valle (11:00 - 17:00)</label>
                    <input
                      type="number"
                      defaultValue={14000}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#D9D9D2] font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => triggerNotification('Ajustes del club guardados correctamente')}
                className="px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-extrabold shadow-sm transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: CREATE OPEN MATCH */}
      {showNewMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#D9D9D2] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9D9D2] pb-3">
              <h3 className="text-lg font-black text-[#101014] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                Crear Partido Abierto 4/4
              </h3>
              <button onClick={() => setShowNewMatchModal(false)} className="text-[#62626A] hover:text-[#101014]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOpenMatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#101014] mb-1">Seleccionar Cancha</label>
                <select
                  value={newMatchCourtId}
                  onChange={(e) => setNewMatchCourtId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] font-semibold text-[#101014]"
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.surface})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#101014] mb-1">Horario del Partido</label>
                <select
                  value={newMatchTime}
                  onChange={(e) => setNewMatchTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] font-semibold text-[#101014]"
                >
                  {['13:30', '15:00', '16:30', '18:00', '19:30', '21:00'].map((t) => (
                    <option key={t} value={t}>
                      {t} hrs
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#101014] mb-1">Rango de Nivel Compatible</label>
                <select
                  value={newMatchTargetLevel}
                  onChange={(e) => setNewMatchTargetLevel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F7F7F4] border border-[#D9D9D2] font-semibold text-[#101014]"
                >
                  <option value="2.5 - 3.0">Nivel 2.5 - 3.0 (Iniciación / Cuarta)</option>
                  <option value="3.0 - 3.5">Nivel 3.0 - 3.5 (Intermedio / Tercera)</option>
                  <option value="3.5 - 4.5">Nivel 3.5 - 4.5 (Avanzado / Segunda)</option>
                  <option value="4.5 - 6.0">Nivel 4.5 - 6.0 (Primera / Competitivo)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[11px] text-[#7C3AED] leading-relaxed">
                🎾 Al crear el partido, CanchaLlena enviará invitaciones automáticas por WhatsApp a los jugadores compatibles de su base de datos.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMatchModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D9D9D2] font-bold text-[#62626A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold shadow-sm"
                >
                  Crear e Invitar Jugadores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
