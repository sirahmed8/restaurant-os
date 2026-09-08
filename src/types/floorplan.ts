/**
 * =====================================================================
 * RESTAURANT OS — FLOOR PLAN & TABLE RESERVATIONS TYPE DEFINITIONS
 * =====================================================================
 */

export type TableShape = 'round' | 'square' | 'rectangle' | 'vip_booth' | 'bar_stool' | 'landmark';

export type TableStatus = 'available' | 'occupied' | 'billing' | 'cleaning' | 'reserved' | 'out_of_service';

export type LandmarkType = 
  | 'entrance'
  | 'bar_counter'
  | 'stage_music'
  | 'fountain_decor'
  | 'cashier_desk'
  | 'restroom'
  | 'kitchen_pass'
  | 'balcony_railing';

export interface FloorTable {
  id: string;
  tableNumber: string;
  sectionId: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  currentOrderId?: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  rotation?: number; // 0, 45, 90, 180, 270 degrees
  qrCodeToken: string;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  minSpend?: number;
  lastOccupiedAt?: string;
  guestCount?: number;
  landmarkType?: LandmarkType;
  label?: string;
  notes?: string;
  vipTierRequired?: boolean;
}

export interface FloorSection {
  id: string;
  nameAr: string;
  nameEn: string;
  floor: number;
  isActive: boolean;
  color: string;
  sortOrder: number;
  icon?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export type ReservationStatus = 
  | 'confirmed' 
  | 'pending' 
  | 'seated' 
  | 'cancelled' 
  | 'no_show' 
  | 'completed';

export type ReservationOccasion = 
  | 'casual' 
  | 'birthday' 
  | 'anniversary' 
  | 'business' 
  | 'vip' 
  | 'family' 
  | 'private_event';

export interface TableReservation {
  id: string;
  reservationNumber: string;
  guestName: string;
  phone: string;
  email?: string;
  tableId?: string;
  tableNumber?: string;
  sectionId: string;
  partySize: number;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm
  durationMinutes: number;
  status: ReservationStatus;
  occasion: ReservationOccasion;
  depositAmount: number;
  depositPaid: boolean;
  specialRequests?: string;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  checkInAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  vipTier?: 'Standard' | 'Silver' | 'Gold' | 'Black VIP';
  createdAt: string;
  updatedAt: string;
}

export interface FloorPlanStats {
  totalTables: number;
  totalCapacity: number;
  availableTables: number;
  occupiedTables: number;
  billingTables: number;
  cleaningTables: number;
  reservedTables: number;
  occupancyRate: number; // percentage
  liveRevenue: number;
  currentGuests: number;
  avgDurationMinutes: number;
}
