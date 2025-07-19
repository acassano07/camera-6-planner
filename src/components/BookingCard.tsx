import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Phone, Mail, Euro, Trash2, Edit } from "lucide-react";
import { Booking } from "@/types/booking";

interface BookingCardProps {
  booking: Booking;
  roomName: string;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
}

export function BookingCard({ booking, roomName, onEdit, onDelete }: BookingCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confermata';
      case 'pending':
        return 'In Attesa';
      case 'cancelled':
        return 'Cancellata';
      default:
        return status;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{booking.guestName}</h3>
            <p className="text-sm text-muted-foreground">{roomName}</p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusText(booking.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{booking.guests} ospiti</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{booking.guestEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{booking.guestPhone}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Euro className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary">€{booking.totalPrice}</span>
        </div>

        {booking.notes && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <strong>Note:</strong> {booking.notes}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(booking)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifica
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(booking.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}