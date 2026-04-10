import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Clock, CheckCircle2, Stethoscope, Phone, MapPin, Calendar,
  ArrowRight, FileText, AlertCircle, User, Activity, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments">;
type MedicalRecord = Tables<"medical_records">;

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  in_progress: { label: "In Progress", className: "bg-info/15 text-info border-info/30" },
  completed: { label: "Completed", className: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/15 text-destructive border-destructive/30" },
  no_show: { label: "No Show", className: "bg-muted text-muted-foreground border-muted" },
};

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientProfiles, setPatientProfiles] = useState<Record<string, { full_name: string; phone: string }>>({});
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ diagnosis: "", prescription: "", notes: "", appointmentId: "" });

  const fetchAppointments = async () => {
    if (!user) return;
    let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: true }).order("time_slot", { ascending: true });

    const today = new Date().toISOString().split("T")[0];
    if (filter === "today") query = query.eq("appointment_date", today);
    else if (filter === "pending") query = query.eq("status", "pending");
    else if (filter === "completed") query = query.eq("status", "completed");

    const { data } = await query;
    setAppointments(data ?? []);

    // Fetch patient profiles
    const patientIds = [...new Set((data ?? []).map(a => a.patient_id))];
    if (patientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", patientIds);
      const map: Record<string, { full_name: string; phone: string }> = {};
      (profiles ?? []).forEach(p => { map[p.user_id] = { full_name: p.full_name, phone: p.phone || "" }; });
      setPatientProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user, filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: `Appointment marked as ${status}` });
    fetchAppointments();
  };

  const viewPatientHistory = async (patientId: string) => {
    setSelectedPatientId(patientId);
    const { data } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    setPatientRecords(data ?? []);
  };

  const addMedicalRecord = async (appointmentId: string, patientId: string) => {
    const appt = appointments.find(a => a.id === appointmentId);
    const { error } = await supabase.from("medical_records").insert({
      patient_id: patientId,
      doctor_id: user!.id,
      appointment_id: appointmentId,
      clinic: appt?.clinic || "",
      department: appt?.department || "",
      diagnosis: newRecord.diagnosis,
      prescription: newRecord.prescription,
      notes: newRecord.notes,
    });
    if (error) {
      toast({ title: "Error adding record", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Medical record added" });
      setNewRecord({ diagnosis: "", prescription: "", notes: "", appointmentId: "" });
      setRecordDialogOpen(false);
      // Also mark as completed
      await updateStatus(appointmentId, "completed");
    }
  };

  const todayAppts = appointments.filter(a => a.appointment_date === new Date().toISOString().split("T")[0]);
  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const inProgressCount = appointments.filter(a => a.status === "in_progress").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {profile?.full_name || "Doctor"} 🩺
          </h1>
          <p className="text-muted-foreground">Manage your patient queue and medical records.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up-delay">
          {[
            { icon: Users, label: "Today's Queue", value: todayAppts.length, color: "text-primary" },
            { icon: Clock, label: "Pending", value: pendingCount, color: "text-warning" },
            { icon: Activity, label: "In Progress", value: inProgressCount, color: "text-info" },
            { icon: CheckCircle2, label: "Completed", value: completedCount, color: "text-success" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="border-0 card-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter + Queue Table */}
        <section className="space-y-4 animate-fade-up-delay">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
                <ClipboardList className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Patient Queue</h2>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="pending">All Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {appointments.length === 0 ? (
            <Card className="border-0 card-shadow">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments found</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 card-shadow">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date / Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appt) => {
                      const patient = patientProfiles[appt.patient_id];
                      const cfg = statusConfig[appt.status] || statusConfig.pending;
                      return (
                        <TableRow key={appt.id}>
                          <TableCell className="font-bold text-primary">{appt.queue_number || "—"}</TableCell>
                          <TableCell>
                            <button
                              className="text-foreground hover:text-primary hover:underline flex items-center gap-1"
                              onClick={() => viewPatientHistory(appt.patient_id)}
                            >
                              <User className="h-3 w-3" />
                              {patient?.full_name || "Unknown"}
                            </button>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{patient?.phone || "—"}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{appt.department}</Badge></TableCell>
                          <TableCell className="text-sm">{appt.appointment_date} {appt.time_slot}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {appt.status === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, "in_progress")}>
                                  Call In
                                </Button>
                              )}
                              {appt.status === "in_progress" && (
                                <>
                                  <Dialog open={recordDialogOpen && newRecord.appointmentId === appt.id} onOpenChange={(open) => {
                                    setRecordDialogOpen(open);
                                    if (open) setNewRecord({ ...newRecord, appointmentId: appt.id });
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="hero" onClick={() => setNewRecord({ diagnosis: "", prescription: "", notes: "", appointmentId: appt.id })}>
                                        Complete
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Add Medical Record & Complete</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Diagnosis *</Label>
                                          <Input value={newRecord.diagnosis} onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })} placeholder="e.g. Hypertension Stage 1" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Prescription</Label>
                                          <Input value={newRecord.prescription} onChange={(e) => setNewRecord({ ...newRecord, prescription: e.target.value })} placeholder="e.g. Amlodipine 5mg daily" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Notes</Label>
                                          <Textarea value={newRecord.notes} onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} placeholder="Follow-up notes..." />
                                        </div>
                                        <Button
                                          variant="hero"
                                          className="w-full"
                                          disabled={!newRecord.diagnosis}
                                          onClick={() => addMedicalRecord(appt.id, appt.patient_id)}
                                        >
                                          Save Record & Complete
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, "no_show")}>
                                    No Show
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Patient History Panel */}
        {selectedPatientId && (
          <section className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Patient History — {patientProfiles[selectedPatientId]?.full_name || "Unknown"}
                </h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatientId(null)}>Close</Button>
            </div>

            {patientRecords.length === 0 ? (
              <Card className="border-0 card-shadow">
                <CardContent className="p-6 text-center text-muted-foreground">No records found for this patient.</CardContent>
              </Card>
            ) : (
              <Card className="border-0 card-shadow">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Prescription</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{r.department}</Badge></TableCell>
                          <TableCell>{r.diagnosis}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.prescription || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
