import { BookingFormData, BookedRoom, TouristTaxExemption } from "@/types/booking";

// --- CALCOLO PREVENTIVO --- //

const BASE_PRICE_MATRIMONIALE = 45;
const EXTRA_GUEST_PRICE_2 = 19;
const EXTRA_GUEST_PRICE_3_PLUS = 15;

/**
 * Calcola il prezzo di una singola stanza in base al numero di ospiti.
 */
function calculateRoomPrice(guests: number): number {
  if (guests <= 0) return 0;
  if (guests === 1) return BASE_PRICE_MATRIMONIALE; // Potrebbe necessitare di un prezzo diverso per singola
  
  let price = BASE_PRICE_MATRIMONIALE;
  if (guests >= 2) {
    price += EXTRA_GUEST_PRICE_2;
  }
  if (guests >= 3) {
    price += (guests - 2) * EXTRA_GUEST_PRICE_3_PLUS;
  }
  return price;
}

/**
 * Calcola il prezzo totale della prenotazione.
 */
export function calculateQuote(rooms: BookedRoom[], checkIn: Date, checkOut: Date): number {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
  if (nights <= 0) return 0;

  const totalRoomPricePerNight = rooms.reduce((total, room) => {
    return total + calculateRoomPrice(room.guests);
  }, 0);

  return totalRoomPricePerNight * nights;
}


// --- CALCOLO TASSA DI SOGGIORNO --- //

const HIGH_SEASON_RATE = 2.00;
const LOW_SEASON_RATE = 1.50;

/**
 * Determina la tariffa della tassa di soggiorno in base al mese.
 */
function getTouristTaxRate(date: Date): number {
  const month = date.getMonth(); // 0 (Gen) - 11 (Dic)
  // Da Maggio (4) a Dicembre (11) -> Alta stagione
  if (month >= 4 && month <= 11) {
    return HIGH_SEASON_RATE;
  }
  // Da Gennaio (0) ad Aprile (3) -> Bassa stagione
  return LOW_SEASON_RATE;
}

/**
 * Calcola il numero di persone esenti dalla tassa di soggiorno.
 */
function countExemptions(exemptions: TouristTaxExemption[], totalGuests: number): number {
    let exemptCount = 0;
    const hasDisabile = exemptions.includes("disabile");

    // Logica per accompagnatori disabili (massimo 2)
    if (hasDisabile) {
        const acompagnatoriCount = exemptions.filter(e => e === "accompagnatore_disabile").length;
        exemptCount += Math.min(acompagnatoriCount, 2);
    }

    // Aggiunge le altre esenzioni (escludendo gli accompagnatori già contati)
    exemptCount += exemptions.filter(e => e !== "accompagnatore_disabile").length;

    return Math.min(exemptCount, totalGuests); // Non si possono esentare più persone degli ospiti totali
}

/**
 * Calcola l'importo totale della tassa di soggiorno per la prenotazione.
 */
export function calculateTouristTax(formData: BookingFormData): number {
  const { checkIn, checkOut, rooms, touristTaxExemptions = [] } = formData;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (!checkIn || !checkOut || checkOutDate <= checkInDate) return 0;

  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
  if (nights <= 0) return 0;

  const totalGuests = rooms.reduce((sum, room) => sum + room.guests, 0);
  if (totalGuests === 0) return 0;

  const taxRate = getTouristTaxRate(checkInDate);
  const numberOfExemptGuests = countExemptions(touristTaxExemptions, totalGuests);
  const taxableGuests = totalGuests - numberOfExemptGuests;

  if (taxableGuests <= 0) return 0;

  return taxableGuests * taxRate * nights;
}
