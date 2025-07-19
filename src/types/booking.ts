export interface Room {
  id: number;
  name: string;
  type: "singola" | "matrimoniale" | "tripla" | "quadrupla";
  capacity: number;
  status: "available" | "occupied" | "maintenance";
}

export interface BookedRoom {
  roomId: number;
  guests: number;
}

export type TouristTaxExemption = | "minore" | "disabile" | "accompagnatore_disabile" | "autista" | "forze_ordine" | "sanitari" | "residente" | "aire";

export interface Booking {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  notes?: string;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: Date;
  source: "private" | "booking.com";
  rooms: BookedRoom[];
  touristTaxExemptions?: TouristTaxExemption[];
}

export interface BookingFormData {
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  notes?: string;
  rooms: BookedRoom[];
  touristTaxExemptions?: TouristTaxExemption[];
}