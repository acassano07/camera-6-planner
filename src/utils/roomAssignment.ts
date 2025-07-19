import { Room, Booking } from "@/types/booking";

const ROOM_PRIORITY = {
  singola: [2, 1, 4, 5, 6, 3],
  matrimoniale: [1, 2, 4, 5, 6, 3],
  tripla: [3, 5, 6],
  quadrupla: [3, 5, 6],
};

const getRoomTypeForGuests = (guests: number): keyof typeof ROOM_PRIORITY | null => {
  if (guests === 1) return "singola";
  if (guests === 2) return "matrimoniale";
  if (guests === 3) return "tripla";
  if (guests === 4) return "quadrupla";
  return null;
};

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
  const roomType = getRoomTypeForGuests(guests);
  if (!roomType) {
    return { roomId: null, reason: "Numero di ospiti non supportato" };
  }

  const priorityOrder = ROOM_PRIORITY[roomType];

  const availableRooms = rooms.filter(room => {
    if (room.status !== "available" || !priorityOrder.includes(room.id)) return false;
    if (room.capacity < guests) return false;

    const hasConflict = existingBookings.some(booking => {
      if (booking.rooms.every(r => r.roomId !== room.id) || booking.status !== "confirmed") return false;
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);
      return checkIn < bookingEnd && checkOut > bookingStart;
    });

    return !hasConflict;
  });

  if (availableRooms.length === 0) {
    return { roomId: null, reason: "Nessuna camera disponibile per il periodo selezionato" };
  }

  availableRooms.sort((a, b) => {
    const priorityA = priorityOrder.indexOf(a.id);
    const priorityB = priorityOrder.indexOf(b.id);
    return priorityA - priorityB;
  });

  const selectedRoom = availableRooms[0];

  return {
    roomId: selectedRoom.id,
    reason: `Camera ${selectedRoom.name} assegnata in base alla priorità per ${roomType}`,
  };
}

export function optimizeRoomAssignments(
  futureBookings: Booking[],
  rooms: Room[],
  allBookings: Booking[]
): { newBookings: Booking[], changes: { from: number, to: number, bookingId: string }[] } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingsToOptimize = futureBookings.filter(b => new Date(b.checkIn) > today && b.status === 'confirmed');

    // Sort bookings to process them in a specific order, e.g., by check-in date
    bookingsToOptimize.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    let currentBookings = [...allBookings];
    const changes: { from: number, to: number, bookingId: string }[] = [];

    for (const booking of bookingsToOptimize) {
        const mainRoom = booking.rooms[0]; // Assuming one room per booking for now
        const guests = mainRoom.guests;

        // Find the best room for this booking, considering all other bookings
        const otherBookings = currentBookings.filter(b => b.id !== booking.id);
        const result = findOptimalRoom(guests, new Date(booking.checkIn), new Date(booking.checkOut), rooms, otherBookings);

        if (result.roomId && result.roomId !== mainRoom.roomId) {
            changes.push({ from: mainRoom.roomId, to: result.roomId, bookingId: booking.id });
            // Update the booking in our temporary list
            const bookingIndex = currentBookings.findIndex(b => b.id === booking.id);
            if (bookingIndex !== -1) {
                currentBookings[bookingIndex].rooms[0].roomId = result.roomId;
            }
        }
    }

    return { newBookings: currentBookings, changes };
}