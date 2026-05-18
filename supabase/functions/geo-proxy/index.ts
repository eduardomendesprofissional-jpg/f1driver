import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_KEY") || "AIzaSyDE1pRwXHYINMp6fmtA9JTrvgNzxn5D5MQ";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function googlePlacesText(body: any) {
  const { query, lat, lng, radiusMeters = 100000 } = body;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: 10,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters } },
    }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

async function googlePlacesNearby(body: any) {
  const { type, lat, lng, radiusMeters = 5000 } = body;
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types",
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: 10,
      languageCode: "pt-BR",
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters } },
    }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

async function googleReverse(body: any) {
  const { lat, lng } = body;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}&language=pt-BR&region=BR`,
  );
  return { ok: res.ok, status: res.status, data: await res.json() };
}

async function osrmDirections(originLat: number, originLng: number, destLat: number, destLng: number) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=polyline&steps=true&annotations=false`;
  const res = await fetch(url, { headers: { "User-Agent": "F1Driver/1.0" } });
  const raw = await res.json();
  const r = raw?.routes?.[0];
  if (!r) {
    return { ok: false, status: res.status, data: { status: "ZERO_RESULTS", routes: [] } };
  }
  const leg = r.legs?.[0];
  const adapted = {
    status: "OK",
    routes: [
      {
        overview_polyline: { points: r.geometry || "" },
        legs: [
          {
            distance: { value: Math.round(r.distance || 0) },
            duration: { value: Math.round(r.duration || 0) },
            steps: (leg?.steps || []).map((s: any) => ({
              html_instructions: s.maneuver?.instruction || s.name || "",
              distance: { value: Math.round(s.distance || 0) },
              duration: { value: Math.round(s.duration || 0) },
              maneuver: s.maneuver?.type,
            })),
          },
        ],
      },
    ],
  };
  return { ok: true, status: 200, data: adapted };
}

async function googleDirections(body: any) {
  const { originLat, originLng, destLat, destLng } = body;
  // Try Routes API (new) first
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
        destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        languageCode: "pt-BR",
        regionCode: "BR",
      }),
    });
    if (res.ok) {
      const raw = await res.json();
      const r = raw?.routes?.[0];
      if (r) {
        return {
          ok: true,
          status: 200,
          data: {
            status: "OK",
            routes: [
              {
                overview_polyline: { points: r.polyline?.encodedPolyline || "" },
                legs: [
                  {
                    distance: { value: r.distanceMeters || 0 },
                    duration: { value: Math.round(Number(String(r.duration || "0s").replace("s", "")) || 0) },
                    steps: (r.legs?.[0]?.steps || []).map((s: any) => ({
                      html_instructions: s.navigationInstruction?.instructions || "",
                      distance: { value: s.distanceMeters || 0 },
                      duration: { value: Math.round(Number(String(s.staticDuration || "0s").replace("s", "")) || 0) },
                      maneuver: s.navigationInstruction?.maneuver,
                    })),
                  },
                ],
              },
            ],
          },
        };
      }
    }
  } catch (_) {
    // fall through to OSRM
  }
  // Fallback: OSRM (free, no key required)
  return await osrmDirections(originLat, originLng, destLat, destLng);
}

async function nominatimSearch(body: any) {
  const { query, lat, lng, radiusMeters = 100000 } = body;
  const dLat = radiusMeters / 111000;
  const dLng = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));
  const viewbox = `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=pt-BR&countrycodes=br&viewbox=${viewbox}&bounded=0&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": "F1Driver/1.0", "Accept-Language": "pt-BR" } });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

async function nominatimReverse(body: any) {
  const { lat, lng } = body;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`;
  const res = await fetch(url, { headers: { "User-Agent": "F1Driver/1.0", "Accept-Language": "pt-BR" } });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const op = body?.op as string;
    switch (op) {
      case "google_text": return json(await googlePlacesText(body));
      case "google_nearby": return json(await googlePlacesNearby(body));
      case "google_reverse": return json(await googleReverse(body));
      case "google_directions": return json(await googleDirections(body));
      case "nominatim_search": return json(await nominatimSearch(body));
      case "nominatim_reverse": return json(await nominatimReverse(body));
      default: return json({ error: "unknown_op" }, 400);
    }
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
