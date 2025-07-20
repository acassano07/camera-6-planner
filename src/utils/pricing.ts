// Utilità per calcolo prezzi e tassa di soggiorno

export interface PricingSettings {
  matrimonialPrice: number; // 2 adulti
  thirdAdultPrice: number;
  fourthAdultPrice: number;
  childPrice: number; // sotto 12 anni
}

export const defaultPricingSettings: PricingSettings = {
  matrimonialPrice: 45,
  thirdAdultPrice: 15,
  fourthAdultPrice: 15,
  childPrice: 0,
};

export function calculateTouristTax(
  guests: number,
  checkIn: Date,
  checkOut: Date,
  exemptions: boolean[] = []
): number {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const month = checkIn.getMonth() + 1; // getMonth() returns 0-11
  
  // 2€ maggio-dicembre, 1.50€ gennaio-aprile
  const ratePerPersonPerNight = (month >= 5 && month <= 12) ? 2 : 1.5;
  
  let totalTax = 0;
  for (let i = 0; i < guests; i++) {
    if (!exemptions[i]) { // se non è esente
      totalTax += ratePerPersonPerNight * nights;
    }
  }
  
  return totalTax;
}

export function calculatePrice(
  guests: number,
  clientType: 'private' | 'booking',
  settings: PricingSettings = defaultPricingSettings
): number {
  if (clientType === 'booking') {
    return 0; // Per Booking.com non calcoliamo il prezzo
  }
  
  let total = settings.matrimonialPrice; // base per 2 adulti
  
  if (guests >= 3) {
    total += settings.thirdAdultPrice;
  }
  if (guests >= 4) {
    total += settings.fourthAdultPrice;
  }
  
  return total;
}