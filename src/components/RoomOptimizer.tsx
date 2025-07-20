import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shuffle, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { Room, Booking } from "@/types/booking";
import { optimizeAllRoomAssignments, BookingMove } from "@/utils/advancedRoomAssignment";

interface RoomOptimizerProps {
  rooms: Room[];
  bookings: Booking[];
  onApplyMoves: (moves: BookingMove[]) => void;
}

export function RoomOptimizer({ rooms, bookings, onApplyMoves }: RoomOptimizerProps) {
  const [optimizationResult, setOptimizationResult] = useState<BookingMove[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    // Simula un piccolo delay per l'effetto di caricamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const moves = optimizeAllRoomAssignments(rooms, bookings);
    setOptimizationResult(moves);
    setIsOptimizing(false);
  };

  const handleApplyOptimization = () => {
    onApplyMoves(optimizationResult);
    setOptimizationResult([]);
  };

  const getRoomName = (roomId: number) => {
    return rooms.find(r => r.id === roomId)?.name || `Camera ${roomId}`;
  };

  const getBookingName = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId)?.guestName || "Prenotazione non trovata";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="h-5 w-5" />
          Ottimizzazione Automatica Camere
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Riorganizza automaticamente le prenotazioni per ottimizzare l'occupazione
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Non sposta clienti già arrivati
            </p>
          </div>
          <Button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            variant="outline"
          >
            {isOptimizing ? "Ottimizzando..." : "Analizza"}
          </Button>
        </div>

        {optimizationResult.length > 0 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Trovate {optimizationResult.length} ottimizzazioni possibili
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                />
                <Label>Mostra dettagli</Label>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptimizationResult([])}
                >
                  Annulla
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyOptimization}
                >
                  Applica Ottimizzazioni
                </Button>
              </div>
            </div>

            {showDetails && (
              <div className="space-y-2">
                {optimizationResult.map((move, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {getBookingName(move.bookingId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Da {getRoomName(move.fromRoomId)} → {getRoomName(move.toRoomId)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Ottimizzazione
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {move.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {optimizationResult.length === 0 && !isOptimizing && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nessuna ottimizzazione necessaria. Le camere sono già assegnate in modo ottimale.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}