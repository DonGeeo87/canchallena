import {
  User,
  Club,
  Court,
  Player,
  OpenMatch,
  Booking,
  TodayStats,
  SlotStatus,
} from '../types';

// Apunta a la API real de canchallena/api (Express). NO hay fallback falso:
// si la API no responde, los componentes deben mostrar el error real.
export const API_BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('canchallena_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// --- Tipos del backend real (canchallena/api) ---
interface ApiClubRaw {
  id: string; name: string; slug: string; city?: string; currency?: string;
}
interface ApiCourtRaw {
  id: string; club_id: string; name: string; price_per_slot: number; active: number;
}
interface ApiSlotRaw {
  id: string; court_id: string; starts_at: string; ends_at: string; status: string; price: number;
  court_name?: string; price_per_slot?: number;
}
interface ApiPlayerRaw {
  id: string; name: string; phone: string; categoria?: string; es_nuevo?: number;
  dias_sin_jugar?: number; nivel?: string; ganados?: number; ausencias?: number; level?: number | null;
}
interface ApiMatchRaw {
  id: string; slot_id: string; min_level: number | null; max_level: number | null; status: string;
  court_name?: string; capacity?: number; accepted?: number;
  invites?: Array<{ id: string; status: string; name?: string; categoria?: string; level?: number | null; es_nuevo?: number }>;
}

interface ApiMatchOpenRaw {
  id: string; slot: string; open_match_id?: string;
  parejaA?: Array<{ name: string; categoria: string; es_nuevo: number }>;
  parejaB?: Array<{ name: string; categoria: string; es_nuevo: number }>;
  invitaciones?: Array<{ id: string; player: string; categoria: string; es_nuevo: number }>;
}
interface ApiBookingRaw {
  id: string; status: string; price: number | null; starts_at: string; ends_at?: string;
  court_name?: string; player_name?: string; player_phone?: string;
}

async function request<T>(path: string, opts: RequestInit = {}, useAuth = true): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers: useAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch { /* no body */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// Mapeo de una cancha del backend a la forma Court del frontend.
function mapCourt(raw: ApiCourtRaw, slots: ApiSlotRaw[] = []): Court {
  const mappedSlots = slots
    .filter((s) => s.court_id === raw.id)
    .map((s) => ({
      id: s.id,
      time: new Date(s.starts_at).toISOString().slice(11, 16),
      status: (s.status === 'libre' ? 'free' : s.status === 'reservada' ? 'reserved' : 'open_match') as any,
      price: s.price ?? raw.price_per_slot,
    }));
  return {
    id: raw.id,
    code: raw.name.toUpperCase(),
    name: raw.name,
    surface: 'Cancha de pádel',
    type: 'Standard',
    status: raw.active ? 'active' : 'inactive',
    price: raw.price_per_slot,
    pricePeak: raw.price_per_slot,
    priceValley: raw.price_per_slot,
    todayOccupancy: 0,
    todaySlots: 0,
    indoor: false,
    features: [],
    slots: mappedSlots,
  };
}

function mapPlayer(raw: ApiPlayerRaw): Player {
  const cat = raw.categoria || '6ª';
  const nivel = raw.nivel || 'Medio';
  return {
    id: raw.id,
    name: raw.name,
    level: raw.level ?? 3.0,
    category: cat,                               // '3ª'..'6ª'
    matchesCount: raw.ganados ?? 0,
    attendanceRate: 0,
    phone: raw.phone,
    status: raw.es_nuevo ? 'active' : 'active',
    avatarColor: raw.es_nuevo ? '#F59E0B' : '#7C3AED',
    // campos extra del esquema chileno (accesibles si el componente los usa)
    nivel,
    dias_sin_jugar: raw.dias_sin_jugar ?? 0,
  } as any;
}

function mapMatch(raw: ApiMatchRaw): OpenMatch {
  return {
    id: raw.id,
    code: `#${raw.id.slice(0, 4)}`,
    date: 'Hoy',
    time: '',
    courtId: raw.slot_id,
    courtName: raw.court_name || 'Cancha',
    targetLevel: `${raw.min_level ?? 2.0} - ${raw.max_level ?? 4.0}`,
    status: (raw.status === 'buscando' ? 'filling' : raw.status === 'completo' || raw.status === 'confirmado' ? 'full' : 'filling') as any,
    capacity: raw.capacity ?? 4,
    pricePerPlayer: 0,
    players: (raw.invites || [])
      .filter((i) => i.status === 'aceptada')
      .map((i) => ({ id: i.id, name: i.name || 'Jugador', level: i.level ?? 3.0 })),
    suggestedCandidate: null,
  };
}

// API del frontend (contrato que usan los componentes del agente), conectado a la API real.
export const api = {
  auth: {
    async login(_email?: string, _password?: string): Promise<{ success: boolean; token: string; user: User }> {
      // Login real: la API acepta (por ahora) un POST sin body y devuelve el admin + token JWT.
      const data = await request<{ token: string; admin: any }>('/auth/login', { method: 'POST' }, false);
      localStorage.setItem('canchallena_token', data.token);
      const user: User = {
        id: data.admin?.id || 'admin',
        name: data.admin?.name || 'Administrador',
        email: 'admin@canchallena.cl',
        role: 'Club Owner & Manager',
      };
      localStorage.setItem('canchallena_user', JSON.stringify(user));
      return { success: true, token: data.token, user };
    },
    async register(_data?: { email?: string; password?: string; name?: string; clubName?: string }): Promise<{ success: boolean; token: string; user: User }> {
      // Registro no implementado en el backend aún (MVP login directo). Lanzar claro.
      throw new Error('Registro aún no disponible. Use el acceso de demostración.');
    },
    async logout(): Promise<void> {
      localStorage.removeItem('canchallena_token');
      localStorage.removeItem('canchallena_user');
    },
    async getCurrentUser(): Promise<User | null> {
      const raw = localStorage.getItem('canchallena_user');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
  },

  club: {
    async getCurrent(): Promise<Club> {
      const data = await request<{ club: ApiClubRaw; courts: ApiCourtRaw[] }>('/club');
      const club = data.club;
      return {
        id: club.id,
        name: club.name,
        slug: club.slug,
        tagline: 'Su club conectado con CanchaLlena',
        address: club.city || '',
        city: club.city || '',
        phone: '',
        whatsapp: '',
        courtsCount: data.courts.length,
        openHours: '',
        description: '',
        plan: 'MVP',
        amenities: [],
      };
    },
  },

  admin: {
    async getTodaySummary(): Promise<TodayStats> {
      // Ocupación a partir de las reservas de hoy (datos reales).
      const [{ slots }] = await Promise.all([
        request<{ courts: ApiCourtRaw[]; slots: ApiSlotRaw[] }>('/admin/today'),
      ]);
      const occupied = slots.length;
      const totalToday = Math.max(occupied, 1);
      return {
        reservationsCount: occupied,
        openMatchesCount: 0,
        occupancyRate: Math.min(100, Math.round((occupied / totalToday) * 100)),
        opportunitiesCount: 0,
        totalRevenueToday: slots.reduce((s, x) => s + (x.price ?? 0), 0),
        valleHoursFilledCount: 0,
      };
    },
  },

  courts: {
    async getAll(): Promise<Court[]> {
      const courts = await request<ApiCourtRaw[]>('/courts');
      // Traer slots del día para poblar la grilla del dashboard
      const todayData = await request<{ courts: ApiCourtRaw[]; slots: ApiSlotRaw[] }>('/admin/today');
      const slots = todayData.slots || [];
      return courts.map((c) => mapCourt(c, slots));
    },
    async updateSlotStatus(courtId: string, slotTime: string, nextStatus: SlotStatus): Promise<void> {
      // Endpoint real del backend: PATCH /api/courts/:courtId/slot
      const statusMap = { free: 'libre', reserved: 'reservada', open_match: 'partido_abierto' } as Record<string, string>
      await request(`/courts/${courtId}/slot`, {
        method: 'PATCH',
        body: JSON.stringify({ time: slotTime, status: statusMap[nextStatus] || nextStatus }),
      });
    },
  },

  players: {
    async getAll(): Promise<Player[]> {
      const data = await request<{ players: ApiPlayerRaw[] }>('/players');
      return data.players.map(mapPlayer);
    },
  },

  matchmaking: {
    async getOpenMatches(): Promise<OpenMatch[]> {
      const data = await request<{ matches: ApiMatchRaw[] }>('/matchmaking');
      return data.matches.map(mapMatch);
    },
    async createOpenMatch(payload: {
      courtId: string;
      courtName?: string;
      time?: string;
      date?: string;
      targetLevel: string;
      pricePerPlayer?: number;
      organizerPlayerId?: string;
    }): Promise<OpenMatch> {
      // El payload trae courtId (id de cancha), pero el endpoint espera slot_id.
      // Buscar el primer slot libre de esa cancha HOY.
      const date = payload.date === 'Hoy' ? new Date().toISOString().slice(0, 10) : (payload.date || new Date().toISOString().slice(0, 10));
      const slots = await request<ApiSlotRaw[]>(`/slots?date=${date}`);
      const slotLibre = slots.find((s) => s.court_id === payload.courtId && s.status === 'libre');
      if (!slotLibre) throw new Error(`No hay cancha libre en ${payload.courtName || 'esa cancha'} para ${date}`);
      const data = await request<ApiMatchOpenRaw>('/matchmaking/open', {
        method: 'POST', body: JSON.stringify({ slot_id: slotLibre.id }),
      });
      // El endpoint devuelve parejaA/parejaB/invitaciones — armar el OpenMatch
      const players = (data.invitaciones || []).map((i) => ({ id: i.id, name: i.player, level: 3.0 }));
      return {
        id: data.open_match_id || data.id,
        code: `#${(data.open_match_id || data.id).slice(0, 4)}`,
        date: 'Hoy',
        time: '',
        courtId: slotLibre.id,
        courtName: payload.courtName || 'Cancha',
        targetLevel: payload.targetLevel,
        status: 'filling' as any,
        capacity: 4,
        pricePerPlayer: payload.pricePerPlayer || 0,
        players,
        suggestedCandidate: null,
      } as any;
    },
    async autocompleteMatch(matchId: string): Promise<OpenMatch> {
      // Endpoint real: POST /api/matchmaking/:id/complete (invita al mejor candidato)
      const data = await request<{ ok: boolean; jugador?: { name: string; categoria: string } }>(`/matchmaking/${matchId}/complete`, { method: 'POST' });
      return { id: matchId, code: `#${matchId.slice(0, 4)}`, date: 'Hoy', time: '', courtId: '', courtName: 'Cancha', targetLevel: '3.0 - 3.5', status: 'filling' as any, capacity: 4, pricePerPlayer: 0, players: [], suggestedCandidate: null, ...data } as any;
    },
  },

  bookings: {
    async getAll(): Promise<Booking[]> {
      const data = await request<{ bookings: ApiBookingRaw[] }>('/bookings');
      return data.bookings.map((b) => ({
        id: b.id,
        courtId: '',
        courtName: b.court_name || 'Cancha',
        time: b.starts_at,
        date: b.starts_at.slice(0, 10),
        organizer: b.player_name || 'Jugador',
        phone: b.player_phone || '',
        status: (['confirmada', 'pendiente', 'jugada', 'cancelada', 'no_show'].includes(b.status)
          ? (b.status === 'jugada' ? 'completed' : b.status === 'pendiente' ? 'filling' : b.status === 'confirmada' ? 'confirmed' : b.status) : 'confirmed') as any,
        type: 'private',
        amount: b.price ?? 0,
        source: 'WhatsApp Bot',
      }));
    },
  },

  public: {
    async getClub(slug: string): Promise<Club> {
      const data = await request<{ club: ApiClubRaw; courts: ApiCourtRaw[]; freeSlots: ApiSlotRaw[] }>(`/public/club/${slug}`);
      return {
        id: data.club.id,
        name: data.club.name,
        slug: data.club.slug,
        tagline: 'Su club conectado con CanchaLlena',
        address: data.club.city || '',
        city: data.club.city || '',
        phone: '',
        whatsapp: '',
        courtsCount: data.courts.length,
        openHours: '',
        description: '',
        plan: '',
        amenities: [],
        // Datos extra del micrositio (canchas + cupos libres de hoy)
        _courts: data.courts.map((c) => mapCourt(c, data.freeSlots)),
        _freeSlots: data.freeSlots,
      } as any;
    },
  },
};
