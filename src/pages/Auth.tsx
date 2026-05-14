import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertCircle, Stethoscope, User } from "lucide-react";
import { getFriendlyError } from "@/lib/errorMessages";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { user, role, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor">("patient");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<{ title: string; description: string } | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async () => {
    setFormError(null);
    if (!email.trim()) {
      setFormError({ title: "Email required", description: "Enter your email address so we can send a reset link." });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      setFormError({ title: "Couldn't send reset email", description: error.message });
      return;
    }
    setResetSent(true);
    toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user && role) return <Navigate to={role === "doctor" ? "/doctor" : "/patient"} replace />;

  const showError = (err: unknown, ctx: "login" | "signup") => {
    const friendly = getFriendlyError(err, ctx);
    setFormError(friendly);
    toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        if (!email.trim() || !password) {
          setFormError({ title: "Missing details", description: "Please enter both your email and password to sign in." });
          setSubmitting(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) showError(error, "login");
      } else {
        if (!fullName.trim()) {
          setFormError({ title: "Full name required", description: "Please enter your full name so clinic staff can identify you." });
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setFormError({ title: "Password too short", description: "Your password must be at least 6 characters long." });
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, phone, selectedRole);
        if (error) {
          showError(error, "signup");
        } else {
          toast({ title: "Account created!", description: "Welcome to MedQueue. You can now book appointments and skip the queue." });
        }
      }
    } catch (err) {
      showError(err, isLogin ? "login" : "signup");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border-0 card-shadow animate-fade-up">
        <CardHeader className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl hero-gradient mx-auto mb-3">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to access your MedQueue dashboard" : "Join MedQueue as a patient or doctor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{formError.title}</AlertTitle>
                <AlertDescription>{formError.description}</AlertDescription>
              </Alert>
            )}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={selectedRole === "patient" ? "default" : "outline"}
                      className="gap-2 h-14 flex-col"
                      onClick={() => setSelectedRole("patient")}
                    >
                      <User className="h-5 w-5" />
                      Patient
                    </Button>
                    <Button
                      type="button"
                      variant={selectedRole === "doctor" ? "default" : "outline"}
                      className="gap-2 h-14 flex-col"
                      onClick={() => setSelectedRole("doctor")}
                    >
                      <Stethoscope className="h-5 w-5" />
                      Doctor
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Smith / John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 XX XXX XXXX" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          {isLogin && (
            <div className="mt-3 text-center">
              {!forgotMode ? (
                <button type="button" className="text-sm text-muted-foreground hover:text-primary hover:underline" onClick={() => { setForgotMode(true); setFormError(null); setResetSent(false); }}>
                  Forgot your password?
                </button>
              ) : resetSent ? (
                <p className="text-sm text-success">✓ Reset link sent. Check your email and follow the link to choose a new password.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Enter your email above, then click below to receive a reset link.</p>
                  <div className="flex gap-2 justify-center">
                    <Button type="button" size="sm" variant="hero" disabled={submitting} onClick={handleForgotPassword}>
                      {submitting ? "Sending..." : "Send reset link"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setForgotMode(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => { setIsLogin(!isLogin); setForgotMode(false); }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
