import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Room, Booking } from "@/types/booking";
import { format, addDays, subDays } from "date-fns";
import { it } from "date-fns/locale";

interface RoomDayNavigatorProps {
  rooms: Room[];
  bookings: Booking[];
  onAddBooking: (roomId?: number, date?: Date) => void;
}

export function RoomDayNavigator({ rooms, bookings, onAddBooking }: RoomDayNavigatorProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getBookingsForDate = (date: Date, roomId: number) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter(booking => {
      return booking.roomId === roomId &&
             booking.status === 'confirmed' &&
             new Date(booking.checkIn) <= dayEnd &&
             new Date(booking.checkOut) >= dayStart;
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const renderRoomStatus = (date: Date, title: string, isNextDay = false) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title} - {format(date, 'EEEE d MMMM yyyy', { locale: it })}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const roomBookings = getBookingsForDate(date, room.id);
          
          return (
            <Card key={room.id} className={`p-4 ${isNextDay ? 'bg-muted/30' : ''}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{room.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      roomBookings.length > 0 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    }`}>
                      {roomBookings.length > 0 ? 'Occupata' : 'Libera'}
                    </div>
                    {roomBookings.length === 0 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onAddBooking(room.id, date)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {room.type} - {room.capacity} posti
                </div>
                
                {roomBookings.length > 0 && (
                  <div className="space-y-2">
                    {roomBookings.map(booking => (
                      <div key={booking.id} className="p-2 bg-muted/50 rounded text-sm">
                        <div className="font-medium">{booking.guestName}</div>
                        <div className="text-muted-foreground">
                          {booking.guests} ospiti - {booking.clientType === 'private' ? 'Privato' : 'Booking.com'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(booking.checkIn), 'dd/MM/yyyy')} - {format(new Date(booking.checkOut), 'dd/MM/yyyy')}
                        </div>
                        {booking.clientType === 'private' && (
                          <div className="text-xs text-muted-foreground">
                            Prezzo: €{booking.totalPrice.toFixed(2)} - Tassa: €{booking.touristTax.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const nextDay = addDays(selectedDate, 1);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Oggi
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => onAddBooking(undefined, selectedDate)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Prenotazione
        </Button>
      </div>

      {renderRoomStatus(selectedDate, "Occupazione Camere")}
      {renderRoomStatus(nextDay, "Giorno Successivo", true)}
    </div>
  );
}