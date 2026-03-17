export const TOMTOM_KEY = "j1lyh5MvhkI4kpyp6wuKJ8hMByCyWvQi";

export interface TomTomResult {
  id: string;
  type: string;
  score: number;
  address: {
    freeformAddress?: string;
    streetName?: string;
    municipality?: string;
    countrySubdivision?: string;
    country?: string;
    localName?: string;
  };
  position: {
    lat: number;
    lon: number;
  };
  poi?: {
    name?: string;
    categories?: string[];
    classifications?: { code: string; names: { name: string }[] }[];
  };
  dist?: number;
}

export async function searchTomTom(
  query: string,
  lat: number,
  lng: number,
  limit = 10,
  radius = 150000
): Promise<TomTomResult[]> {
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    language: "pt-BR",
    countrySet: "BR",
    lat: String(lat),
    lon: String(lng),
    radius: String(radius),
    limit: String(limit),
    idxSet: "POI,PAD,Str,Xstr,Geo,Addr",
  });

  const encoded = encodeURIComponent(query);
  const res = await fetch(
    `https://api.tomtom.com/search/2/fuzzySearch/${encoded}.json?${params}`
  );

  if (!res.ok) throw new Error(`TomTom API error: ${res.status}`);

  const data = await res.json();
  return data.results || [];
}
