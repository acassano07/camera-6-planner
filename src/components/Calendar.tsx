import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { Booking, Room } from "@/types/booking";

interface CalendarProps {
  bookings: Booking[];
  rooms: Room[];
  onAddBooking: (date?: Date) => void;
  onEditBooking: (booking: Booking) => void;
}

type ViewType = 'month' | 'week' | 'day';

export function Calendar({ bookings, rooms, onAddBooking, onEditBooking }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');

  const getRoomName = (roomId: number) => {
    return rooms.find(r => r.id === roomId)?.name || `Camera ${roomId}`;
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return date >= startOfDay(checkIn) && date <= startOfDay(checkOut);
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = viewType === 'month' ? 1 : viewType === 'week' ? 7 : 1;
    const operation = direction === 'prev' ? -amount : amount;
    
    if (viewType === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, operation));
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-sm font-medium text-center text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayBookings = getBookingsForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 p-1 border border-border/30 ${
                isCurrentMonth ? 'bg-background' : 'bg-muted/30'
              } ${isToday ? 'ring-2 ring-primary' : ''} hover:bg-accent/50 transition-colors cursor-pointer`}
              onClick={() => onAddBooking(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'} ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </span>
                {dayBookings.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                    {dayBookings.length}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 2).map(booking => (
                  <div
                    key={booking.id}
                    className="text-xs p-1 bg-primary/20 text-primary-foreground rounded truncate cursor-pointer hover:bg-primary/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBooking(booking);
                    }}
                  >
                    {booking.guestName}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayBookings.length - 2} altro/i
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayBookings = getBookingsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={day.toISOString()} className={`${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{format(day, 'EEE', { locale: it })}</p>
                    <p className="text-lg font-bold">{format(day, 'd')}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onAddBooking(day)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="p-2 bg-primary/10 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => onEditBooking(booking)}
                    >
                      <p className="text-sm font-medium">{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">{getRoomName(booking.roomId)}</p>
                      <p className="text-xs text-muted-foreground">{booking.guests} ospiti</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{format(currentDate, 'EEEE d MMMM yyyy', { locale: it })}</span>
              <Button onClick={() => onAddBooking(currentDate)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Prenotazione
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayBookings.map(booking => (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onEditBooking(booking)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{booking.guestName}</h3>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Camera: {getRoomName(booking.roomId)}</p>
                        <p>Ospiti: {booking.guests}</p>
                        <p>Check-in: {format(new Date(booking.checkIn), 'dd/MM/yyyy')}</p>
                        <p>Check-out: {format(new Date(booking.checkOut), 'dd/MM/yyyy')}</p>
                        <p>Prezzo: €{booking.totalPrice}</p>
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{booking.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {dayBookings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nessuna prenotazione per questa data</p>
                  <Button className="mt-4" onClick={() => onAddBooking(currentDate)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Prenotazione
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const formatTitle = () => {
    switch (viewType) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: it });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: it })} - ${format(weekEnd, 'd MMM yyyy', { locale: it })}`;
      case 'day':
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: it });
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-64 text-center">{formatTitle()}</h2>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Oggi
              </Button>
            </div>
            
            <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
              <TabsList>
                <TabsTrigger value="month">Mese</TabsTrigger>
                <TabsTrigger value="week">Settimana</TabsTrigger>
                <TabsTrigger value="day">Giorno</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </CardContent>
      </Card>
    </div>
  );
}