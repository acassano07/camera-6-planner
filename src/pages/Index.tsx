import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Hotel, Calendar, Users, TrendingUp } from "lucide-react";
import { RoomCard } from "@/components/RoomCard";
import { BookingCard } from "@/components/BookingCard";
import { BookingForm } from "@/components/BookingForm";
import { Calendar as CalendarView } from "@/components/Calendar";
import { RoomOptimizer } from "@/components/RoomOptimizer";
import { Room, Booking, BookingFormData } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { findOptimalRoom, getOccupancyStats } from "@/utils/roomAssignment";
import { BookingMove } from "@/utils/advancedRoomAssignment";

const initialRooms: Room[] = [
  { id: 1, name: "Camera 1", type: "Camera Tripla", capacity: 3, status: "available" },
  { id: 2, name: "Camera 2", type: "Camera Tripla", capacity: 3, status: "available" },
  { id: 3, name: "Camera 3", type: "Camera Familiare", capacity: 4, status: "available" },
  { id: 4, name: "Camera 4", type: "Camera Matrimoniale", capacity: 2, status: "available" },
  { id: 5, name: "Camera 5", type: "Camera Familiare", capacity: 4, status: "available" },
  { id: 6, name: "Camera 6", type: "Camera Tripla", capacity: 3, status: "available" },
];

