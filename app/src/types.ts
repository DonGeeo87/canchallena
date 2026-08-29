export type CourtStatus = 'active' | 'maintenance' | 'inactive';
export type SlotStatus = 'free' | 'reserved' | 'open_match' | 'maintenance';
export type MatchStatus = 'filling' | 'full' | 'finished' | 'cancelled';
export type BookingStatus = 'confirmed' | 'filling' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  clubName?: string;
  clubSlug?: string;
}

export type AdminUser = User;

export interface Club {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  courtsCount: number;
  openHours: string;
  description: string;
  plan: string;
  amenities: string[];
}

export interface CourtSlot {
  time: string;
  status: SlotStatus;
  price?: number;
  bookedBy?: string;
  matchInfo?: {
    matchId: string;
    confirmedPlayers: number;
  };
}

export interface Court {
  id: string;
  code: string;
  name: string;
  surface: string;
  type: string;
  status: CourtStatus;
  price: number;
  pricePeak: number;
  priceValley: number;
  todayOccupancy: number;
  todaySlots: number;
  indoor: boolean;
  features: string[];
  slots: CourtSlot[];
}

export interface Player {
  id: string;
  name: string;
  level: number;
  category: string;
  matchesCount: number;
  matchesPlayed?: number;
  attendanceRate: number;
  reliabilityScore?: number;
  phone: string;
  email?: string;
  preferredHand?: string;
  position?: string;
  preferredTime?: string;
  status: 'active' | 'inactive';
  avatarColor?: string;
}

export interface MatchCandidate {
  id: string;
  name: string;
  level: number;
  compatibility: number;
  metrics: {
    level: number;
    schedule: number;
    preference: number;
    clubAffinity: number;
  };
}

export interface OpenMatch {
  id: string;
  code: string;
  date: string;
  time: string;
  courtId: string;
  courtName: string;
  targetLevel: string;
  status: MatchStatus;
  capacity: number;
  pricePerPlayer: number;
  players: Array<{
    id: string;
    name: string;
    level: number;
    position?: string;
    avatarColor?: string;
  }>;
  suggestedCandidate?: MatchCandidate | null;
}

export type MatchmakingGame = OpenMatch;

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  time: string;
  date: string;
  organizer: string;
  phone: string;
  status: BookingStatus;
  type: 'private' | 'open_match' | 'tournament';
  amount: number;
  source: 'WhatsApp Bot' | 'Matchmaking' | 'Panel Administrador';
}

export interface Opportunity {
  id: string;
  time: string;
  title: string;
  description: string;
  availableCourts: string[];
  compatiblePlayersCount: number;
  potentialRevenue: number;
  actionType: 'create_open_match' | 'notify_group';
  actionText: string;
}

export interface TodayStats {
  reservationsCount: number;
  openMatchesCount: number;
  occupancyRate: number;
  opportunitiesCount: number;
  totalRevenueToday: number;
  valleHoursFilledCount: number;
}

export interface TodaySlotMatrix {
  time: string;
  c1: SlotStatus;
  c2: SlotStatus;
  c3: SlotStatus;
}
