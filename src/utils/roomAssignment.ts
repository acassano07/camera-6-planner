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

  // Algoritmo di ottimizzazione:
  // 1. Priorità alle camere con capacità esatta (per minimizzare sprechi)
  // 2. Se non disponibili, scegli la camera con meno posti liberi
  // 3. In caso di parità, scegli quella con ID più basso

  // Cerca camere con capacità esatta
  const exactMatchRooms = availableRooms.filter(room => room.capacity === guests);
  if (exactMatchRooms.length > 0) {
    // Ordina per ID crescente e prendi la prima
    const selectedRoom = exactMatchRooms.sort((a, b) => a.id - b.id)[0];
    return {
      roomId: selectedRoom.id,
      reason: `Camera ${selectedRoom.name} assegnata automaticamente (capacità perfetta: ${selectedRoom.capacity} posti)`
    };
  }

  // Se non ci sono corrispondenze esatte, cerca la camera più piccola che può ospitare gli ospiti
  const suitableRooms = availableRooms
    .filter(room => room.capacity >= guests)
    .sort((a, b) => {
      // Prima per capacità crescente (meno sprechi)
      if (a.capacity !== b.capacity) return a.capacity - b.capacity;
      // Poi per ID crescente
      return a.id - b.id;
    });

  if (suitableRooms.length > 0) {
    const selectedRoom = suitableRooms[0];
    const wastedSpots = selectedRoom.capacity - guests;
    return {
      roomId: selectedRoom.id,
      reason: `Camera ${selectedRoom.name} assegnata automaticamente (${selectedRoom.capacity} posti, ${wastedSpots} posto/i non utilizzati)`
    };
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