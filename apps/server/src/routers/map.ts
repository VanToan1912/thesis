import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { env } from "../env";

async function googlePlacesAutocomplete(query: string) {
  if (!env.GOOGLE_MAPS_API_KEY) {
    return [
      { placeId: "demo-1", description: `Demo ${query} Center`, lat: 13.7563, lng: 100.5018 },
      { placeId: "demo-2", description: `Demo ${query} Mall`, lat: 13.7367, lng: 100.5232 }
    ];
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", query);
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
  url.searchParams.set("language", "vi");
  const res = await fetch(url);
  const json = await res.json();
  return (json.predictions ?? []).map((item: any) => ({
    placeId: item.place_id,
    description: item.description
  }));
}

export const mapRouter = createTRPCRouter({
  autocomplete: publicProcedure.input(z.object({ query: z.string().min(2) })).query(async ({ input }) => {
    return googlePlacesAutocomplete(input.query);
  }),

  resolvePlace: publicProcedure.input(z.object({ placeId: z.string() })).query(async ({ input }) => {
    if (!env.GOOGLE_MAPS_API_KEY) {
      return { latitude: 13.7563, longitude: 100.5018, description: "Demo place" };
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", input.placeId);
    url.searchParams.set("fields", "geometry,name,formatted_address");
    url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
    const res = await fetch(url);
    const json = await res.json();
    const location = json.result?.geometry?.location;
    return {
      latitude: location?.lat ?? 13.7563,
      longitude: location?.lng ?? 100.5018,
      description: json.result?.formatted_address ?? json.result?.name ?? "Unknown"
    };
  }),

  nearbyDrivers: publicProcedure.input(z.object({
    latitude: z.number(),
    longitude: z.number(),
    rideType: z.enum(["AUTO", "SEDAN", "SUV"]).optional()
  })).query(async ({ ctx, input }) => {
    const drivers = await ctx.prisma.driver.findMany({
      where: {
        status: "ONLINE",
        ...(input.rideType ? { vehicle: { type: input.rideType } } : {})
      },
      include: { user: true, vehicle: true }
    });

    return drivers.map((driver) => ({
      id: driver.id,
      name: driver.user.name,
      type: driver.vehicle?.type ?? "SEDAN",
      latitude: driver.currentLat,
      longitude: driver.currentLng,
      rating: driver.rating
    }));
  })
});
