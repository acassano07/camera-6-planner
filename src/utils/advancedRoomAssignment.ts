import { Room, Booking } from "@/types/booking";

export interface AssignmentResult {
  roomId: number | null;
  reason: string;
  suggestedMoves?: BookingMove[];
}

export interface BookingMove {
  bookingId: string;
  fromRoomId: number;
  toRoomId: number;
  reason: string;
}

export interface RoomClosure {
  roomId: number;
  startDate: Date;
  endDate: Date;
  reason: string;
}

// Ordine preferibile per l'occupazione delle camere
const ROOM_PREFERENCES = {
  single: [2, 1, 4, 5, 6, 3],        // singola
  double: [1, 2, 4, 5, 6, 3],        // matrimoniale  
  triple: [3, 5, 6, 1, 2, 4],        // tripla
  quadruple: [3, 5, 6, 1, 2, 4]      // quadrupla
};

export function getPreferredRoomOrder(guestCount: number): number[] {
  if (guestCount === 1) return ROOM_PREFERENCES.single;
  if (guestCount === 2) return ROOM_PREFERENCES.double;
  if (guestCount === 3) return ROOM_PREFERENCES.triple;
  if (guestCount >= 4) return ROOM_PREFERENCES.quadruple;
  return ROOM_PREFERENCES.double; // fallback
}

export function findOptimalRoomAdvanced(
  guests: number,
  checkIn: Date,
  checkOut: Date,
  rooms: Room[],
  existingBookings: Booking[],
  closures: RoomClosure[] = [],
  allowRoomMoves: boolean = false,
  lockedRoomId?: number
): AssignmentResult {
  
  // Se è specificata una camera bloccata, usa quella
  if (lockedRoomId) {
    const lockedRoom = rooms.find(r => r.id === lockedRoomId);
    if (lockedRoom && isRoomAvailable(lockedRoom, checkIn, checkOut, existingBookings, closures)) {
      return {
        roomId: lockedRoomId,
        reason: `Camera ${lockedRoom.name} assegnata manualmente (bloccata)`
      };
    } else {
      return {
        roomId: null,
        reason: `Camera ${lockedRoom?.name || lockedRoomId} non disponibile nel periodo richiesto`
      };
    }
  }

  // Filtra le camere disponibili
  const availableRooms = rooms.filter(room => 
    room.status === 'available' && 
    room.capacity >= guests &&
    isRoomAvailable(room, checkIn, checkOut, existingBookings, closures)
  );

  if (availableRooms.length === 0) {
    // Se non ci sono camere disponibili e i movimenti sono permessi, prova a riorganizzare
    if (allowRoomMoves) {
      return findOptimalWithMoves(guests, checkIn, checkOut, rooms, existingBookings, closures);
    }
    return { 
      roomId: null, 
      reason: "Nessuna camera disponibile per il periodo selezionato" 
    };
  }

  // Segui l'ordine preferito per l'assegnazione
  const preferredOrder = getPreferredRoomOrder(guests);
  
  // Prima cerca camere con capacità esatta
  for (const roomId of preferredOrder) {
    const room = availableRooms.find(r => r.id === roomId && r.capacity === guests);
    if (room) {
      return {
        roomId: room.id,
        reason: `Camera ${room.name} assegnata automaticamente (capacità perfetta: ${room.capacity} posti)`
      };
    }
  }

  // Poi cerca camere con capacità maggiore seguendo l'ordine preferito
  for (const roomId of preferredOrder) {
    const room = availableRooms.find(r => r.id === roomId && r.capacity >= guests);
    if (room) {
      const wastedSpots = room.capacity - guests;
      return {
        roomId: room.id,
        reason: `Camera ${room.name} assegnata automaticamente (${room.capacity} posti, ${wastedSpots} posto/i liberi)`
      };
    }
  }

  return { roomId: null, reason: "Errore nell'algoritmo di assegnazione" };
}

function isRoomAvailable(
  room: Room,
  checkIn: Date,
  checkOut: Date,
  existingBookings: Booking[],
  closures: RoomClosure[]
): boolean {
  // Verifica chiusure
  const isClosed = closures.some(closure => 
    closure.roomId === room.id &&
    !(checkOut <= closure.startDate || checkIn >= closure.endDate)
  );
  
  if (isClosed) return false;

  // Verifica conflitti con prenotazioni esistenti
  const hasConflict = existingBookings.some(booking => {
    if (booking.roomId !== room.id || booking.status !== 'confirmed') return false;
    
    const bookingStart = new Date(booking.checkIn);
    const bookingEnd = new Date(booking.checkOut);
    
    return !(checkOut <= bookingStart || checkIn >= bookingEnd);
  });
  
  return !hasConflict;
}

