import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Hotel, Calendar, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { CalendarView } from "@/components/Calendar";
import { Room, Booking, BookingFormData } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { BookingCard } from "@/components/BookingCard";
import { useMobile } from "@/hooks/use-mobile";

const initialRooms: Room[] = [
    { id: 1, name: "Camera 1", type: "matrimoniale", capacity: 2, status: "available" },
    { id: 2, name: "Camera 2", type: "singola", capacity: 1, status: "available" },
    { id: 3, name: "Camera 3", type: "tripla", capacity: 3, status: "available" },
    { id: 4, name: "Camera 4", type: "matrimoniale", capacity: 2, status: "available" },
    { id: 5, name: "Camera 5", type: "quadrupla", capacity: 4, status: "available" },
    { id: 6, name: "Camera 6", type: "tripla", capacity: 3, status: "available" },
];

const Index = () => {
  const [rooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("calendar");

  const handleAddBooking = (date?: Date) => {
    setEditingBooking(undefined);
    setShowBookingForm(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = (data: BookingFormData) => {
    // Logic to save booking (create or update)
    setShowBookingForm(false);
  };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const todaysBookings = useMemo(() => bookings.filter(b => new Date(b.checkIn) <= today && new Date(b.checkOut) > today), [bookings]);
  const tomorrowsBookings = useMemo(() => bookings.filter(b => new Date(b.checkIn).toDateString() === tomorrow.toDateString()), [bookings]);

  if (showBookingForm) {
    return (
      <div className="p-4"><BookingForm rooms={rooms} booking={editingBooking} onSubmit={handleSubmitBooking} onCancel={() => setShowBookingForm(false)} /></div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Hotel /> Gestionale</h1>
        <Button onClick={() => handleAddBooking()}><Plus className="h-4 w-4 mr-2" /> Nuova Prenotazione</Button>
      </header>

      {isMobile ? (
        <div className="overflow-x-hidden">
            <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${activeTab === 'calendar' ? 0 : 100}%)` }}>
                <div className="w-full flex-shrink-0 p-4"> <CalendarView bookings={bookings} rooms={rooms} onAddBooking={handleAddBooking} onEditBooking={handleEditBooking} /> </div>
                <div className="w-full flex-shrink-0 p-4"> {/* Today/Tomorrow View */} </div>
            </div>
            <div className="flex justify-center p-2"> <Button onClick={() => setActiveTab(activeTab === 'calendar' ? 'today' : 'calendar')}>Cambia Vista</Button> </div>
        </div>
      ) : (
        <Tabs defaultValue="calendar" className="p-4">
          <TabsList><TabsTrigger value="calendar">Calendario</TabsTrigger><TabsTrigger value="today">Oggi & Domani</TabsTrigger></TabsList>
          <TabsContent value="calendar"><CalendarView bookings={bookings} rooms={rooms} onAddBooking={handleAddBooking} onEditBooking={handleEditBooking} /></TabsContent>
          <TabsContent value="today">
            <div>
              <h2 className="text-xl font-semibold mb-3">Ospiti di Oggi</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todaysBookings.length > 0 ? todaysBookings.map(b => <BookingCard key={b.id} booking={b} roomName={rooms.find(r=>r.id === b.rooms[0].roomId)?.name || ''} />) : <p>Nessun ospite oggi.</p>}
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-500">In Arrivo Domani</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-70">
                {tomorrowsBookings.length > 0 ? tomorrowsBookings.map(b => <BookingCard key={b.id} booking={b} roomName={rooms.find(r=>r.id === b.rooms[0].roomId)?.name || ''} />) : <p>Nessun arrivo previsto per domani.</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Index;