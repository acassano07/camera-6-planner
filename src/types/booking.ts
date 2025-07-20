export interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
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
}