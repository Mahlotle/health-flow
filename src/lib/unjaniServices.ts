// Actual services provided at Unjani Clinics in South Africa
// Source: unjaniclinic.co.za — Unjani is a nurse-led primary healthcare network
export const UNJANI_SERVICES = [
  "General Consultations",
  "Chronic Disease Management",
  "HIV Testing & Counselling",
  "Family Planning",
  "Immunisations",
  "Maternal & Child Health",
  "Wellness Screening",
  "Minor Ailments & Injuries",
] as const;

export type UnjaniService = typeof UNJANI_SERVICES[number];
