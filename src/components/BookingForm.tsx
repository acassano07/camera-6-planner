import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Save, Sparkles } from "lucide-react";
import { BookingFormData, Room, Booking } from "@/types/booking";
import { findOptimalRoom } from "@/utils/roomAssignment";

interface BookingFormProps {
  rooms: Room[];
  selectedRoomId?: number;
  selectedDate?: Date;
  booking?: Booking;
  bookings?: Booking[];
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
}

export function BookingForm({ rooms, selectedRoomId, selectedDate, booking, bookings = [], onSubmit, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    roomId: selectedRoomId || booking?.roomId || rooms[0]?.id || 1,
    guestName: booking?.guestName || '',
    guestEmail: booking?.guestEmail || '',
    guestPhone: booking?.guestPhone || '',
    checkIn: booking?.checkIn ? booking.checkIn.toISOString().split('T')[0] : 
             selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    checkOut: booking?.checkOut ? booking.checkOut.toISOString().split('T')[0] : '',
    guests: booking?.guests || 1,
    notes: booking?.notes || '',
    totalPrice: booking?.totalPrice || 0,
  });
  
  const [autoAssign, setAutoAssign] = useState(!selectedRoomId && !booking);
  const [assignmentSuggestion, setAssignmentSuggestion] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof BookingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Aggiorna automaticamente la camera se l'assegnazione automatica è attiva
    if (autoAssign && (field === 'guests' || field === 'checkIn' || field === 'checkOut')) {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.checkIn && updatedData.checkOut && updatedData.guests) {
        const result = findOptimalRoom(
          updatedData.guests,
          new Date(updatedData.checkIn),
          new Date(updatedData.checkOut),
          rooms,
          bookings
        );
        
        if (result.roomId) {
          setFormData(prev => ({ ...prev, roomId: result.roomId! }));
          setAssignmentSuggestion(result.reason);
        } else {
          setAssignmentSuggestion(result.reason);
        }
      }
    }
  };

  const handleAutoAssignToggle = (enabled: boolean) => {
    setAutoAssign(enabled);
    if (enabled && formData.checkIn && formData.checkOut && formData.guests) {
      const result = findOptimalRoom(
        formData.guests,
        new Date(formData.checkIn),
        new Date(formData.checkOut),
        rooms,
        bookings
      );
      
      if (result.roomId) {
        setFormData(prev => ({ ...prev, roomId: result.roomId! }));
        setAssignmentSuggestion(result.reason);
      } else {
        setAssignmentSuggestion(result.reason);
      }
    } else {
      setAssignmentSuggestion('');
    }
  };

  const availableRooms = rooms.filter(room => 
    room.status === 'available' || room.id === formData.roomId
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            {booking ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!booking && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Assegnazione Automatica Camera
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    L'algoritmo sceglierà automaticamente la camera ottimale
                  </p>
                </div>
                <Switch
                  checked={autoAssign}
                  onCheckedChange={handleAutoAssignToggle}
                />
              </div>
              {assignmentSuggestion && (
                <Alert>
                  <AlertDescription className="text-sm">
                    {assignmentSuggestion}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Camera</Label>
              <Select
                value={formData.roomId.toString()}
                onValueChange={(value) => handleInputChange('roomId', parseInt(value))}
                disabled={autoAssign}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona camera" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name} - {room.type} ({room.capacity} posti)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">Numero Ospiti</Label>
              <Select
                value={formData.guests.toString()}
                onValueChange={(value) => handleInputChange('guests', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'ospite' : 'ospiti'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName">Nome Ospite</Label>
            <Input
              id="guestName"
              value={formData.guestName}
              onChange={(e) => handleInputChange('guestName', e.target.value)}
              placeholder="Nome e cognome"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                placeholder="email@esempio.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Telefono</Label>
              <Input
                id="guestPhone"
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                placeholder="+39 123 456 7890"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalPrice">Prezzo Totale (€)</Label>
            <Input
              id="totalPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalPrice}
              onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note (opzionale)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Note aggiuntive sulla prenotazione..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {booking ? 'Aggiorna Prenotazione' : 'Crea Prenotazione'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}