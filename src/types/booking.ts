export interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'closed';
  closedUntil?: Date;
  closureReason?: string;
}

export interface Booking {
  id: string;
  roomId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  notes?: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Date;
  clientType: 'private' | 'booking';
  touristTax: number;
  touristTaxExemptions: boolean[];
  childrenUnder12: boolean[];
  lockedRoom?: boolean; // Indica se la camera è bloccata manualmente
  hasArrived?: boolean; // Indica se il cliente è già arrivato
}

export interface BookingFormData {
  roomId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes?: string;
  totalPrice: number;
  clientType: 'private' | 'booking';
  touristTax: number;
  touristTaxExemptions: boolean[];
  childrenUnder12: boolean[];
  lockedRoom?: boolean;
}