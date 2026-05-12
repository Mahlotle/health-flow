import { useEffect, useState, useCallback } from "react";
import { UNJANI_SERVICES } from "@/lib/unjaniServices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Users, Clock, CheckCircle2, Stethoscope, Phone, MapPin, Calendar as CalendarIcon,
  ArrowRight, FileText, AlertCircle, User, Activity, ClipboardList, Plus, Trash2, Check, X,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation as useGeoLocation, type UnjaniClinic } from "@/hooks/useLocation";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments">;
type MedicalRecord = Tables<"medical_records">;

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_approval: { label: "Awaiting Approval", className: "bg-warning/15 text-warning border-warning/30" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  confirmed: { label: "Confirmed", className: "bg-info/15 text-info border-info/30" },
  in_progress: { label: "In Progress", className: "bg-info/15 text-info border-info/30" },
  completed: { label: "Completed", className: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/15 text-destructive border-destructive/30" },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30" },
  no_show: { label: "No Show", className: "bg-muted text-muted-foreground border-muted" },
};

const departments = [...UNJANI_SERVICES];
const timeSlotOptions = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

const DoctorDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { nearbyClinics } = useGeoLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [myQueue, setMyQueue] = useState<Appointment[]>([]);
  const [patientProfiles, setPatientProfiles] = useState<Record<string, { full_name: string; phone: string }>>({});
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_approval");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ diagnosis: "", prescription: "", notes: "", appointmentId: "" });

  // Availability management state
  const [availTab, setAvailTab] = useState<"queue" | "availability">("queue");
  const [availClinic, setAvailClinic] = useState("");
  const [availDept, setAvailDept] = useState("");
  const [availDate, setAvailDate] = useState<Date>();
  const [availSlots, setAvailSlots] = useState<string[]>([]);
  const [existingSlots, setExistingSlots] = useState<{ id: string; time_slot: string; is_booked: boolean }[]>([]);
  const [savingSlots, setSavingSlots] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: true }).order("time_slot", { ascending: true });

    const today = new Date().toISOString().split("T")[0];
    if (filter === "today") query = query.eq("appointment_date", today);
    else if (filter === "pending_approval") query = query.eq("status", "pending_approval");
    else if (filter === "pending") query = query.eq("status", "pending");
    else if (filter === "confirmed") query = query.eq("status", "confirmed");
    else if (filter === "completed") query = query.eq("status", "completed");

    const { data } = await query;
    setAppointments(data ?? []);

    const patientIds = [...new Set((data ?? []).map(a => a.patient_id))];
    if (patientIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", patientIds);
      const map: Record<string, { full_name: string; phone: string }> = {};
      (profiles ?? []).forEach(p => { map[p.user_id] = { full_name: p.full_name, phone: p.phone || "" }; });
      setPatientProfiles(map);
    }
    setLoading(false);
  }, [user, filter]);

  const fetchMyQueue = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", user.id)
      .in("status", ["confirmed", "checked_in", "in_progress"])
      .eq("appointment_date", today)
      .order("time_slot", { ascending: true });
    setMyQueue((data ?? []) as Appointment[]);
  }, [user]);

  useEffect(() => { fetchAppointments(); fetchMyQueue(); }, [fetchAppointments, fetchMyQueue]);

  // Realtime: refresh when patients book new appointments or status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`doctor-appts-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          const row = payload.new as Appointment | undefined;
          if (payload.eventType === "INSERT" && row?.status === "pending_approval") {
            toast({
              title: "New appointment request 🔔",
              description: `${row.department} on ${row.appointment_date} at ${row.time_slot}`,
            });
          }
          fetchAppointments();
          fetchMyQueue();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAppointments, fetchMyQueue, toast]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast({ title: `Appointment marked as ${status}` });
    fetchAppointments();
  };

  const approveAppointment = async (appt: Appointment) => {
    const qNum = `A-${Math.floor(Math.random() * 50 + 1).toString().padStart(3, "0")}`;
    const waitMin = Math.floor(Math.random() * 30 + 10);
    await supabase.from("appointments").update({
      status: "confirmed",
      queue_number: qNum,
      estimated_wait_min: waitMin,
      doctor_id: user!.id,
    }).eq("id", appt.id);

    // Send notification to patient
    await supabase.from("notifications").insert({
      user_id: appt.patient_id,
      title: "Appointment Approved ✅",
      message: `Your appointment at ${appt.clinic} (${appt.department}) on ${appt.appointment_date} at ${appt.time_slot} has been confirmed. Queue: ${qNum}`,
      type: "approval",
      related_appointment_id: appt.id,
    });

    toast({ title: "Appointment approved" });
    fetchAppointments();
  };

  const rejectAppointment = async (appt: Appointment) => {
    await supabase.from("appointments").update({ status: "rejected" }).eq("id", appt.id);

    // Free the slot
    await supabase.from("doctor_availability")
      .update({ is_booked: false })
      .eq("clinic", appt.clinic)
      .eq("department", appt.department)
      .eq("available_date", appt.appointment_date)
      .eq("time_slot", appt.time_slot);

    // Notify patient
    await supabase.from("notifications").insert({
      user_id: appt.patient_id,
      title: "Appointment Declined ❌",
      message: `Your appointment request at ${appt.clinic} (${appt.department}) on ${appt.appointment_date} at ${appt.time_slot} was declined. Please try another slot.`,
      type: "rejection",
      related_appointment_id: appt.id,
    });

    toast({ title: "Appointment rejected" });
    fetchAppointments();
  };

  const viewPatientHistory = async (patientId: string) => {
    setSelectedPatientId(patientId);
    const { data } = await supabase.from("medical_records").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
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
      await updateStatus(appointmentId, "completed");
    }
  };

  // Availability management
  const fetchExistingSlots = useCallback(async () => {
    if (!user || !availClinic || !availDept || !availDate) { setExistingSlots([]); return; }
    const { data } = await supabase.from("doctor_availability")
      .select("id, time_slot, is_booked")
      .eq("doctor_id", user.id)
      .eq("clinic", availClinic)
      .eq("department", availDept)
      .eq("available_date", format(availDate, "yyyy-MM-dd"))
      .order("time_slot");
    setExistingSlots((data ?? []) as any);
  }, [user, availClinic, availDept, availDate]);

  useEffect(() => { fetchExistingSlots(); }, [fetchExistingSlots]);

  const saveAvailability = async () => {
    if (!user || !availClinic || !availDept || !availDate || availSlots.length === 0) return;
    setSavingSlots(true);
    const dateStr = format(availDate, "yyyy-MM-dd");
    const rows = availSlots.map((ts) => ({
      doctor_id: user.id,
      clinic: availClinic,
      department: availDept,
      available_date: dateStr,
      time_slot: ts,
    }));
    const { error } = await supabase.from("doctor_availability").insert(rows);
    if (error) {
      toast({ title: "Error saving slots", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${availSlots.length} time slots added` });
      setAvailSlots([]);
      fetchExistingSlots();
    }
    setSavingSlots(false);
  };

  const removeSlot = async (slotId: string) => {
    await supabase.from("doctor_availability").delete().eq("id", slotId);
    toast({ title: "Slot removed" });
    fetchExistingSlots();
  };

  const todayAppts = appointments.filter(a => a.appointment_date === new Date().toISOString().split("T")[0]);
  const pendingApprovalCount = appointments.filter(a => a.status === "pending_approval").length;
  const confirmedCount = appointments.filter(a => a.status === "confirmed").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  // Existing time_slots for this config (to exclude from "add" options)
  const existingTimeSlotSet = new Set(existingSlots.map(s => s.time_slot));
  const addableSlots = timeSlotOptions.filter(t => !existingTimeSlotSet.has(t));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {profile?.full_name || "Doctor"} 🩺
          </h1>
          <p className="text-muted-foreground">Manage your patient queue, availability, and medical records.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up-delay">
          {[
            { icon: Users, label: "Today's Queue", value: todayAppts.length, color: "text-primary" },
            { icon: Clock, label: "Awaiting Approval", value: pendingApprovalCount, color: "text-warning" },
            { icon: Activity, label: "Confirmed", value: confirmedCount, color: "text-info" },
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

        {/* Tab Toggle */}
        <div className="flex gap-2">
          <Button variant={availTab === "queue" ? "hero" : "outline"} onClick={() => setAvailTab("queue")}>
            <ClipboardList className="h-4 w-4 mr-2" /> Patient Queue
          </Button>
          <Button variant={availTab === "availability" ? "hero" : "outline"} onClick={() => setAvailTab("availability")}>
            <CalendarIcon className="h-4 w-4 mr-2" /> Set Availability
          </Button>
        </div>

        {/* ---- AVAILABILITY TAB ---- */}
        {availTab === "availability" && (
          <section className="space-y-4 animate-fade-up">
            <Card className="border-0 card-shadow">
              <CardHeader><CardTitle>Set Your Available Slots</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Clinic</Label>
                    <Select value={availClinic} onValueChange={setAvailClinic}>
                      <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                      <SelectContent>
                        {nearbyClinics.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={availDept} onValueChange={setAvailDept}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {availDate ? format(availDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={availDate} onSelect={setAvailDate} disabled={(d) => d < new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {availClinic && availDept && availDate && (
                  <>
                    {/* Existing slots */}
                    {existingSlots.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Current slots for this date:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingSlots.map((s) => (
                            <Badge key={s.id} variant="outline" className={s.is_booked ? "bg-primary/10 text-primary" : ""}>
                              {s.time_slot} {s.is_booked && "(Booked)"}
                              {!s.is_booked && (
                                <button className="ml-1 hover:text-destructive" onClick={() => removeSlot(s.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add new slots */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Add time slots:</p>
                      <div className="flex flex-wrap gap-2">
                        {addableSlots.map((t) => (
                          <Button
                            key={t}
                            size="sm"
                            variant={availSlots.includes(t) ? "default" : "outline"}
                            onClick={() => setAvailSlots((prev) => prev.includes(t) ? prev.filter(s => s !== t) : [...prev, t])}
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                      {addableSlots.length === 0 && <p className="text-sm text-muted-foreground">All slots already added for this date.</p>}
                    </div>

                    {availSlots.length > 0 && (
                      <Button variant="hero" onClick={saveAvailability} disabled={savingSlots}>
                        <Plus className="h-4 w-4 mr-2" />
                        {savingSlots ? "Saving..." : `Add ${availSlots.length} Slot${availSlots.length > 1 ? "s" : ""}`}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ---- QUEUE TAB ---- */}
        {availTab === "queue" && (
          <section className="space-y-4 animate-fade-up-delay">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg hero-gradient">
                  <ClipboardList className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Patient Queue</h2>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_approval">Awaiting Approval</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
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
                        <TableHead>Clinic</TableHead>
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
                              <button className="text-foreground hover:text-primary hover:underline flex items-center gap-1" onClick={() => viewPatientHistory(appt.patient_id)}>
                                <User className="h-3 w-3" />
                                {patient?.full_name || "Unknown"}
                              </button>
                            </TableCell>
                            <TableCell className="text-sm">{appt.clinic}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{appt.department}</Badge></TableCell>
                            <TableCell className="text-sm">{appt.appointment_date} {appt.time_slot}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {appt.status === "pending_approval" && (
                                  <>
                                    <Button size="sm" variant="hero" onClick={() => approveAppointment(appt)}>
                                      <Check className="h-3 w-3 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => rejectAppointment(appt)}>
                                      <X className="h-3 w-3 mr-1" /> Reject
                                    </Button>
                                  </>
                                )}
                                {appt.status === "confirmed" && (
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
                                        <DialogHeader><DialogTitle>Add Medical Record & Complete</DialogTitle></DialogHeader>
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
                                          <Button variant="hero" className="w-full" disabled={!newRecord.diagnosis} onClick={() => addMedicalRecord(appt.id, appt.patient_id)}>
                                            Save Record & Complete
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(appt.id, "no_show")}>No Show</Button>
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
        )}

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
