import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Hotel, Calendar, Users, TrendingUp } from "lucide-react";
import { RoomCard } from "@/components/RoomCard";
import { BookingCard } from "@/components/BookingCard";
import { BookingForm } from "@/components/BookingForm";
import { Room, Booking, BookingFormData } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";

const initialRooms: Room[] = [
  { id: 1, name: "Camera Deluxe 1", type: "Camera Deluxe", status: "available" },
  { id: 2, name: "Camera Standard 2", type: "Camera Standard", status: "available" },
  { id: 3, name: "Suite Familiare 3", type: "Suite Familiare", status: "available" },
  { id: 4, name: "Camera Deluxe 4", type: "Camera Deluxe", status: "available" },
  { id: 5, name: "Camera Standard 5", type: "Camera Standard", status: "available" },
  { id: 6, name: "Suite Premium 6", type: "Suite Premium", status: "available" },
];

const Index = () => {
  const [rooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | null>(null);
  const { toast } = useToast();

  const handleAddBooking = (roomId?: number) => {
    setSelectedRoomId(roomId);
    setEditingBooking(undefined);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setSelectedRoomId(undefined);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = (data: BookingFormData) => {
    if (editingBooking) {
      // Update existing booking
      setBookings(prev => prev.map(booking => 
        booking.id === editingBooking.id
          ? {
              ...booking,
              ...data,
              checkIn: new Date(data.checkIn),
              checkOut: new Date(data.checkOut),
            }
          : booking
      ));
      toast({
        title: "Prenotazione aggiornata",
        description: `La prenotazione di ${data.guestName} è stata aggiornata con successo.`,
      });
    } else {
      // Create new booking
      const newBooking: Booking = {
        id: Date.now().toString(),
        ...data,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        status: 'confirmed',
        createdAt: new Date(),
      };
      setBookings(prev => [...prev, newBooking]);
      toast({
        title: "Prenotazione creata",
        description: `Nuova prenotazione per ${data.guestName} creata con successo.`,
      });
    }
    setShowBookingForm(false);
    setSelectedRoomId(undefined);
    setEditingBooking(undefined);
  };

  const handleDeleteBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    toast({
      title: "Prenotazione cancellata",
      description: `La prenotazione di ${booking?.guestName} è stata cancellata.`,
      variant: "destructive",
    });
  };

  const handleViewBookings = (roomId: number) => {
    setSelectedRoomFilter(roomId);
  };

  const filteredBookings = selectedRoomFilter 
    ? bookings.filter(b => b.roomId === selectedRoomFilter)
    : bookings;

  const getRoomName = (roomId: number) => {
    return rooms.find(r => r.id === roomId)?.name || `Camera ${roomId}`;
  };

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const occupiedRooms = rooms.filter(room => {
    return bookings.some(b => 
      b.roomId === room.id && 
      b.status === 'confirmed' &&
      new Date(b.checkIn) <= new Date() && 
      new Date(b.checkOut) >= new Date()
    );
  }).length;

  if (showBookingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <BookingForm
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            booking={editingBooking}
            onSubmit={handleSubmitBooking}
            onCancel={() => {
              setShowBookingForm(false);
              setSelectedRoomId(undefined);
              setEditingBooking(undefined);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Hotel className="h-8 w-8 text-primary" />
              Gestionale Affittacamere
            </h1>
            <p className="text-muted-foreground">Gestione prenotazioni per 6 camere</p>
          </div>
          <Button onClick={() => handleAddBooking()} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Prenotazione
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Camere Occupate</p>
                  <p className="text-2xl font-bold">{occupiedRooms}/6</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Prenotazioni</p>
                  <p className="text-2xl font-bold">{confirmedBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Ospiti Totali</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.guests, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Ricavi Totali</p>
                  <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms">Camere</TabsTrigger>
            <TabsTrigger value="bookings">Prenotazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  bookings={bookings}
                  onAddBooking={handleAddBooking}
                  onViewBookings={handleViewBookings}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant={selectedRoomFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRoomFilter(null)}
              >
                Tutte le Camere
              </Button>
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedRoomFilter === room.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRoomFilter(room.id)}
                >
                  {room.name}
                  <Badge variant="secondary" className="ml-2">
                    {bookings.filter(b => b.roomId === room.id && b.status === 'confirmed').length}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    roomName={getRoomName(booking.roomId)}
                    onEdit={handleEditBooking}
                    onDelete={handleDeleteBooking}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Nessuna prenotazione trovata
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedRoomFilter 
                      ? "Non ci sono prenotazioni per questa camera."
                      : "Inizia creando la tua prima prenotazione."
                    }
                  </p>
                  <Button onClick={() => handleAddBooking()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Prima Prenotazione
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
