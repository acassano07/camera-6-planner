import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Save, Sparkles, Plus } from "lucide-react";
import { BookingFormData, Room, Booking } from "@/types/booking";
import { findOptimalRoom } from "@/utils/roomAssignment";
import { findOptimalRoomAdvanced } from "@/utils/advancedRoomAssignment";
import { calculateTouristTax, calculatePrice } from "@/utils/pricing";

interface BookingFormProps {
  rooms: Room[];
  selectedRoomId?: number;
  selectedDate?: Date;
  booking?: Booking;
  bookings?: Booking[];
  onSubmit: (data: BookingFormData[]) => void;
  onCancel: () => void;
}

export function BookingForm({ rooms, selectedRoomId, selectedDate, booking, bookings = [], onSubmit, onCancel }: BookingFormProps) {
  const [multiRoomMode, setMultiRoomMode] = useState(false);
  const [bookingRooms, setBookingRooms] = useState<BookingFormData[]>([
    {
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
      clientType: booking?.clientType || 'private',
      touristTax: booking?.touristTax || 0,
      touristTaxExemptions: booking?.touristTaxExemptions || [],
      childrenUnder12: booking?.childrenUnder12 || [],
      lockedRoom: booking?.lockedRoom || false,
    }
  ]);
  
  const [autoAssign, setAutoAssign] = useState(!selectedRoomId && !booking);
  const [assignmentSuggestion, setAssignmentSuggestion] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(booking ? [bookingRooms[0]] : bookingRooms);
  };

  const addRoom = () => {
    const firstRoom = bookingRooms[0];
    setBookingRooms(prev => [...prev, {
      roomId: rooms[0]?.id || 1,
      guestName: firstRoom.guestName,
      guestEmail: firstRoom.guestEmail,
      guestPhone: firstRoom.guestPhone,
      checkIn: firstRoom.checkIn,
      checkOut: firstRoom.checkOut,
      guests: 1,
      notes: '',
      totalPrice: 0,
      clientType: firstRoom.clientType,
      touristTax: 0,
      touristTaxExemptions: [],
      childrenUnder12: [],
      lockedRoom: false,
    }]);
  };

  const removeRoom = (index: number) => {
    if (bookingRooms.length > 1) {
      setBookingRooms(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleInputChange = (roomIndex: number, field: keyof BookingFormData, value: string | number | boolean[] | boolean) => {
    setBookingRooms(prev => {
      const updated = [...prev];
      updated[roomIndex] = { ...updated[roomIndex], [field]: value };
      
      // Aggiorna automaticamente prezzi e tasse
      if (field === 'guests' || field === 'checkIn' || field === 'checkOut' || field === 'clientType') {
        const roomData = updated[roomIndex];
        
        // Calcola prezzo automatico
        if (roomData.guests && roomData.clientType) {
          const price = calculatePrice(roomData.guests, roomData.clientType);
          roomData.totalPrice = price;
        }
        
        // Calcola tassa di soggiorno
        if (roomData.checkIn && roomData.checkOut && roomData.guests) {
          const tax = calculateTouristTax(
            roomData.guests,
            new Date(roomData.checkIn),
            new Date(roomData.checkOut),
            roomData.touristTaxExemptions,
            roomData.childrenUnder12
          );
          roomData.touristTax = tax;
          
          // Inizializza esenzioni se non presenti
          if (roomData.touristTaxExemptions.length !== roomData.guests) {
            roomData.touristTaxExemptions = Array(roomData.guests).fill(false);
          }
          if (roomData.childrenUnder12.length !== roomData.guests) {
            roomData.childrenUnder12 = Array(roomData.guests).fill(false);
          }
        }
      }

      // Auto assign per la prima camera
      if (roomIndex === 0 && autoAssign && !updated[roomIndex].lockedRoom && (field === 'guests' || field === 'checkIn' || field === 'checkOut')) {
        const currentRoomData = updated[roomIndex];
        if (currentRoomData.checkIn && currentRoomData.checkOut && currentRoomData.guests) {
          const result = findOptimalRoomAdvanced(
            currentRoomData.guests,
            new Date(currentRoomData.checkIn),
            new Date(currentRoomData.checkOut),
            rooms,
            bookings,
            [], // closures
            false, // allowRoomMoves
            currentRoomData.lockedRoom ? currentRoomData.roomId : undefined
          );
          
          if (result.roomId) {
            currentRoomData.roomId = result.roomId;
            setAssignmentSuggestion(result.reason);
          } else {
            setAssignmentSuggestion(result.reason);
          }
        }
      }
      
      return updated;
    });
  };

  const handleAutoAssignToggle = (enabled: boolean) => {
    setAutoAssign(enabled);
    const firstRoom = bookingRooms[0];
    if (enabled && firstRoom.checkIn && firstRoom.checkOut && firstRoom.guests) {
      const result = findOptimalRoom(
        firstRoom.guests,
        new Date(firstRoom.checkIn),
        new Date(firstRoom.checkOut),
        rooms,
        bookings
      );
      
      if (result.roomId) {
        handleInputChange(0, 'roomId', result.roomId);
        setAssignmentSuggestion(result.reason);
      } else {
        setAssignmentSuggestion(result.reason);
      }
    } else {
      setAssignmentSuggestion('');
    }
  };

  const getAvailableRooms = (roomIndex: number) => {
    const currentRoom = bookingRooms[roomIndex];
    return rooms.filter(room => 
      room.status === 'available' || room.id === currentRoom.roomId
    );
  };

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {!booking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Prenotazione multipla</Label>
                  <p className="text-sm text-muted-foreground">
                    Prenota più camere con gli stessi dati cliente
                  </p>
                </div>
                <Switch
                  checked={multiRoomMode}
                  onCheckedChange={setMultiRoomMode}
                />
              </div>
              
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
            </div>
          )}

          {/* Dati comuni */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dati Cliente</h3>
            
            <div className="space-y-2">
              <Label htmlFor="guestName">Nome Ospite</Label>
              <Input
                id="guestName"
                value={bookingRooms[0]?.guestName || ''}
                onChange={(e) => {
                  // Aggiorna il nome in tutte le camere
                  bookingRooms.forEach((_, index) => {
                    handleInputChange(index, 'guestName', e.target.value);
                  });
                }}
                placeholder="Nome e cognome"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email (opzionale)</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={bookingRooms[0]?.guestEmail || ''}
                  onChange={(e) => {
                    // Aggiorna l'email in tutte le camere
                    bookingRooms.forEach((_, index) => {
                      handleInputChange(index, 'guestEmail', e.target.value);
                    });
                  }}
                  placeholder="email@esempio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestPhone">Telefono</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={bookingRooms[0]?.guestPhone || ''}
                  onChange={(e) => {
                    // Aggiorna il telefono in tutte le camere
                    bookingRooms.forEach((_, index) => {
                      handleInputChange(index, 'guestPhone', e.target.value);
                    });
                  }}
                  placeholder="+39 123 456 7890"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={bookingRooms[0]?.checkIn || ''}
                  onChange={(e) => {
                    // Aggiorna check-in in tutte le camere
                    bookingRooms.forEach((_, index) => {
                      handleInputChange(index, 'checkIn', e.target.value);
                    });
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={bookingRooms[0]?.checkOut || ''}
                  onChange={(e) => {
                    // Aggiorna check-out in tutte le camere
                    bookingRooms.forEach((_, index) => {
                      handleInputChange(index, 'checkOut', e.target.value);
                    });
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientType">Tipo Cliente</Label>
              <Select
                value={bookingRooms[0]?.clientType || 'private'}
                onValueChange={(value: 'private' | 'booking') => {
                  // Aggiorna tipo cliente in tutte le camere
                  bookingRooms.forEach((_, index) => {
                    handleInputChange(index, 'clientType', value);
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privato</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Camere */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Camere</h3>
              {multiRoomMode && (
                <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Camera
                </Button>
              )}
            </div>

            {bookingRooms.map((roomData, roomIndex) => (
              <Card key={roomIndex} className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Camera {roomIndex + 1}</h4>
                  {multiRoomMode && bookingRooms.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoom(roomIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Camera</Label>
                    <div className="space-y-2">
                      <Select
                        value={roomData.roomId.toString()}
                        onValueChange={(value) => handleInputChange(roomIndex, 'roomId', parseInt(value))}
                        disabled={roomIndex === 0 && autoAssign && !roomData.lockedRoom}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona camera" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRooms(roomIndex).map((room) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {room.name} - {room.type} ({room.capacity} posti)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={roomData.lockedRoom || false}
                          onCheckedChange={(checked) => {
                            handleInputChange(roomIndex, 'lockedRoom', checked);
                            if (checked && roomIndex === 0) {
                              setAutoAssign(false);
                            }
                          }}
                        />
                        <Label className="text-xs">Blocca camera</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Numero Ospiti</Label>
                    <Select
                      value={roomData.guests.toString()}
                      onValueChange={(value) => handleInputChange(roomIndex, 'guests', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'ospite' : 'ospiti'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {roomData.clientType === 'private' ? 'Prezzo Totale (€)' : 'Prezzo (gestito da Booking)'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={roomData.totalPrice}
                    onChange={(e) => handleInputChange(roomIndex, 'totalPrice', parseFloat(e.target.value))}
                    placeholder="0.00"
                    disabled={roomData.clientType === 'booking'}
                    required={roomData.clientType === 'private'}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Tassa di Soggiorno: €{roomData.touristTax.toFixed(2)}</Label>
                    <span className="text-sm text-muted-foreground">
                      {roomData.checkIn && (new Date(roomData.checkIn).getMonth() + 1 >= 5 && new Date(roomData.checkIn).getMonth() + 1 <= 12) ? '2€' : '1.50€'} per persona/notte
                    </span>
                  </div>
                  
                  {roomData.guests > 0 && (
                    <div className="space-y-3">
                      <Label>Gestione Ospiti</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {Array.from({ length: roomData.guests }, (_, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                            <span className="text-sm font-medium">Ospite {i + 1}</span>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={roomData.childrenUnder12[i] || false}
                                  onCheckedChange={(checked) => {
                                    const newChildren = [...roomData.childrenUnder12];
                                    newChildren[i] = checked;
                                    handleInputChange(roomIndex, 'childrenUnder12', newChildren);
                                  }}
                                />
                                <Label className="text-xs">Under 12</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={roomData.touristTaxExemptions[i] || false}
                                  onCheckedChange={(checked) => {
                                    const newExemptions = [...roomData.touristTaxExemptions];
                                    newExemptions[i] = checked;
                                    handleInputChange(roomIndex, 'touristTaxExemptions', newExemptions);
                                  }}
                                />
                                <Label className="text-xs">Esenzione Manuale</Label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Note per questa camera (opzionale)</Label>
                  <Textarea
                    value={roomData.notes}
                    onChange={(e) => handleInputChange(roomIndex, 'notes', e.target.value)}
                    placeholder="Note aggiuntive per questa camera..."
                    rows={2}
                  />
                </div>
              </Card>
            ))}
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
