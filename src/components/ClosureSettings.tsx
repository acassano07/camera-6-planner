import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Closure {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  isFullStructure: boolean;
  selectedRooms: number[];
}

const rooms = [
  { id: 1, name: "Camera 1" },
  { id: 2, name: "Camera 2" },
  { id: 3, name: "Camera 3" },
  { id: 4, name: "Camera 4" },
  { id: 5, name: "Camera 5" },
  { id: 6, name: "Camera 6" },
];

export function ClosureSettings() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [newClosure, setNewClosure] = useState<Partial<Closure>>({
    startDate: '',
    endDate: '',
    reason: '',
    isFullStructure: false,
    selectedRooms: []
  });

  const { toast } = useToast();

  // Carica le chiusure dal localStorage
  useState(() => {
    const savedClosures = localStorage.getItem('closures');
    if (savedClosures) {
      setClosures(JSON.parse(savedClosures));
    }
  })[0];

  const saveClosures = (updatedClosures: Closure[]) => {
    setClosures(updatedClosures);
    localStorage.setItem('closures', JSON.stringify(updatedClosures));
  };

  const addClosure = () => {
    if (!newClosure.startDate || !newClosure.endDate || !newClosure.reason) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori.",
        variant: "destructive"
      });
      return;
    }

    if (!newClosure.isFullStructure && (!newClosure.selectedRooms || newClosure.selectedRooms.length === 0)) {
      toast({
        title: "Errore",
        description: "Seleziona almeno una camera da chiudere.",
        variant: "destructive"
      });
      return;
    }

    const closure: Closure = {
      id: Date.now().toString(),
      startDate: newClosure.startDate!,
      endDate: newClosure.endDate!,
      reason: newClosure.reason!,
      isFullStructure: newClosure.isFullStructure || false,
      selectedRooms: newClosure.selectedRooms || []
    };

    const updatedClosures = [...closures, closure];
    saveClosures(updatedClosures);

    setNewClosure({
      startDate: '',
      endDate: '',
      reason: '',
      isFullStructure: false,
      selectedRooms: []
    });

    toast({
      title: "Chiusura aggiunta",
      description: `Periodo di chiusura dal ${closure.startDate} al ${closure.endDate} aggiunto.`,
    });
  };

  const removeClosure = (id: string) => {
    const updatedClosures = closures.filter(c => c.id !== id);
    saveClosures(updatedClosures);
    
    toast({
      title: "Chiusura rimossa",
      description: "Il periodo di chiusura è stato rimosso.",
    });
  };

  const toggleRoom = (roomId: number) => {
    if (newClosure.isFullStructure) return;
    
    setNewClosure(prev => ({
      ...prev,
      selectedRooms: prev.selectedRooms?.includes(roomId)
        ? prev.selectedRooms.filter(id => id !== roomId)
        : [...(prev.selectedRooms || []), roomId]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Chiusure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form per nuova chiusura */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Aggiungi Periodo di Chiusura</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inizio</Label>
              <Input
                id="startDate"
                type="date"
                value={newClosure.startDate}
                onChange={(e) => setNewClosure(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Fine</Label>
              <Input
                id="endDate"
                type="date"
                value={newClosure.endDate}
                onChange={(e) => setNewClosure(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motivo Chiusura</Label>
            <Textarea
              id="reason"
              value={newClosure.reason}
              onChange={(e) => setNewClosure(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Es. Manutenzione, ristrutturazione, ferie..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Chiusura Intera Struttura</Label>
                <p className="text-sm text-muted-foreground">
                  Chiude tutte le camere per il periodo selezionato
                </p>
              </div>
              <Switch
                checked={newClosure.isFullStructure}
                onCheckedChange={(checked) => setNewClosure(prev => ({ 
                  ...prev, 
                  isFullStructure: checked,
                  selectedRooms: checked ? [] : prev.selectedRooms
                }))}
              />
            </div>

            {!newClosure.isFullStructure && (
              <div>
                <Label>Camere da Chiudere</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {rooms.map(room => (
                    <div
                      key={room.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        newClosure.selectedRooms?.includes(room.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                      onClick={() => toggleRoom(room.id)}
                    >
                      <div className="text-center text-sm font-medium">
                        {room.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button onClick={addClosure}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Chiusura
          </Button>
        </div>

        {/* Lista chiusure esistenti */}
        {closures.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Chiusure Programmate</h3>
            <div className="space-y-3">
              {closures.map(closure => (
                <Card key={closure.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={closure.isFullStructure ? 'destructive' : 'secondary'}>
                          {closure.isFullStructure ? 'Intera Struttura' : 'Camere Specifiche'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {closure.startDate} - {closure.endDate}
                        </span>
                      </div>
                      
                      <p className="text-sm">{closure.reason}</p>
                      
                      {!closure.isFullStructure && closure.selectedRooms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {closure.selectedRooms.map(roomId => {
                            const room = rooms.find(r => r.id === roomId);
                            return (
                              <Badge key={roomId} variant="outline" className="text-xs">
                                {room?.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeClosure(closure.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}