const Index = () => {
  const [rooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const handleAddBooking = (roomId?: number, date?: Date) => {
    setSelectedRoomId(roomId);
    setSelectedDate(date);
    setEditingBooking(undefined);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setSelectedRoomId(undefined);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = (data: BookingFormData[]) => {
    if (editingBooking) {
      // Update existing booking
      const singleData = data[0];
      setBookings(prev => prev.map(booking => 
        booking.id === editingBooking.id
          ? {
              ...booking,
              ...singleData,
              checkIn: new Date(singleData.checkIn),
              checkOut: new Date(singleData.checkOut),
            }
          : booking
      ));
      toast({
        title: "Prenotazione aggiornata",
        description: `La prenotazione di ${singleData.guestName} è stata aggiornata con successo.`,
      });
    } else {
      // Create new bookings (multiple rooms)
      const newBookings: Booking[] = data.map((roomData, index) => ({
        id: `${Date.now()}-${index}`,
        ...roomData,
        checkIn: new Date(roomData.checkIn),
        checkOut: new Date(roomData.checkOut),
        status: 'confirmed',
        createdAt: new Date(),
        guestEmail: roomData.guestEmail || undefined,
        childrenUnder12: roomData.childrenUnder12 || [],
        hasArrived: false,
      }));
      
      setBookings(prev => [...prev, ...newBookings]);
      
      // Salva nel CSV
      saveBookingsToCSV([...bookings, ...newBookings]);
      
      toast({
        title: "Prenotazione creata",
        description: `${data.length > 1 ? `${data.length} prenotazioni` : 'Nuova prenotazione'} per ${data[0].guestName} ${data.length > 1 ? 'create' : 'creata'} con successo.`,
      });
    }
    setShowBookingForm(false);
    setSelectedRoomId(undefined);
    setSelectedDate(undefined);
    setEditingBooking(undefined);
  };

  // Funzioni per persistenza CSV
  const saveBookingsToCSV = (bookingsData: Booking[]) => {
    const csvHeader = 'ID,Nome,Email,Telefono,Camera,Ospiti,CheckIn,CheckOut,Prezzo,TipoCliente,TassaSoggiorno,Note,Status,DataCreazione,Arrivato\n';
    const csvData = bookingsData.map(booking => 
      `${booking.id},"${booking.guestName}","${booking.guestEmail || ''}","${booking.guestPhone}",${booking.roomId},${booking.guests},"${booking.checkIn.toISOString()}","${booking.checkOut.toISOString()}",${booking.totalPrice},"${booking.clientType}",${booking.touristTax},"${booking.notes || ''}","${booking.status}","${booking.createdAt.toISOString()}",${booking.hasArrived}`
    ).join('\n');
    
    localStorage.setItem('bookings_csv', csvHeader + csvData);
  };

  const loadBookingsFromCSV = (): Booking[] => {
    const csvData = localStorage.getItem('bookings_csv');
    if (!csvData) return [];
    
    const lines = csvData.split('\n');
    const bookings: Booking[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.match(/(".*?"|[^,]+)/g) || [];
      if (values.length >= 15) {
        bookings.push({
          id: values[0],
          guestName: values[1].replace(/"/g, ''),
          guestEmail: values[2].replace(/"/g, '') || undefined,
          guestPhone: values[3].replace(/"/g, ''),
          roomId: parseInt(values[4]),
          guests: parseInt(values[5]),
          checkIn: new Date(values[6].replace(/"/g, '')),
          checkOut: new Date(values[7].replace(/"/g, '')),
          totalPrice: parseFloat(values[8]),
          clientType: values[9].replace(/"/g, '') as 'private' | 'booking',
          touristTax: parseFloat(values[10]),
          notes: values[11].replace(/"/g, '') || undefined,
          status: values[12].replace(/"/g, '') as 'confirmed' | 'pending' | 'cancelled',
          createdAt: new Date(values[13].replace(/"/g, '')),
          hasArrived: values[14] === 'true',
          touristTaxExemptions: [],
          childrenUnder12: [],
        });
      }
    }
    
    return bookings;
  };

  // Carica prenotazioni al mount
  useState(() => {
    const savedBookings = loadBookingsFromCSV();
    if (savedBookings.length > 0) {
      setBookings(savedBookings);
    }
  })[0];

  const handleDeleteBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    toast({
      title: "Prenotazione cancellata",
      description: `La prenotazione di ${booking?.guestName} è stata cancellata.`,
      variant: "destructive",
    });
  };

  const handleApplyOptimization = (moves: BookingMove[]) => {
    const updatedBookings = [...bookings];
    
    moves.forEach(move => {
      const bookingIndex = updatedBookings.findIndex(b => b.id === move.bookingId);
      if (bookingIndex !== -1) {
        updatedBookings[bookingIndex] = {
          ...updatedBookings[bookingIndex],
          roomId: move.toRoomId
        };
      }
    });
    
    setBookings(updatedBookings);
    toast({
      title: "Ottimizzazione applicata",
      description: `${moves.length} prenotazioni sono state spostate per ottimizzare l'occupazione.`,
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
            selectedDate={selectedDate}
            booking={editingBooking}
            bookings={bookings}
            onSubmit={handleSubmitBooking}
            onCancel={() => {
              setShowBookingForm(false);
              setSelectedRoomId(undefined);
              setSelectedDate(undefined);
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
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="rooms">Camere</TabsTrigger>
            <TabsTrigger value="settings">Impostazioni</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            <RoomOptimizer 
              rooms={rooms}
              bookings={bookings}
              onApplyMoves={handleApplyOptimization}
            />
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Occupazione Camere - Oggi</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const todayBookings = bookings.filter(booking => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  return booking.roomId === room.id &&
                         booking.status === 'confirmed' &&
                         booking.checkIn <= tomorrow &&
                         booking.checkOut >= today;
                });
                
                return (
                  <Card key={room.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{room.name}</h4>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          todayBookings.length > 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {todayBookings.length > 0 ? 'Occupata' : 'Libera'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {room.type} - {room.capacity} posti
                      </div>
                      
                      {todayBookings.length > 0 && (
                        <div className="space-y-2">
                          {todayBookings.map(booking => (
                            <div key={booking.id} className="p-2 bg-muted/50 rounded text-sm">
                              <div className="font-medium">{booking.guestName}</div>
                              <div className="text-muted-foreground">
                                {booking.guests} ospiti - {booking.clientType === 'private' ? 'Privato' : 'Booking.com'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {booking.checkIn.toLocaleDateString()} - {booking.checkOut.toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView
              bookings={bookings}
              rooms={rooms}
              onAddBooking={(date) => handleAddBooking(undefined, date)}
              onEditBooking={handleEditBooking}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostazioni Prezzi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Prezzo matrimoniale (2 adulti)</Label>
                    <Input type="number" placeholder="45" />
                  </div>
                  <div>
                    <Label>Prezzo terzo adulto</Label>
                    <Input type="number" placeholder="19" />
                  </div>
                  <div>
                    <Label>Prezzo quarto adulto</Label>
                    <Input type="number" placeholder="15" />
                  </div>
                  <div>
                    <Label>Prezzo bambini (sotto 12 anni)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <Button>Salva Impostazioni</Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Index;
