import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, FileText, Users, ArrowRight, Shield, Zap, Heart, Stethoscope, Syringe, Baby } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-clinic.jpg";
import serviceConsultation from "@/assets/service-consultation.jpg";
import serviceChronic from "@/assets/service-chronic.jpg";
import serviceMaternal from "@/assets/service-maternal.jpg";
import serviceImmunisation from "@/assets/service-immunisation.jpg";

const features = [
  {
    icon: Calendar,
    title: "Online Booking",
    description: "Schedule appointments from anywhere. Choose your preferred clinic, service, and time slot.",
  },
  {
    icon: Clock,
    title: "Live Queue Tracking",
    description: "See real-time wait times and your position in the queue. No more guessing.",
  },
  {
    icon: FileText,
    title: "Digital Health Records",
    description: "Access your medical history across all connected clinics securely.",
  },
  {
    icon: Users,
    title: "Smart Queue Prediction",
    description: "AI-powered wait time estimates so you can plan your visit better.",
  },
];

const services = [
  {
    icon: Stethoscope,
    title: "General Consultations",
    description: "Primary care visits with a qualified nurse practitioner.",
    image: serviceConsultation,
  },
  {
    icon: Heart,
    title: "Chronic Disease Management",
    description: "Ongoing care for diabetes, hypertension, and more.",
    image: serviceChronic,
  },
  {
    icon: Baby,
    title: "Maternal & Child Health",
    description: "Caring support for moms, babies, and young children.",
    image: serviceMaternal,
  },
  {
    icon: Syringe,
    title: "Immunisations",
    description: "Scheduled vaccinations for children and adults.",
    image: serviceImmunisation,
  },
];

const stats = [
  { value: "60%", label: "Reduced Wait Times" },
  { value: "10k+", label: "Patients Served" },
  { value: "24", label: "Unjani Clinics" },
  { value: "4.8★", label: "Patient Rating" },
];

const Index = () => {
  const { user, role } = useAuth();
  const dashboardLink = user ? (role === "doctor" ? "/doctor" : "/patient") : "/auth";
  const bookingLink = user ? "/booking" : "/auth";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-sm text-primary-foreground mb-6">
                <Zap className="h-3.5 w-3.5" />
                Smart Healthcare Access
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
                Skip the Queue.
                <br />
                <span className="opacity-90">Get Care Faster.</span>
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
                Book appointments at Unjani Clinics, track queues in real time, and access your health records — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={bookingLink}>
                  <Button variant="hero-outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                    {user ? "Book Appointment" : "Get Started"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={user ? dashboardLink : "/queue"}>
                  <Button variant="ghost" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10">
                    {user ? "My Dashboard" : "Check Queue Status"}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-up-delay hidden lg:block">
              <div className="absolute -inset-4 bg-primary-foreground/10 rounded-3xl blur-2xl" />
              <img
                src={heroImage}
                alt="Nurse welcoming a patient at an Unjani Clinic"
                width={1280}
                height={960}
                className="relative rounded-3xl shadow-2xl object-cover aspect-[4/3] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="card-shadow border-0 animate-fade-up-delay">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              A complete healthcare access platform designed to make your clinic visits seamless.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent mb-4 group-hover:hero-gradient transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-accent-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nurse-led primary healthcare trusted by communities across South Africa.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className="group overflow-hidden border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    width={768}
                    height={576}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background/95 backdrop-blur">
                    <service.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-1.5">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-accent/50">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to transform your healthcare experience?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of patients enjoying shorter waits and better care.
          </p>
          <Link to={user ? dashboardLink : "/auth"}>
            <Button variant="hero" size="lg" className="gap-2">
              {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 MedQueue — Smart Healthcare Access System
        </div>
      </footer>
    </div>
  );
};

export default Index;
