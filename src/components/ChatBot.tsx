import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are MedQueue Assistant, an AI chatbot for a Smart Healthcare Access and Queue Management System. You help patients with:
- Booking appointments (guide them to the /booking page)
- Understanding queue status (guide them to the /queue page)
- General healthcare facility questions
- Explaining departments: General Practice, Pediatrics, Cardiology, Dermatology, Orthopedics
- Available clinics: City General Hospital, Greenwood Community Clinic, Riverside Health Center, Sunrise Medical Practice

Be concise, friendly, and helpful. Use markdown formatting for clarity. If patients need to book, tell them to visit the Book Appointment page. If they want queue info, direct them to the Queue Dashboard.`;

const QUICK_REPLIES = [
  "How do I book an appointment?",
  "What departments are available?",
  "How do I check queue status?",
  "What clinics can I visit?",
];

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your **MedQueue Assistant**. I can help you with booking appointments, checking queue status, or answering questions about our clinics. How can I help?",
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

  const getAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes("book") || msg.includes("appointment") || msg.includes("schedule")) {
      return "To book an appointment:\n1. Go to the **Book Appointment** page from the navigation bar\n2. Fill in your **name** and **phone number**\n3. Select your preferred **clinic** and **department**\n4. Pick a **date** and **time slot**\n5. Click **Confirm Booking**\n\nYou'll receive a **queue number** and an **estimated countdown** until you're helped! 🎫";
    }
    if (msg.includes("queue") || msg.includes("wait") || msg.includes("status") || msg.includes("how long")) {
      return "You can check real-time queue status on the **Queue Dashboard** page. It shows:\n- 🔢 **Now Serving** number per department\n- ⏱️ **Estimated wait times**\n- 📊 **Queue load** percentage\n- 🟢 **Status indicators** (Short Wait, Moderate, Busy)\n\nThe dashboard auto-refreshes every **15 seconds** with live data!";
    }
    if (msg.includes("department") || msg.includes("specialt") || msg.includes("doctor")) {
      return "We offer the following departments:\n- 🏥 **General Practice** — routine checkups & common illnesses\n- 👶 **Pediatrics** — children's health\n- ❤️ **Cardiology** — heart & cardiovascular care\n- 🧴 **Dermatology** — skin conditions\n- 🦴 **Orthopedics** — bone & joint issues\n\nChoose the one that best fits your needs when booking!";
    }
    if (msg.includes("clinic") || msg.includes("hospital") || msg.includes("location") || msg.includes("where")) {
      return "Our connected clinics are:\n- 🏥 **City General Hospital**\n- 🌿 **Greenwood Community Clinic**\n- 🌊 **Riverside Health Center**\n- 🌅 **Sunrise Medical Practice**\n\nAll clinics support online booking and real-time queue tracking!";
    }
    if (msg.includes("hour") || msg.includes("time") || msg.includes("open") || msg.includes("when")) {
      return "Our clinics are generally open **Monday–Friday**, with appointments available from **08:00 to 16:00**. Time slots are in **30-minute intervals**, with a lunch break from **12:00–13:00**.\n\nBook early for shorter wait times! Morning slots tend to be less busy. 🌅";
    }
    if (msg.includes("record") || msg.includes("history") || msg.includes("medical")) {
      return "The **Digital Health Records** feature allows you to access your medical history across all connected facilities. This feature is coming soon and will include:\n- 📋 Visit summaries\n- 💊 Prescription history\n- 🧪 Lab results\n- 📄 Referral documents";
    }
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("help")) {
      return "Hello! 😊 I'm here to help. Here's what I can assist with:\n- 📅 **Booking** an appointment\n- 📊 **Queue status** information\n- 🏥 **Clinic** & **department** details\n- ⏰ **Operating hours**\n- 📋 **Health records** info\n\nWhat would you like to know?";
    }
    if (msg.includes("thank") || msg.includes("thanks")) {
      return "You're welcome! 😊 If you need anything else, don't hesitate to ask. Wishing you good health! 💚";
    }
    return "I can help you with:\n- 📅 **Booking appointments** — how to schedule a visit\n- 📊 **Queue status** — check real-time wait times\n- 🏥 **Clinics & departments** — facility information\n- ⏰ **Operating hours** — when clinics are open\n\nCould you rephrase your question or pick one of the topics above?";
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate slight delay for natural feel
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const response = getAIResponse(message);
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response };
    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
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
          <Card className="border-0 card-shadow overflow-hidden flex flex-col" style={{ height: "520px" }}>
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
