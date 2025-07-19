import { Booking } from "@/types/booking";

/**
 * Genera una stringa in formato CSV per l'esportazione PayTourist.
 * NOTA: Questa è una versione semplificata basata sui dati disponibili.
 * Sarà necessario integrare i dati anagrafici completi degli ospiti.
 */
export function generatePayTouristCsv(bookings: Booking[]): string {
  const headers = [
    "ID Scheda",
    "Tipo Arrivo",
    "Data Arrivo",
    "Notti",
    "Camere",
    "Tassa Soggiorno",
    "Cognome Nome Intestatario",
    "Sesso",
    "Data Nascita",
    "Luogo Nascita",
    "Nazionalita",
    "Luogo Residenza",
    "Tipo Documento",
    "Numero Documento",
    "Luogo Rilascio Documento",
    "Altri Ospiti"
  ];

  const rows = bookings.map(booking => {
    const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24));
    const rooms = booking.rooms.map(r => `Camera ${r.roomId}`).join(', ');
    
    // Dati placeholder - da sostituire con dati reali
    const guestData = {
        sex: 'N/D',
        birthDate: 'N/D',
        birthPlace: 'N/D',
        nationality: 'N/D',
        residence: 'N/D',
        docType: 'N/D',
        docNumber: 'N/D',
        docIssuePlace: 'N/D',
    };

    const row = [
      booking.id,
      booking.source,
      new Date(booking.checkIn).toLocaleDateString('it-IT'),
      nights,
      rooms,
      booking.totalPrice, // Assumendo che totalPrice includa la tassa
      booking.guestName,
      guestData.sex,
      guestData.birthDate,
      guestData.birthPlace,
      guestData.nationality,
      guestData.residence,
      guestData.docType,
      guestData.docNumber,
      guestData.docIssuePlace,
      "N/D" // Placeholder per altri ospiti
    ];

    return row.join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}