import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle2, Clock, MapPin, User, Phone, Stethoscope, Hash, Timer } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const clinics = [
  "City General Hospital",
  "Greenwood Community Clinic",
  "Riverside Health Center",
  "Sunrise Medical Practice",
];

const departments = [
  "General Practice",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00",
];

const BookingTicket = ({
  formData,
  date,
  queueNumber,
  estimatedWaitMin,
  onBookAnother,
}: {
  formData: { name: string; phone: string; clinic: string; department: string; timeSlot: string };
  date: Date;
  queueNumber: string;
  estimatedWaitMin: number;
  onBookAnother: () => void;
}) => {
  const [secondsLeft, setSecondsLeft] = useState(estimatedWaitMin * 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPct = Math.max(0, ((estimatedWaitMin * 60 - secondsLeft) / (estimatedWaitMin * 60)) * 100);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="mb-6 animate-fade-up text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="text-muted-foreground text-sm mt-1">Your appointment has been scheduled</p>
        </div>

        {/* Ticket Card */}
        <Card className="border-0 card-shadow animate-fade-up-delay overflow-hidden">
          {/* Ticket Header */}
          <div className="hero-gradient p-5 text-center">
            <p className="text-primary-foreground/80 text-xs uppercase tracking-widest mb-1">Queue Number</p>
            <div className="text-4xl font-bold text-primary-foreground tracking-wider">{queueNumber}</div>
          </div>

          {/* Countdown Section */}
          <CardContent className="p-5 border-b border-border">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Estimated time until you're helped</span>
              </div>
              <div className="text-3xl font-bold text-foreground font-mono">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              {secondsLeft === 0 && (
                <Badge className="mt-2 bg-primary/15 text-primary border-primary/30" variant="outline">
                  Your turn is coming up!
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          </CardContent>

          {/* Ticket Details */}
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Patient</div>
                  <div className="text-sm font-medium text-foreground">{formData.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="text-sm font-medium text-foreground">{formData.phone || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Clinic</div>
                  <div className="text-sm font-medium text-foreground">{formData.clinic}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Department</div>
                  <div className="text-sm font-medium text-foreground">{formData.department}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="text-sm font-medium text-foreground">{format(date, "PPP")}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Time Slot</div>
                  <div className="text-sm font-medium text-foreground">{formData.timeSlot}</div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Dashed separator for ticket feel */}
          <div className="relative px-5">
            <div className="border-t-2 border-dashed border-border" />
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
          </div>

          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-4">
              Please arrive 10 minutes before your scheduled time. Bring a valid ID document.
            </p>
            <Button variant="hero" onClick={onBookAnother} className="w-full">
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Booking = () => {
  const [date, setDate] = useState<Date>();
  const [booked, setBooked] = useState(false);
  const [queueNumber, setQueueNumber] = useState("");
  const [estimatedWaitMin, setEstimatedWaitMin] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    clinic: "",
    department: "",
    timeSlot: "",
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !formData.name || !formData.clinic || !formData.department || !formData.timeSlot) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setQueueNumber(`A-${Math.floor(Math.random() * 50 + 1).toString().padStart(3, "0")}`);
    setEstimatedWaitMin(Math.floor(Math.random() * 30 + 10));
    setBooked(true);
    toast({ title: "Appointment booked successfully!" });
  };

  const handleBookAnother = () => {
    setBooked(false);
    setFormData({ name: "", phone: "", clinic: "", department: "", timeSlot: "" });
    setDate(undefined);
  };

  if (booked && date) {
    return (
      <BookingTicket
        formData={formData}
        date={date}
        queueNumber={queueNumber}
        estimatedWaitMin={estimatedWaitMin}
        onBookAnother={handleBookAnother}
      />
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground">Choose your clinic, department, and preferred time.</p>
        </div>

        <Card className="border-0 card-shadow animate-fade-up-delay">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+27 XX XXX XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic *</Label>
                  <Select value={formData.clinic} onValueChange={(v) => setFormData({ ...formData, clinic: v })}>
                    <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label>Time Slot *</Label>
                  <Select value={formData.timeSlot} onValueChange={(v) => setFormData({ ...formData, timeSlot: v })}>
                    <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full">
                Confirm Booking
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;
