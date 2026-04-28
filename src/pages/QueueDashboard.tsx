import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, Activity, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QueueItem {
  id: string;
  department: string;
  currentNumber: number;
  totalInQueue: number;
  estimatedWait: number;
  status: "low" | "moderate" | "busy";
}

const generateQueues = (): QueueItem[] => [
  { id: "1", department: "General Consultations", currentNumber: 12 + Math.floor(Math.random() * 5), totalInQueue: 8 + Math.floor(Math.random() * 10), estimatedWait: 10 + Math.floor(Math.random() * 20), status: "low" },
  { id: "2", department: "Chronic Disease Management", currentNumber: 5 + Math.floor(Math.random() * 3), totalInQueue: 15 + Math.floor(Math.random() * 8), estimatedWait: 25 + Math.floor(Math.random() * 15), status: "moderate" },
  { id: "3", department: "HIV Testing & Counselling", currentNumber: 3 + Math.floor(Math.random() * 2), totalInQueue: 10 + Math.floor(Math.random() * 5), estimatedWait: 15 + Math.floor(Math.random() * 15), status: "low" },
  { id: "4", department: "Maternal & Child Health", currentNumber: 8 + Math.floor(Math.random() * 4), totalInQueue: 12 + Math.floor(Math.random() * 6), estimatedWait: 20 + Math.floor(Math.random() * 15), status: "moderate" },
  { id: "5", department: "Immunisations", currentNumber: 7 + Math.floor(Math.random() * 3), totalInQueue: 5 + Math.floor(Math.random() * 6), estimatedWait: 8 + Math.floor(Math.random() * 10), status: "low" },
  { id: "6", department: "Family Planning", currentNumber: 4 + Math.floor(Math.random() * 3), totalInQueue: 6 + Math.floor(Math.random() * 5), estimatedWait: 12 + Math.floor(Math.random() * 10), status: "low" },
];

const statusConfig = {
  low: { label: "Short Wait", className: "bg-success/15 text-success border-success/30" },
  moderate: { label: "Moderate", className: "bg-warning/15 text-warning border-warning/30" },
  busy: { label: "Busy", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const clinics = [
  "City General Hospital",
  "Greenwood Community Clinic",
  "Riverside Health Center",
];

const QueueDashboard = () => {
  const [queues, setQueues] = useState<QueueItem[]>(generateQueues());
  const [selectedClinic, setSelectedClinic] = useState(clinics[0]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setQueues(generateQueues());
      setLastUpdated(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalPatients = queues.reduce((s, q) => s + q.totalInQueue, 0);
  const avgWait = Math.round(queues.reduce((s, q) => s + q.estimatedWait, 0) / queues.length);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Queue Dashboard</h1>
            <p className="text-muted-foreground">Real-time queue status across departments.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <div className="text-2xl font-bold text-foreground">{queues.filter(q => q.status === "low").length}/{queues.length}</div>
                <div className="text-xs text-muted-foreground">Low Wait Depts</div>
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
              <Card key={q.id} className="border-0 card-shadow hover:card-shadow-hover transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{q.department}</CardTitle>
                    <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="text-muted-foreground">Now Serving</div>
                      <div className="text-xl font-bold text-primary">#{q.currentNumber}</div>
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
                    <span className="font-medium text-foreground">{q.estimatedWait} min</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 15 seconds
        </p>
      </div>
    </div>
  );
};

export default QueueDashboard;
