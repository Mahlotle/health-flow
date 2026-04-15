import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Timer, Calendar, MapPin, Stethoscope, Clock, FileText,
  Pill, HeartPulse, ClipboardList, ArrowRight, User, XCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments">;
type MedicalRecord = Tables<"medical_records">;

const CountdownTimer = ({ appointmentDate, timeSlot }: { appointmentDate: string; timeSlot: string }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const target = new Date(`${appointmentDate}T${timeSlot}:00`);
    const calc = () => Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [appointmentDate, timeSlot]);

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

const PatientDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [apptRes, recRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", user.id)
        .order("appointment_date", { ascending: true }),
      supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setAppointments(apptRes.data ?? []);
    setRecords(recRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to cancel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment cancelled" });
      fetchData();
    }
  };

  const pendingAppts = appointments.filter(a => a.status === "pending" || a.status === "in_progress");
  const pastAppts = appointments.filter(a => a.status === "completed");

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Clock className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome, {profile?.full_name || "Patient"} 👋
          </h1>
          <p className="text-muted-foreground">Here's your health overview and upcoming appointments.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up-delay">
          {[
            { icon: ClipboardList, label: "Total Visits", value: pastAppts.length },
            { icon: Calendar, label: "Upcoming", value: pendingAppts.length },
            { icon: HeartPulse, label: "Records", value: records.length },
            { icon: Pill, label: "Active Meds", value: records.filter(r => r.prescription && r.prescription !== "None").length },
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

        {/* Pending Appointments */}
        <section className="animate-fade-up-delay space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
                <Clock className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Upcoming Appointments</h2>
            </div>
            <Link to="/booking">
              <Button variant="hero" size="sm" className="gap-1">
                Book New <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {pendingAppts.length === 0 ? (
            <Card className="border-0 card-shadow">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Link to="/booking">
                  <Button variant="hero" size="sm" className="mt-3 gap-1">
                    Book Appointment <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingAppts.map((appt) => (
                <Card key={appt.id} className="border-0 card-shadow overflow-hidden">
                  <div className="hero-gradient p-3 text-center">
                    <p className="text-primary-foreground/80 text-[10px] uppercase tracking-widest">Queue Number</p>
                    <div className="text-2xl font-bold text-primary-foreground tracking-wider">{appt.queue_number || "—"}</div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Timer className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">Time until appointment</span>
                      </div>
                      <CountdownTimer appointmentDate={appt.appointment_date} timeSlot={appt.time_slot} />
                    </div>
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
                        <span className="text-foreground">{appt.appointment_date} at {appt.time_slot}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={appt.status === "in_progress" ? "default" : "secondary"} className="text-xs">
                          {appt.status === "in_progress" ? "In Progress" : "Pending"}
                        </Badge>
                        {appt.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive gap-1">
                                <XCircle className="h-3 w-3" /> Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel your appointment at {appt.clinic} on {appt.appointment_date} at {appt.time_slot}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelAppointment(appt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Yes, Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Medical History */}
        <section className="animate-fade-up-delay space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Medical Records</h2>
          </div>

          {records.length === 0 ? (
            <Card className="border-0 card-shadow">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No medical records yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 card-shadow">
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
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap font-medium">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{r.clinic}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{r.department}</Badge></TableCell>
                        <TableCell>{r.diagnosis}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{r.prescription || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{r.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default PatientDashboard;
