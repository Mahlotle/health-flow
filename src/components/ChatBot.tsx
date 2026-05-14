import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User, Loader2, CalendarPlus, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { UNJANI_SERVICES } from "@/lib/unjaniServices";
import { useLocation as useGeoLocation } from "@/hooks/useLocation";
import { toast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "What services are available?",
  "Where are Unjani Clinics?",
  "How do I book an appointment?",
  "How do I check queue status?",
];

const ChatBot = () => {
  const { nearbyClinics } = useGeoLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your **MedQueue Assistant**. I can help you with booking, checking queue status, or finding an Unjani Clinic near you. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Pre-compute service + clinic strings sourced from actual app data
  const serviceList = useMemo(
    () => UNJANI_SERVICES.map((s) => `- 🩺 **${s}**`).join("\n"),
    []
  );

  const clinicsByProvince = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const c of nearbyClinics) {
      if (!groups[c.province]) groups[c.province] = [];
      groups[c.province].push(c.name.replace(/^Unjani Clinic\s+/i, ""));
    }
    return groups;
  }, [nearbyClinics]);

  const clinicList = useMemo(() => {
    return Object.entries(clinicsByProvince)
      .map(([prov, names]) => `- 🏥 **${prov}** — ${names.join(", ")}`)
      .join("\n");
  }, [clinicsByProvince]);

  const getAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes("book") || msg.includes("appointment") || msg.includes("schedule")) {
      return "To book an appointment:\n1. Go to the **Book Appointment** page\n2. Enable **location** to find the nearest Unjani Clinic\n3. Choose a **clinic**, **service**, **date**, and available **time slot**\n4. Submit — the doctor will review and approve your request\n\nOnce approved, you'll get a **queue number** and a live **countdown** until you're helped. 🎫";
    }
    if (msg.includes("queue") || msg.includes("wait") || msg.includes("status") || msg.includes("how long")) {
      return "Check live queues on the **Queue Dashboard**:\n- 🔢 **Now Serving** number per service\n- ⏱️ **Estimated wait times**\n- 📊 **Queue load** percentage\n- 🟢 Status indicators (Short Wait, Moderate, Busy)\n\nAuto-refreshes every **15 seconds**.";
    }
    if (msg.includes("service") || msg.includes("department") || msg.includes("offer") || msg.includes("specialt")) {
      return `Unjani Clinics offer these primary healthcare services:\n${serviceList}\n\nPick the one that fits your visit when booking.`;
    }
    if (
      msg.includes("clinic") ||
      msg.includes("hospital") ||
      msg.includes("location") ||
      msg.includes("where") ||
      msg.includes("near")
    ) {
      const total = nearbyClinics.length;
      return `**Unjani Clinics** is a nurse-led primary healthcare network across South Africa (${total} locations in the app):\n\n${clinicList}\n\n📍 Enable location on the **Book Appointment** page to sort clinics by distance from you.`;
    }
    if (msg.includes("hour") || msg.includes("time") || msg.includes("open") || msg.includes("when")) {
      return "Unjani Clinics are generally open **Monday–Friday, 08:00–16:30**, with bookable **30-minute** slots. Availability depends on the specific clinic and service — the Book Appointment page only shows slots a nurse has actually opened.";
    }
    if (msg.includes("record") || msg.includes("history") || msg.includes("medical")) {
      return "Your **Medical History** is available on the **Patient Dashboard** once a nurse or doctor has captured a visit. You'll see:\n- 📋 Visit summaries\n- 💊 Prescriptions\n- 🩺 Diagnoses\n- 📝 Clinical notes";
    }
    if (msg.includes("hello") || msg.includes("hi ") || msg === "hi" || msg.includes("hey") || msg.includes("help")) {
      return "Hello! 😊 I can help with:\n- 📅 **Booking** an appointment\n- 📊 **Queue** status\n- 🏥 Finding an **Unjani Clinic** near you\n- 🩺 Available **services**\n- ⏰ **Operating hours**\n\nWhat would you like to know?";
    }
    if (msg.includes("thank")) {
      return "You're welcome! 💚 Wishing you good health.";
    }
    return `I can help with:\n- 📅 **Booking appointments**\n- 📊 **Queue status**\n- 🏥 **Unjani Clinic** locations\n- 🩺 **Services** offered\n- ⏰ **Operating hours**\n\nTry one of the quick replies below, or ask me directly.`;
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: message };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    // Build context-aware preamble with live clinic/service info
    const contextNote = `\n\nContext available to you:\nServices: ${UNJANI_SERVICES.join(", ")}.\nClinics by province: ${Object.entries(
      clinicsByProvince
    )
      .map(([p, n]) => `${p}: ${n.join(", ")}`)
      .join(" | ")}.`;

    const apiMessages = history
      .filter((m) => m.id !== "welcome")
      .map((m, i, arr) => ({
        role: m.role,
        content: i === arr.length - 1 && m.role === "user" ? m.content + contextNote : m.content,
      }));

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errText = resp.status === 429 ? "I'm getting a lot of questions right now — please try again shortly." : "Sorry, I couldn't reach the AI service. Please try again.";
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: errText } : m)));
        toast({ title: "AI error", description: errText, variant: "destructive" });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error("chat stream error", err);
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m)));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full hero-gradient text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] animate-fade-up">
          <Card className="border-0 card-shadow overflow-hidden flex flex-col" style={{ height: "560px" }}>
            {/* Header */}
            <div className="hero-gradient p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-primary-foreground text-sm">MedQueue Assistant</div>
                  <div className="text-primary-foreground/70 text-xs flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60 inline-block animate-pulse-soft" />
                    Online
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Action CTAs */}
            <div className="px-3 py-2 flex gap-2 shrink-0 bg-card border-b border-border">
              <Link to="/booking" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" variant="hero" className="w-full gap-1.5">
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Book
                </Button>
              </Link>
              <Link to="/queue" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" variant="outline" className="w-full gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Queue Status
                </Button>
              </Link>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "hero-gradient text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0 bg-background">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 shrink-0 bg-card">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="text-sm border-0 bg-muted focus-visible:ring-1"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="hero-gradient text-primary-foreground shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatBot;
