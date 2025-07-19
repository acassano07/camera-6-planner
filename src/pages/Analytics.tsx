import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, BarChart, Download } from "lucide-react";
import { Booking } from "@/types/booking";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generatePayTouristCsv } from "@/utils/export";
import { useMemo } from "react";

interface AnalyticsProps {
  bookings: Booking[];
}

const Analytics = ({ bookings }: AnalyticsProps) => {
  const confirmedBookings = useMemo(() => bookings.filter(b => b.status === 'confirmed'), [bookings]);

  const totalRevenue = useMemo(() => confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0), [confirmedBookings]);
  const totalGuests = useMemo(() => confirmedBookings.reduce((sum, b) => sum + b.rooms.reduce((s, r) => s + r.guests, 0), 0), [confirmedBookings]);

  const monthlyRevenue = useMemo(() => {
    const data: { [key: string]: number } = {};
    confirmedBookings.forEach(b => {
        const month = new Date(b.checkIn).toLocaleString('default', { month: 'short' });
        data[month] = (data[month] || 0) + b.totalPrice;
    });
    return Object.keys(data).map(month => ({ name: month, Ricavi: data[month] }));
  }, [confirmedBookings]);

  const handleExport = () => {
    const csvData = generatePayTouristCsv(confirmedBookings);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "paytourist_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <Button onClick={handleExport}><Download className="h-4 w-4 mr-2"/> Esporta per PayTourist</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Ospiti Totali</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{totalGuests}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp /> Ricavi Totali</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">€{totalRevenue.toFixed(2)}</p></CardContent>
            </Card>
        </div>
        <div className="mt-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart /> Entrate per Mese</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="Ricavi" fill="#8884d8" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default Analytics;