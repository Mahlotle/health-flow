import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon, CheckCircle2, Clock, MapPin, User, Phone, Stethoscope, Timer, Navigation, Loader2, Search, Hourglass } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useLocation as useGeoLocation } from "@/hooks/useLocation";
import { UNJANI_SERVICES } from "@/lib/unjaniServices";

const departments = [...UNJANI_SERVICES];

const BookingTicket = ({ formData, date, appointmentId, onBookAnother }: {
  formData: { clinic: string; department: string; timeSlot: string };
  date: Date; appointmentId: string; onBookAnother: () => void;
}) => {
  const { profile } = useAuth();
  const [status, setStatus] = useState<string>("pending_approval");
  const [queueNumber, setQueueNumber] = useState("");
  const [estimatedWaitMin, setEstimatedWaitMin] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Poll for approval status
  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("status, queue_number, estimated_wait_min")
        .eq("id", appointmentId)
        .maybeSingle();
      if (data) {
        setStatus(data.status);
        if (data.queue_number) setQueueNumber(data.queue_number);
        if (data.estimated_wait_min) {
          setEstimatedWaitMin(data.estimated_wait_min);
          if (data.status === "confirmed" && secondsLeft === 0) {
            setSecondsLeft(data.estimated_wait_min * 60);
          }
        }
      }
    };
    fetchStatus();

    const channel = supabase
      .channel(`appt-status-${appointmentId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments", filter: `id=eq.${appointmentId}` }, (payload) => {
        const updated = payload.new as any;
        setStatus(updated.status);
        if (updated.queue_number) setQueueNumber(updated.queue_number);
        if (updated.estimated_wait_min && updated.status === "confirmed") {
          setEstimatedWaitMin(updated.estimated_wait_min);
          setSecondsLeft(updated.estimated_wait_min * 60);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [appointmentId]);

  // Countdown timer - only runs when confirmed
  useEffect(() => {
    if (status !== "confirmed" || secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [status, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPct = estimatedWaitMin > 0 ? Math.max(0, ((estimatedWaitMin * 60 - secondsLeft) / (estimatedWaitMin * 60)) * 100) : 0;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="mb-6 animate-fade-up text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mx-auto mb-4">
            {status === "pending_approval" ? (
              <Hourglass className="h-8 w-8 text-warning" />
            ) : status === "rejected" ? (
              <Clock className="h-8 w-8 text-destructive" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {status === "pending_approval" ? "Awaiting Doctor Approval" : status === "rejected" ? "Booking Declined" : "Booking Confirmed!"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {status === "pending_approval"
              ? "Your appointment request has been sent to the doctor for confirmation"
              : status === "rejected"
              ? "The doctor was unable to confirm this appointment"
              : "Your appointment has been approved"}
          </p>
        </div>
        <Card className="border-0 card-shadow animate-fade-up-delay overflow-hidden">
          {status === "confirmed" && queueNumber && (
            <div className="hero-gradient p-5 text-center">
              <p className="text-primary-foreground/80 text-xs uppercase tracking-widest mb-1">Queue Number</p>
              <div className="text-4xl font-bold text-primary-foreground tracking-wider">{queueNumber}</div>
            </div>
          )}
          {status === "pending_approval" && (
            <div className="bg-warning/10 p-5 text-center">
              <p className="text-warning text-xs uppercase tracking-widest mb-1">Status</p>
              <div className="text-2xl font-bold text-warning">Waiting for Approval</div>
              <p className="text-muted-foreground text-xs mt-2">The doctor will review and confirm your booking shortly</p>
            </div>
          )}
          {status === "rejected" && (
            <div className="bg-destructive/10 p-5 text-center">
              <p className="text-destructive text-xs uppercase tracking-widest mb-1">Status</p>
              <div className="text-2xl font-bold text-destructive">Declined</div>
              <p className="text-muted-foreground text-xs mt-2">Please try booking a different time slot</p>
            </div>
          )}
          {status === "confirmed" && (
            <CardContent className="p-5 border-b border-border">
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Estimated time until you're helped</span>
                </div>
                <div className="text-3xl font-bold text-foreground font-mono">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
                {secondsLeft === 0 && <Badge className="mt-2 bg-primary/15 text-primary border-primary/30" variant="outline">Your turn is coming up!</Badge>}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{Math.round(progressPct)}%</span></div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </CardContent>
          )}
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5"><User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-xs text-muted-foreground">Patient</div><div className="text-sm font-medium text-foreground">{profile?.full_name}</div></div></div>
              <div className="flex items-start gap-2.5"><Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-xs text-muted-foreground">Phone</div><div className="text-sm font-medium text-foreground">{profile?.phone || "N/A"}</div></div></div>
              <div className="flex items-start gap-2.5"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-xs text-muted-foreground">Clinic</div><div className="text-sm font-medium text-foreground">{formData.clinic}</div></div></div>
              <div className="flex items-start gap-2.5"><Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-xs text-muted-foreground">Department</div><div className="text-sm font-medium text-foreground">{formData.department}</div></div></div>
              <div className="flex items-start gap-2.5"><CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-xs text-muted-foreground">Date</div><div className="text-sm font-medium text-foreground">{format(date, "PPP")}</div></div></div>
              <div className="flex items-start gap-2.5"><Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><div><div className="text-xs text-muted-foreground">Time Slot</div><div className="text-sm font-medium text-foreground">{formData.timeSlot}</div></div></div>
            </div>
          </CardContent>
          <div className="relative px-5"><div className="border-t-2 border-dashed border-border" /><div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" /><div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" /></div>
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-4">
              {status === "confirmed"
                ? "Please arrive 10 minutes before your scheduled time. Bring a valid ID document."
                : "You will be notified once the doctor reviews your appointment."}
            </p>
            <div className="flex gap-2">
              <Button variant="hero" onClick={onBookAnother} className="flex-1">Book Another</Button>
              <Link to="/patient" className="flex-1"><Button variant="outline" className="w-full">My Dashboard</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Booking = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [booked, setBooked] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ clinic: "", department: "", timeSlot: "" });
  const [clinicSearch, setClinicSearch] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { toast } = useToast();
  const { nearbyClinics, loading: locationLoading, error: locationError, location, requestLocation } = useGeoLocation();

  const filteredClinics = nearbyClinics.filter((c) =>
    c.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
    c.province.toLowerCase().includes(clinicSearch.toLowerCase()) ||
    c.district.toLowerCase().includes(clinicSearch.toLowerCase())
  );

  // Fetch available slots when clinic + department + date are selected
  const fetchAvailableSlots = useCallback(async () => {
    if (!formData.clinic || !formData.department || !date) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("doctor_availability")
      .select("time_slot")
      .eq("clinic", formData.clinic)
      .eq("department", formData.department)
      .eq("available_date", dateStr)
      .eq("is_booked", false);
    setAvailableSlots((data ?? []).map((d) => d.time_slot));
    setLoadingSlots(false);
  }, [formData.clinic, formData.department, date]);

  useEffect(() => {
    fetchAvailableSlots();
    // Reset time slot when dependencies change
    setFormData((prev) => ({ ...prev, timeSlot: "" }));
  }, [fetchAvailableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !formData.clinic || !formData.department || !formData.timeSlot) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!user) return;

    setSubmitting(true);
    const dateStr = format(date, "yyyy-MM-dd");

    // Atomically claim slot + create appointment (prevents two patients booking same time)
    const { data: newApptId, error } = await supabase.rpc("claim_appointment_slot", {
      _clinic: formData.clinic,
      _department: formData.department,
      _appointment_date: dateStr,
      _time_slot: formData.timeSlot,
    });

    if (error || !newApptId) {
      toast({ title: "Booking failed", description: error?.message || "Slot unavailable", variant: "destructive" });
      // Refresh slots in case it was just taken
      fetchAvailableSlots();
    } else {
      // Notify patient that the request was sent
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Appointment Request Sent 📨",
        message: `Your appointment at ${formData.clinic} (${formData.department}) on ${dateStr} at ${formData.timeSlot} has been submitted. You'll be notified once the doctor approves it.`,
        type: "booking",
        related_appointment_id: newApptId as string,
      });

      // Notify the doctor who owns the availability slot (if any)
      const { data: slot } = await supabase
        .from("doctor_availability")
        .select("doctor_id")
        .eq("clinic", formData.clinic)
        .eq("department", formData.department)
        .eq("available_date", dateStr)
        .eq("time_slot", formData.timeSlot)
        .maybeSingle();
      const patientName = profile?.full_name || "A patient";
      if (slot?.doctor_id) {
        await supabase.from("notifications").insert({
          user_id: slot.doctor_id,
          title: "New Appointment Request 🔔",
          message: `${patientName} requested an appointment at ${formData.clinic} (${formData.department}) on ${dateStr} at ${formData.timeSlot}. Please review and approve.`,
          type: "new_request",
          related_appointment_id: newApptId as string,
        });
      } else {
        // Fallback: notify every doctor so someone picks it up
        const { data: docs } = await supabase.from("user_roles").select("user_id").eq("role", "doctor");
        if (docs && docs.length) {
          await supabase.from("notifications").insert(
            docs.map((d) => ({
              user_id: d.user_id,
              title: "New Appointment Request 🔔",
              message: `${patientName} requested an appointment at ${formData.clinic} (${formData.department}) on ${dateStr} at ${formData.timeSlot}.`,
              type: "new_request",
              related_appointment_id: newApptId as string,
            })),
          );
        }
      }

      setAppointmentId(newApptId as string);
      setBooked(true);
      toast({ title: "Appointment request sent! Awaiting doctor approval." });
    }
    setSubmitting(false);
  };

  const handleBookAnother = () => {
    setBooked(false);
    setFormData({ clinic: "", department: "", timeSlot: "" });
    setDate(undefined);
    setAppointmentId("");
  };

  if (booked && date) {
    return <BookingTicket formData={formData} date={date} appointmentId={appointmentId} onBookAnother={handleBookAnother} />;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">Find an Unjani Clinic near you and book your visit.</p>
        </div>

        {!location && (
          <Card className="border-0 card-shadow mb-6 animate-fade-up">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent shrink-0">
                  <Navigation className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Enable location to find clinics near you</p>
                  <p className="text-xs text-muted-foreground">We'll sort Unjani Clinics by distance</p>
                </div>
              </div>
              <Button variant="hero" size="sm" onClick={requestLocation} disabled={locationLoading}>
                {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable"}
              </Button>
            </CardContent>
            {locationError && (
              <div className="px-5 pb-3">
                <p className="text-xs text-destructive">{locationError}</p>
              </div>
            )}
          </Card>
        )}

        {location && (
          <Card className="border-0 card-shadow mb-6 animate-fade-up">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">📍 Location enabled — clinics sorted by distance from you</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 card-shadow animate-fade-up-delay">
          <CardHeader><CardTitle>Appointment Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinic with search */}
              <div className="space-y-2">
                <Label>Unjani Clinic *</Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clinics by name, province, or district..."
                    value={clinicSearch}
                    onChange={(e) => setClinicSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={formData.clinic} onValueChange={(v) => setFormData({ ...formData, clinic: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a clinic near you" /></SelectTrigger>
                  <SelectContent>
                    {filteredClinics.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{c.name}</span>
                          {c.distance !== undefined && (
                            <span className="text-xs text-muted-foreground ml-2">{c.distance} km</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    {filteredClinics.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No clinics match your search</div>
                    )}
                  </SelectContent>
                </Select>
                {formData.clinic && (
                  <p className="text-xs text-muted-foreground">
                    {nearbyClinics.find(c => c.name === formData.clinic)?.province} · {nearbyClinics.find(c => c.name === formData.clinic)?.district}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Service *</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Available Time Slot *</Label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading available slots...
                    </div>
                  ) : availableSlots.length === 0 && formData.clinic && formData.department && date ? (
                    <p className="text-sm text-muted-foreground py-2">No available slots for this date. The doctor hasn't set availability yet.</p>
                  ) : (
                    <Select value={formData.timeSlot} onValueChange={(v) => setFormData({ ...formData, timeSlot: v })}>
                      <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting || availableSlots.length === 0}>
                {submitting ? "Submitting..." : "Request Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;
