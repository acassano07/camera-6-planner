import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function PriceSettings() {
  const [prices, setPrices] = useState({
    singleAdult: 35,
    marriageRoom: 45,
    thirdAdult: 19,
    fourthAdult: 15,
    childrenUnder12: 0
  });

  const { toast } = useToast();

  const handleSave = () => {
    // Salva nel localStorage
    localStorage.setItem('price_settings', JSON.stringify(prices));
    toast({
      title: "Impostazioni salvate",
      description: "I prezzi sono stati aggiornati con successo.",
    });
  };

  const handlePriceChange = (key: keyof typeof prices, value: string) => {
    setPrices(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  // Carica le impostazioni dal localStorage
  useState(() => {
    const savedPrices = localStorage.getItem('price_settings');
    if (savedPrices) {
      setPrices(JSON.parse(savedPrices));
    }
  })[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Prezzi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="singleAdult">Prezzo camera 1 adulto (€)</Label>
            <Input 
              id="singleAdult"
              type="number" 
              value={prices.singleAdult}
              onChange={(e) => handlePriceChange('singleAdult', e.target.value)}
              placeholder="35" 
            />
          </div>
          <div>
            <Label htmlFor="marriageRoom">Prezzo matrimoniale (2 adulti) (€)</Label>
            <Input 
              id="marriageRoom"
              type="number" 
              value={prices.marriageRoom}
              onChange={(e) => handlePriceChange('marriageRoom', e.target.value)}
              placeholder="45" 
            />
          </div>
          <div>
            <Label htmlFor="thirdAdult">Prezzo terzo adulto (€)</Label>
            <Input 
              id="thirdAdult"
              type="number" 
              value={prices.thirdAdult}
              onChange={(e) => handlePriceChange('thirdAdult', e.target.value)}
              placeholder="19" 
            />
          </div>
          <div>
            <Label htmlFor="fourthAdult">Prezzo quarto adulto (€)</Label>
            <Input 
              id="fourthAdult"
              type="number" 
              value={prices.fourthAdult}
              onChange={(e) => handlePriceChange('fourthAdult', e.target.value)}
              placeholder="15" 
            />
          </div>
          <div>
            <Label htmlFor="childrenUnder12">Prezzo bambini (sotto 12 anni) (€)</Label>
            <Input 
              id="childrenUnder12"
              type="number" 
              value={prices.childrenUnder12}
              onChange={(e) => handlePriceChange('childrenUnder12', e.target.value)}
              placeholder="0" 
            />
          </div>
        </div>
        <Button onClick={handleSave}>Salva Impostazioni</Button>
      </CardContent>
    </Card>
  );
}