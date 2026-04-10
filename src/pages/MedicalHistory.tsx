import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Timer, Calendar, MapPin, Stethoscope, Clock, FileText,
  Pill, Activity, HeartPulse, Syringe, ClipboardList,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const mockMedicalHistory = [
  { id: 1, date: "2026-03-15", clinic: "City General Hospital", department: "Cardiology", doctor: "Dr. Nkosi", diagnosis: "Hypertension Stage 1", prescription: "Amlodipine 5mg daily", notes: "Follow-up in 3 months" },
  { id: 2, date: "2026-02-20", clinic: "Greenwood Community Clinic", department: "General Practice", doctor: "Dr. Patel", diagnosis: "Upper respiratory infection", prescription: "Amoxicillin 500mg x7 days", notes: "Rest and hydration advised" },
  { id: 3, date: "2026-01-10", clinic: "Riverside Health Center", department: "Dermatology", doctor: "Dr. Moyo", diagnosis: "Eczema", prescription: "Hydrocortisone cream 1%", notes: "Avoid irritants, moisturize regularly" },
  { id: 4, date: "2025-11-05", clinic: "Sunrise Medical Practice", department: "Orthopedics", doctor: "Dr. Van Wyk", diagnosis: "Mild lumbar strain", prescription: "Ibuprofen 400mg as needed", notes: "Physiotherapy referral" },
  { id: 5, date: "2025-09-18", clinic: "City General Hospital", department: "General Practice", doctor: "Dr. Nkosi", diagnosis: "Annual check-up", prescription: "None", notes: "All vitals normal, blood work ordered" },
];

const mockPendingAppointments = [
  { id: 1, clinic: "City General Hospital", department: "Cardiology", doctor: "Dr. Nkosi", date: new Date(Date.now() + 2 * 60 * 60 * 1000), queueNumber: "A-012", estimatedWaitMin: 45 },
  { id: 2, clinic: "Greenwood Community Clinic", department: "Pediatrics", doctor: "Dr. Patel", date: new Date(Date.now() + 26 * 60 * 60 * 1000), queueNumber: "B-034", estimatedWaitMin: 120 },
  { id: 3, clinic: "Riverside Health Center", department: "Dermatology", doctor: "Dr. Moyo", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), queueNumber: "C-007", estimatedWaitMin: 7200 },
];

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000)));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, timeLeft]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (timeLeft === 0) {
    return <Badge className="bg-primary/15 text-primary border-primary/30" variant="outline">Your turn is coming up!</Badge>;
  }

  return (
    <div className="flex items-center gap-1 font-mono text-lg font-bold text-foreground">
      {days > 0 && <span>{days}d </span>}
      <span>{pad(hours)}</span>:<span>{pad(minutes)}</span>:<span>{pad(seconds)}</span>
    </div>
  );
};

const MedicalHistory = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Health Dashboard</h1>
          <p className="text-muted-foreground">View your pending appointments and medical history.</p>
        </div>

        {/* Pending Appointments */}
        <section className="animate-fade-up-delay space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
              <Clock className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Pending Appointments</h2>
            <Badge variant="secondary" className="ml-auto">{mockPendingAppointments.length} upcoming</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPendingAppointments.map((appt) => {
              const totalSec = Math.max(0, Math.floor((appt.date.getTime() - Date.now()) / 1000));
              const maxSec = appt.estimatedWaitMin * 60;
              const progressPct = Math.min(100, Math.max(0, ((maxSec - totalSec) / maxSec) * 100));

              return (
                <Card key={appt.id} className="border-0 card-shadow overflow-hidden">
                  <div className="hero-gradient p-3 text-center">
                    <p className="text-primary-foreground/80 text-[10px] uppercase tracking-widest">Queue Number</p>
                    <div className="text-2xl font-bold text-primary-foreground tracking-wider">{appt.queueNumber}</div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Timer className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">Time until appointment</span>
                      </div>
                      <CountdownTimer targetDate={appt.date} />
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{appt.clinic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{appt.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{appt.date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Medical History */}
        <section className="animate-fade-up-delay space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Medical History</h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: ClipboardList, label: "Total Visits", value: mockMedicalHistory.length },
              { icon: HeartPulse, label: "Conditions", value: 2 },
              { icon: Pill, label: "Active Meds", value: 2 },
              { icon: Syringe, label: "Last Visit", value: "Mar 2026" },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label} className="border-0 card-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold text-foreground">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* History Table */}
          <Card className="border-0 card-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Visit Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead className="hidden md:table-cell">Prescription</TableHead>
                    <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMedicalHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap font-medium">{record.date}</TableCell>
                      <TableCell>{record.clinic}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{record.department}</Badge>
                      </TableCell>
                      <TableCell>{record.diagnosis}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{record.prescription}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{record.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default MedicalHistory;
