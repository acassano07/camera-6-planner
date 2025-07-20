import { Room, Booking } from "@/types/booking";

interface AssignmentResult {
  roomId: number | null;
  reason: string;
}

export function findOptimalRoom(
  guests: number,
  checkIn: Date,
  checkOut: Date,
  rooms: Room[],
  existingBookings: Booking[]
): AssignmentResult {
  // Filtra le camere disponibili per il periodo richiesto
  const availableRooms = rooms.filter(room => {
    if (room.status !== 'available') return false;
    
    // Verifica che la camera abbia capacità sufficiente
    if (room.capacity < guests) return false;
    
    // Verifica che non ci siano conflitti con prenotazioni esistenti
    const hasConflict = existingBookings.some(booking => {
      if (booking.roomId !== room.id || booking.status !== 'confirmed') return false;
      
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);
      
      // Controlla sovrapposizioni
      return (
        (checkIn < bookingEnd && checkOut > bookingStart) ||
        (checkIn <= bookingStart && checkOut >= bookingEnd)
      );
    });
    
    return !hasConflict;
  });

  if (availableRooms.length === 0) {
    return { roomId: null, reason: "Nessuna camera disponibile per il periodo selezionato" };
  }

  // Algoritmo di ottimizzazione intelligente con ordine preferito:
  // Singola → 2, 1, 4, 5, 6, 3
  // Matrimoniale → 1, 2, 4, 5, 6, 3  
  // Tripla/Quadrupla → 3, 5, 6

  const getPreferredOrder = (guestCount: number): number[] => {
    if (guestCount === 1) return [2, 1, 4, 5, 6, 3];
    if (guestCount === 2) return [1, 2, 4, 5, 6, 3];
    return [3, 5, 6, 1, 2, 4]; // tripla/quadrupla
  };

  const preferredOrder = getPreferredOrder(guests);
  
  // Cerca prima camere con capacità esatta seguendo l'ordine preferito
  for (const roomId of preferredOrder) {
    const room = availableRooms.find(r => r.id === roomId && r.capacity === guests);
    if (room) {
      return {
        roomId: room.id,
        reason: `Camera ${room.name} assegnata automaticamente (capacità perfetta: ${room.capacity} posti, ordine preferito)`
      };
    }
  }

  // Se non ci sono corrispondenze esatte, cerca seguendo l'ordine preferito
  for (const roomId of preferredOrder) {
    const room = availableRooms.find(r => r.id === roomId && r.capacity >= guests);
    if (room) {
      const wastedSpots = room.capacity - guests;
      return {
        roomId: room.id,
        reason: `Camera ${room.name} assegnata automaticamente (${room.capacity} posti, ${wastedSpots} posto/i non utilizzati, ordine preferito)`
      };
    }
  }


  return { roomId: null, reason: "Errore nell'algoritmo di assegnazione" };
}

export function getOccupancyStats(
  date: Date,
  rooms: Room[],
  bookings: Booking[]
): {
  totalCapacity: number;
  occupiedSpots: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
} {
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);
  
  const activeBookings = bookings.filter(booking => {
    if (booking.status !== 'confirmed') return false;
    
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    
    return checkIn <= dateEnd && checkOut >= dateStart;
  });
  
  const occupiedSpots = activeBookings.reduce((sum, booking) => sum + booking.guests, 0);
  const occupiedRooms = new Set(activeBookings.map(b => b.roomId)).size;
  const availableRooms = rooms.length - occupiedRooms;
  const occupancyRate = totalCapacity > 0 ? (occupiedSpots / totalCapacity) * 100 : 0;
  
  return {
    totalCapacity,
    occupiedSpots,
    occupiedRooms,
    availableRooms,
    occupancyRate
  };
}