export const FOURSQUARE_API_KEY = "fsq3dxO876rBbM6tRQhqku8AhG66B++0wCzqcRkwe96LV44=";

export interface FoursquarePlace {
  fsq_id: string;
  name: string;
  location: {
    address?: string;
    formatted_address?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
  categories: { name: string }[];
  distance?: number;
  geocodes?: {
    main?: { latitude: number; longitude: number };
  };
}

export async function searchFoursquarePlaces(
  query: string,
  lat: number,
  lng: number,
  limit = 10,
  radius = 50000
): Promise<FoursquarePlace[]> {
  const params = new URLSearchParams({
    query,
    ll: `${lat},${lng}`,
    radius: String(radius),
    limit: String(limit),
    language: "pt",
  });

  const res = await fetch(
    `https://api.foursquare.com/v3/places/search?${params}`,
    {
      headers: {
        Authorization: FOURSQUARE_API_KEY,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) throw new Error("Foursquare API error");

  const data = await res.json();
  return data.results || [];
}
