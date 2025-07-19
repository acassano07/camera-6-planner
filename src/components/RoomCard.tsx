import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Plus, Calendar } from "lucide-react";
import { Room, Booking } from "@/types/booking";

interface RoomCardProps {
  room: Room;
  bookings: Booking[];
  onAddBooking: (roomId: number) => void;
  onViewBookings: (roomId: number) => void;
}

export function RoomCard({ room, bookings, onAddBooking, onViewBookings }: RoomCardProps) {
  const currentBookings = bookings.filter(b => 
    b.roomId === room.id && 
    b.status === 'confirmed' &&
    new Date(b.checkIn) <= new Date() && 
    new Date(b.checkOut) >= new Date()
  );

  const upcomingBookings = bookings.filter(b => 
    b.roomId === room.id && 
    b.status === 'confirmed' &&
    new Date(b.checkIn) > new Date()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success text-success-foreground';
      case 'occupied':
        return 'bg-warning text-warning-foreground';
      case 'maintenance':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Libera';
      case 'occupied':
        return 'Occupata';
      case 'maintenance':
        return 'Manutenzione';
      default:
        return status;
    }
  };

  const isOccupied = currentBookings.length > 0;
  const actualStatus = isOccupied ? 'occupied' : room.status;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{room.name}</h3>
            <p className="text-sm text-muted-foreground">{room.type}</p>
          </div>
          <Badge className={getStatusColor(actualStatus)}>
            {getStatusText(actualStatus)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bed className="h-4 w-4" />
          <span>Camera {room.id}</span>
        </div>

        {currentBookings.length > 0 && (
          <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
            <h4 className="font-medium text-sm text-warning-foreground">Ospite Attuale:</h4>
            <p className="text-sm">{currentBookings[0].guestName}</p>
            <p className="text-xs text-muted-foreground">
              Fino al {currentBookings[0].checkOut.toLocaleDateString('it-IT')}
            </p>
          </div>
        )}

        {upcomingBookings.length > 0 && (
          <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
            <h4 className="font-medium text-sm text-accent-foreground">Prossima Prenotazione:</h4>
            <p className="text-sm">{upcomingBookings[0].guestName}</p>
            <p className="text-xs text-muted-foreground">
              Dal {upcomingBookings[0].checkIn.toLocaleDateString('it-IT')}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewBookings(room.id)}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Prenotazioni
          </Button>
          <Button
            size="sm"
            onClick={() => onAddBooking(room.id)}
            disabled={actualStatus === 'maintenance'}
          >
            <Plus className="h-4 w-4 mr-1" />
            Prenota
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}