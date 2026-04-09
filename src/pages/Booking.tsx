import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

const Booking = () => {
  const [date, setDate] = useState<Date>();
  const [booked, setBooked] = useState(false);
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
    setBooked(true);
    toast({ title: "Appointment booked successfully!" });
  };

  if (booked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full card-shadow border-0 animate-fade-up">
          <CardContent className="p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-4">
              Your appointment at <span className="font-medium text-foreground">{formData.clinic}</span> is set for{" "}
              <span className="font-medium text-foreground">{date && format(date, "PPP")}</span> at{" "}
              <span className="font-medium text-foreground">{formData.timeSlot}</span>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Queue number: <span className="font-bold text-primary text-lg">A-{Math.floor(Math.random() * 50 + 1).toString().padStart(3, "0")}</span>
            </p>
            <Button variant="hero" onClick={() => { setBooked(false); setFormData({ name: "", phone: "", clinic: "", department: "", timeSlot: "" }); setDate(undefined); }}>
              Book Another
            </Button>
          </CardContent>
        </Card>
      </div>
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
