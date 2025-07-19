import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Save, PlusCircle, Trash2, DollarSign, Info } from "lucide-react";
import { BookingFormData, Room, Booking, BookedRoom, TouristTaxExemption } from "@/types/booking";
import { calculateQuote, calculateTouristTax } from "@/utils/pricing";

interface BookingFormProps {
  rooms: Room[];
  booking?: Booking;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
}

const EXEMPTION_OPTIONS: { id: TouristTaxExemption; label: string }[] = [
    { id: "minore", label: "Minore di 12 anni" },
    { id: "disabile", label: "Disabile" },
    { id: "accompagnatore_disabile", label: "Accompagnatore disabile" },
    { id: "autista", label: "Autista/Accompagnatore gruppo" },
    { id: "forze_ordine", label: "Forze dell'ordine in servizio" },
    { id: "sanitari", label: "Motivi sanitari" },
    { id: "residente", label: "Residente a San Giovanni Rotondo" },
    { id: "aire", label: "Iscritto AIRE" },
];

export function BookingForm({ rooms, booking, onSubmit, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    guestName: booking?.guestName || '',
    guestEmail: booking?.guestEmail || '',
    guestPhone: booking?.guestPhone || '',
    checkIn: booking?.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : '',
    checkOut: booking?.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : '',
    notes: booking?.notes || '',
    source: booking?.source || 'private',
    rooms: booking?.rooms || [{ roomId: rooms[0]?.id || 1, guests: 1 }],
    touristTaxExemptions: booking?.touristTaxExemptions || [],
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [touristTax, setTouristTax] = useState(0);

  useEffect(() => {
    const quote = calculateQuote(formData.rooms, new Date(formData.checkIn), new Date(formData.checkOut));
    const tax = calculateTouristTax(formData);
    setTotalPrice(quote);
    setTouristTax(tax);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, totalPrice: totalPrice + touristTax });
  };

  const handleRoomChange = (index: number, field: keyof BookedRoom, value: number) => {
    const newRooms = [...formData.rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setFormData(prev => ({ ...prev, rooms: newRooms }));
  };

  const addRoom = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, { roomId: rooms[1]?.id || 2, guests: 1 }]
    }));
  };

  const removeRoom = (index: number) => {
    const newRooms = formData.rooms.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, rooms: newRooms }));
  };

  const handleExemptionChange = (exemptionId: TouristTaxExemption, checked: boolean) => {
    setFormData(prev => ({
        ...prev,
        touristTaxExemptions: checked
            ? [...(prev.touristTaxExemptions || []), exemptionId]
            : (prev.touristTaxExemptions || []).filter(id => id !== exemptionId)
    }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{booking ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Camere</Label>
            {formData.rooms.map((room, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Select value={room.roomId.toString()} onValueChange={(v) => handleRoomChange(index, 'roomId', parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={room.guests.toString()} onValueChange={(v) => handleRoomChange(index, 'guests', parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 4 }, (_, i) => i + 1).map(n => <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'ospite' : 'ospiti'}</SelectItem>)}</SelectContent>
                </Select>
                {formData.rooms.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeRoom(index)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRoom}><PlusCircle className="h-4 w-4 mr-2" />Aggiungi Camera</Button>
          </div>

          {/* Check-in/Check-out */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ... existing check-in/out inputs ... */}
          </div>

          {/* Guest Info */}
          <div className="space-y-4">
            {/* ... existing guest inputs, email is not required ... */}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label>Fonte Prenotazione</Label>
            <Select value={formData.source} onValueChange={(v) => setFormData(p => ({...p, source: v as 'private' | 'booking.com'}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="private">Privato</SelectItem>
                    <SelectItem value="booking.com">Booking.com</SelectItem>
                </SelectContent>
            </Select>
          </div>

          {/* Tourist Tax Exemptions */}
          <div className="space-y-3">
            <Label className="font-semibold">Esenzioni Tassa di Soggiorno</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EXEMPTION_OPTIONS.map(opt => (
                    <div key={opt.id} className="flex items-center gap-2">
                        <Checkbox id={opt.id} checked={formData.touristTaxExemptions?.includes(opt.id)} onCheckedChange={(c) => handleExemptionChange(opt.id, !!c)} />
                        <Label htmlFor={opt.id} className="text-sm font-normal">{opt.label}</Label>
                    </div>
                ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
            <div className="flex justify-between items-center font-medium">
                <span>Preventivo Soggiorno</span>
                <span>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Tassa di Soggiorno</span>
                <span>{touristTax.toFixed(2)} €</span>
            </div>
            <hr />
            <div className="flex justify-between items-center text-lg font-bold">
                <span>Totale</span>
                <span>{(totalPrice + touristTax).toFixed(2)} €</span>
            </div>
          </div>

          {/* Notes & Submit */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1"><Save className="h-4 w-4 mr-2" />Salva Prenotazione</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Annulla</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}