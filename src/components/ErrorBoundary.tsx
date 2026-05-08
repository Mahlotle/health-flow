import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { getFriendlyError } from "@/lib/errorMessages";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("App ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const friendly = getFriendlyError(this.state.error, "generic");

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{friendly.title}</AlertTitle>
            <AlertDescription>
              {friendly.description}
              <div className="mt-2 text-xs opacity-75 break-all">
                Technical detail: {this.state.error.message}
              </div>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={this.reset} variant="outline" className="gap-2 flex-1">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="hero" className="gap-2 flex-1">
              <Home className="h-4 w-4" /> Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
