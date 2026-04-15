import { useState, useCallback } from "react";

export interface UnjaniClinic {
  name: string;
  province: string;
  district: string;
  lat: number;
  lng: number;
  distance?: number;
}

// Real Unjani Clinic locations across South Africa
const UNJANI_CLINICS: UnjaniClinic[] = [
  { name: "Unjani Clinic Tembisa", province: "Gauteng", district: "Ekurhuleni", lat: -26.0025, lng: 28.2268 },
  { name: "Unjani Clinic Mamelodi", province: "Gauteng", district: "City of Tshwane", lat: -25.7201, lng: 28.3986 },
  { name: "Unjani Clinic Soshanguve", province: "Gauteng", district: "City of Tshwane", lat: -25.5249, lng: 28.0953 },
  { name: "Unjani Clinic Soweto", province: "Gauteng", district: "City of Jhb", lat: -26.2485, lng: 27.8546 },
  { name: "Unjani Clinic Alexandra", province: "Gauteng", district: "City of Jhb", lat: -26.1076, lng: 28.1028 },
  { name: "Unjani Clinic Ivory Park", province: "Gauteng", district: "City of Jhb", lat: -25.9786, lng: 28.2001 },
  { name: "Unjani Clinic Katlehong", province: "Gauteng", district: "Ekurhuleni", lat: -26.3340, lng: 28.1527 },
  { name: "Unjani Clinic Vosloorus", province: "Gauteng", district: "Ekurhuleni", lat: -26.3514, lng: 28.2054 },
  { name: "Unjani Clinic Duduza", province: "Gauteng", district: "Ekurhuleni", lat: -26.3736, lng: 28.4147 },
  { name: "Unjani Clinic Sebokeng", province: "Gauteng", district: "Sedibeng", lat: -26.5828, lng: 27.8330 },
  { name: "Unjani Clinic KwaMashu", province: "KwaZulu Natal", district: "Ethekwini", lat: -29.7470, lng: 30.9694 },
  { name: "Unjani Clinic Umlazi", province: "KwaZulu Natal", district: "Ethekwini", lat: -29.9617, lng: 30.8861 },
  { name: "Unjani Clinic Inanda", province: "KwaZulu Natal", district: "Ethekwini", lat: -29.6991, lng: 30.8627 },
  { name: "Unjani Clinic Pietermaritzburg", province: "KwaZulu Natal", district: "Msunduzi", lat: -29.6006, lng: 30.3794 },
  { name: "Unjani Clinic Ladysmith", province: "KwaZulu Natal", district: "Amajuba", lat: -28.5597, lng: 29.7773 },
  { name: "Unjani Clinic Mdantsane", province: "Eastern Cape", district: "Buffalo City", lat: -32.9484, lng: 27.7592 },
  { name: "Unjani Clinic Komani", province: "Eastern Cape", district: "Chris Hani", lat: -31.8974, lng: 26.8753 },
  { name: "Unjani Clinic Port Elizabeth", province: "Eastern Cape", district: "Nelson Mandela", lat: -33.9608, lng: 25.6022 },
  { name: "Unjani Clinic Bloemfontein", province: "Free State", district: "Mangaung", lat: -29.1187, lng: 26.2140 },
  { name: "Unjani Clinic Welkom", province: "Free State", district: "Lejweleputswa", lat: -27.9777, lng: 26.7350 },
  { name: "Unjani Clinic Polokwane", province: "Limpopo", district: "Capricorn", lat: -23.9045, lng: 29.4688 },
  { name: "Unjani Clinic Rustenburg", province: "North West", district: "Bojanala", lat: -25.6715, lng: 27.2420 },
  { name: "Unjani Clinic Nelspruit", province: "Mpumalanga", district: "Ehlanzeni", lat: -25.4753, lng: 30.9694 },
  { name: "Unjani Clinic Witbank", province: "Mpumalanga", district: "Nkangala", lat: -25.8717, lng: 29.2355 },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useLocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyClinics, setNearbyClinics] = useState<UnjaniClinic[]>(UNJANI_CLINICS);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        const sorted = UNJANI_CLINICS.map((c) => ({
          ...c,
          distance: Math.round(getDistanceKm(latitude, longitude, c.lat, c.lng) * 10) / 10,
        })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        setNearbyClinics(sorted);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, loading, error, nearbyClinics, requestLocation };
};
