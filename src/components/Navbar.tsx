import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, LayoutDashboard, FileText, Menu, X, LogIn, LogOut, User, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, profile, signOut } = useAuth();

  const navItems = user
    ? role === "doctor"
      ? [
          { to: "/", label: "Home", icon: Activity },
          { to: "/doctor", label: "Dashboard", icon: Stethoscope },
          { to: "/queue", label: "Queue Status", icon: LayoutDashboard },
        ]
      : [
          { to: "/", label: "Home", icon: Activity },
          { to: "/patient", label: "My Dashboard", icon: User },
          { to: "/booking", label: "Book Appointment", icon: Calendar },
          { to: "/queue", label: "Queue Status", icon: LayoutDashboard },
        ]
    : [
        { to: "/", label: "Home", icon: Activity },
        { to: "/queue", label: "Queue Status", icon: LayoutDashboard },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg hero-gradient">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          MedQueue
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button variant={location.pathname === to ? "default" : "ghost"} size="sm" className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground hidden lg:inline">
                {profile?.full_name || user.email}
              </span>
              <Button variant="outline" size="sm" className="gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm" className="gap-2 ml-2">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 pb-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
              <Button variant={location.pathname === to ? "default" : "ghost"} className="w-full justify-start gap-2 mt-1">
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
          {user ? (
            <Button variant="outline" className="w-full justify-start gap-2 mt-1" onClick={() => { signOut(); setMobileOpen(false); }}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button variant="hero" className="w-full justify-start gap-2 mt-1">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
