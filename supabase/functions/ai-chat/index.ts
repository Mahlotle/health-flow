import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `You are HAS Assistant, an AI helper inside the HAS healthcare app for Unjani Clinics in South Africa.

You help patients with:
- Booking appointments (they go to /booking, choose clinic, service, date, and time slot)
- Checking live queue status (/queue page — shows "Now Serving", wait times, queue load per department)
- Finding nearby Unjani Clinics (location-based on the booking page)
- Understanding services offered at Unjani Clinics (primary healthcare, women's health, child health, chronic care, family planning, HIV/TB management, immunisations, minor ailments, wellness screening)
- Operating hours (typically Mon-Fri 08:00-16:30, 30-min slots)
- Explaining how the queue and approval process works (doctor approves bookings; patient gets a queue number and live countdown)
- Their medical history (visible on the Patient Dashboard once a clinician records a visit)

Tone: warm, concise, supportive. Format with markdown (bold, lists, emojis where helpful). Keep replies short (2–6 short bullets when listing). Never give medical diagnoses or prescriptions — for clinical advice, tell them to book an appointment or call emergency services for emergencies.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