function findOptimalWithMoves(
  guests: number,
  checkIn: Date,
  checkOut: Date,
  rooms: Room[],
  existingBookings: Booking[],
  closures: RoomClosure[]
): AssignmentResult {
  
  const movableBookings = existingBookings.filter(booking => {
    // Non spostare clienti già arrivati (check-in passato)
    const bookingCheckIn = new Date(booking.checkIn);
    const now = new Date();
    return bookingCheckIn > now && booking.status === 'confirmed';
  });

  // Prova diverse combinazioni di movimenti
  const suggestedMoves: BookingMove[] = [];
  
  // Algoritmo semplificato: trova una combinazione che funziona
  for (const room of rooms) {
    if (room.capacity < guests) continue;
    
    // Verifica se spostando le prenotazioni in conflitto possiamo liberare questa camera
    const conflictingBookings = movableBookings.filter(booking => {
      if (booking.roomId !== room.id) return false;
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);
      return !(checkOut <= bookingStart || checkIn >= bookingEnd);
    });
    
    let canMoveAll = true;
    const tempMoves: BookingMove[] = [];
    
    for (const conflictBooking of conflictingBookings) {
      const alternativeRoom = findAlternativeRoom(
        conflictBooking,
        rooms,
        existingBookings,
        closures,
        [...suggestedMoves, ...tempMoves]
      );
      
      if (alternativeRoom) {
        tempMoves.push({
          bookingId: conflictBooking.id,
          fromRoomId: conflictBooking.roomId,
          toRoomId: alternativeRoom.id,
          reason: `Spostato per ottimizzare l'occupazione`
        });
      } else {
        canMoveAll = false;
        break;
      }
    }
    
    if (canMoveAll) {
      return {
        roomId: room.id,
        reason: `Camera ${room.name} disponibile dopo riorganizzazione automatica`,
        suggestedMoves: tempMoves
      };
    }
  }
  
  return {
    roomId: null,
    reason: "Impossibile trovare una sistemazione anche con riorganizzazione automatica"
  };
}

function findAlternativeRoom(
  booking: Booking,
  rooms: Room[],
  existingBookings: Booking[],
  closures: RoomClosure[],
  plannedMoves: BookingMove[]
): Room | null {
  
  const preferredOrder = getPreferredRoomOrder(booking.guests);
  
  for (const roomId of preferredOrder) {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.capacity < booking.guests) continue;
    
    // Simula il movimento e verifica disponibilità
    const simulatedBookings = existingBookings.map(b => {
      const move = plannedMoves.find(m => m.bookingId === b.id);
      if (move) {
        return { ...b, roomId: move.toRoomId };
      }
      return b;
    }).filter(b => b.id !== booking.id); // Escludi la prenotazione che stiamo spostando
    
    if (isRoomAvailable(room, new Date(booking.checkIn), new Date(booking.checkOut), simulatedBookings, closures)) {
      return room;
    }
  }
  
  return null;
}

export function optimizeAllRoomAssignments(
  rooms: Room[],
  bookings: Booking[],
  closures: RoomClosure[] = []
): BookingMove[] {
  const moves: BookingMove[] = [];
  const sortedBookings = [...bookings]
    .filter(b => b.status === 'confirmed')
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  
  for (const booking of sortedBookings) {
    // Salta clienti già arrivati
    if (new Date(booking.checkIn) <= new Date()) continue;
    
    const currentRoom = rooms.find(r => r.id === booking.roomId);
    if (!currentRoom) continue;
    
    // Trova la camera ottimale per questa prenotazione
    const preferredOrder = getPreferredRoomOrder(booking.guests);
    
    for (const roomId of preferredOrder) {
      if (roomId === booking.roomId) break; // Se è già nella camera ottimale, fermati
      
      const targetRoom = rooms.find(r => r.id === roomId);
      if (!targetRoom || targetRoom.capacity < booking.guests) continue;
      
      // Simula il movimento
      const simulatedBookings = bookings.map(b => {
        if (b.id === booking.id) return { ...b, roomId: targetRoom.id };
        const existingMove = moves.find(m => m.bookingId === b.id);
        if (existingMove) return { ...b, roomId: existingMove.toRoomId };
        return b;
      });
      
      if (isRoomAvailable(targetRoom, new Date(booking.checkIn), new Date(booking.checkOut), simulatedBookings, closures)) {
        moves.push({
          bookingId: booking.id,
          fromRoomId: booking.roomId,
          toRoomId: targetRoom.id,
          reason: `Ottimizzazione automatica: camera più adatta per ${booking.guests} ospiti`
        });
        break;
      }
    }
  }
  
  return moves;
}