import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { UNJANI_SERVICES } from "@/lib/unjaniServices";
import { useLocation } from "@/hooks/useLocation";

interface AppointmentRow {
  id: string;
  clinic: string;
  department: string;
  status: string;
  estimated_wait_min: number | null;
  appointment_date: string;
  time_slot: string;
}

interface QueueItem {
  department: string;
  currentNumber: number;
  totalInQueue: number;
  estimatedWait: number;
  status: "low" | "moderate" | "busy";
}

const statusConfig = {
  low: { label: "Short Wait", className: "bg-success/15 text-success border-success/30" },
  moderate: { label: "Moderate", className: "bg-warning/15 text-warning border-warning/30" },
  busy: { label: "Busy", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const QueueDashboard = () => {
  const { nearbyClinics } = useLocation();
  const clinics = useMemo(() => nearbyClinics.map((c) => c.name), [nearbyClinics]);
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (!selectedClinic && clinics.length) setSelectedClinic(clinics[0]);
  }, [clinics, selectedClinic]);

  const fetchAppointments = async (clinic: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("appointments")
      .select("id, clinic, department, status, estimated_wait_min, appointment_date, time_slot")
      .eq("clinic", clinic)
      .eq("appointment_date", today);
    setAppointments((data as AppointmentRow[]) || []);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (!selectedClinic) return;
    fetchAppointments(selectedClinic);
    const interval = setInterval(() => fetchAppointments(selectedClinic), 15000);

    const channel = supabase
      .channel(`queue-${selectedClinic}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => fetchAppointments(selectedClinic)
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [selectedClinic]);

  const queues: QueueItem[] = useMemo(() => {
    return UNJANI_SERVICES.map((service) => {
      const forService = appointments.filter((a) => a.department === service);
      const inProgress = forService.filter((a) => a.status === "in_progress").length;
      const waiting = forService.filter((a) =>
        ["approved", "confirmed", "checked_in", "pending"].includes(a.status)
      );
      const totalInQueue = waiting.length;
      const avgWait = waiting.length
        ? Math.round(
            waiting.reduce((s, a) => s + (a.estimated_wait_min ?? 30), 0) / waiting.length
          )
        : 0;
      const currentNumber = inProgress + forService.filter((a) => a.status === "completed").length;
      const status: QueueItem["status"] =
        totalInQueue >= 15 ? "busy" : totalInQueue >= 7 ? "moderate" : "low";
      return {
        department: service,
        currentNumber,
        totalInQueue,
        estimatedWait: avgWait,
        status,
      };
    });
  }, [appointments]);

  const totalPatients = queues.reduce((s, q) => s + q.totalInQueue, 0);
  const avgWait = queues.length
    ? Math.round(queues.reduce((s, q) => s + q.estimatedWait, 0) / queues.length)
    : 0;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Queue Dashboard</h1>
            <p className="text-muted-foreground">Live queue status from today's appointments.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Select clinic" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
              Live
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-up-delay">
          <Card className="border-0 card-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalPatients}</div>
                <div className="text-xs text-muted-foreground">Total in Queue</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 card-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{avgWait} min</div>
                <div className="text-xs text-muted-foreground">Avg Wait Time</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 card-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <TrendingDown className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {queues.filter((q) => q.status === "low").length}/{queues.length}
                </div>
                <div className="text-xs text-muted-foreground">Low Wait Services</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up-delay-2">
          {queues.map((q) => {
            const cfg = statusConfig[q.status];
            const loadPct = Math.min((q.totalInQueue / 25) * 100, 100);
            return (
              <Card
                key={q.department}
                className="border-0 card-shadow hover:card-shadow-hover transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{q.department}</CardTitle>
                    <Badge variant="outline" className={cfg.className}>
                      {cfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="text-muted-foreground">Now Serving</div>
                      <div className="text-xl font-bold text-primary">
                        {q.currentNumber > 0 ? `#${q.currentNumber}` : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">In Queue</div>
                      <div className="text-xl font-bold text-foreground">{q.totalInQueue}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Queue Load</span>
                      <span>{Math.round(loadPct)}%</span>
                    </div>
                    <Progress value={loadPct} className="h-2" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Est. wait:</span>
                    <span className="font-medium text-foreground">
                      {q.estimatedWait > 0 ? `${q.estimatedWait} min` : "No wait"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Last updated: {lastUpdated.toLocaleTimeString()} • Live sync + 15s refresh
        </p>
      </div>
    </div>
  );
};

export default QueueDashboard;
