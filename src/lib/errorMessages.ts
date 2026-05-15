// Translates technical errors (Supabase / network / generic) into clear,
// detailed, user-friendly messages with actionable guidance.

export interface FriendlyError {
  title: string;
  description: string;
}

export function getFriendlyError(error: unknown, context: "login" | "signup" | "generic" = "generic"): FriendlyError {
  const raw =
    (error instanceof Error ? error.message : typeof error === "string" ? error : "") || "";
  const msg = raw.toLowerCase();

  // Network / connectivity
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network request failed")) {
    return {
      title: "Connection problem",
      description:
        "We couldn't reach the HAS servers. Please check your internet connection and try again. If you're on mobile data, try switching to Wi-Fi.",
    };
  }

  if (msg.includes("timeout") || msg.includes("timed out")) {
    return {
      title: "Request timed out",
      description: "The server took too long to respond. Please try again in a moment.",
    };
  }

  // Auth-specific
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return {
      title: "Incorrect email or password",
      description:
        "The email or password you entered doesn't match our records. Double-check your details, or reset your password if you've forgotten it.",
    };
  }

  if (msg.includes("email not confirmed")) {
    return {
      title: "Email not verified",
      description:
        "Please check your inbox for the verification link we sent you. You must verify your email before signing in.",
    };
  }

  if (msg.includes("user already registered") || msg.includes("already registered") || msg.includes("user_already_exists")) {
    return {
      title: "Account already exists",
      description:
        "An account with this email already exists. Please sign in instead, or use a different email address to register.",
    };
  }

  if (msg.includes("password should be at least") || msg.includes("weak_password")) {
    return {
      title: "Password too weak",
      description:
        "Your password must be at least 6 characters long. For better security, use a mix of letters, numbers, and symbols.",
    };
  }

  if (msg.includes("invalid email") || msg.includes("email_address_invalid")) {
    return {
      title: "Invalid email address",
      description: "Please enter a valid email address (e.g. yourname@example.com).",
    };
  }

  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("over_request_rate_limit")) {
    return {
      title: "Too many attempts",
      description:
        "You've tried too many times in a short period. Please wait a few minutes before trying again.",
    };
  }

  if (msg.includes("signup is disabled") || msg.includes("signups not allowed")) {
    return {
      title: "Sign-ups disabled",
      description: "New account registration is currently unavailable. Please contact support.",
    };
  }

  // RLS / permission
  if (msg.includes("row-level security") || msg.includes("permission denied") || msg.includes("not authorized")) {
    return {
      title: "Access denied",
      description: "You don't have permission to perform this action. Please sign in with the correct account.",
    };
  }

  // Duplicate / conflict
  if (msg.includes("duplicate key") || msg.includes("already exists") || msg.includes("conflict")) {
    return {
      title: "Already exists",
      description: "This record already exists. Please review your input and try again.",
    };
  }

  // Fallback
  const defaults: Record<typeof context, FriendlyError> = {
    login: {
      title: "Couldn't sign you in",
      description: raw
        ? `${raw}. Please try again or contact support if the problem continues.`
        : "Something went wrong while signing you in. Please try again.",
    },
    signup: {
      title: "Couldn't create your account",
      description: raw
        ? `${raw}. Please review your details and try again.`
        : "Something went wrong while creating your account. Please try again.",
    },
    generic: {
      title: "Something went wrong",
      description: raw || "An unexpected error occurred. Please try again.",
    },
  };

  return defaults[context];
}
