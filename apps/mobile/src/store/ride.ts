import { create } from "zustand";

export type LocationPick = {
  description: string;
  latitude: number;
  longitude: number;
};

type RideDraft = {
  pickup?: LocationPick;
  dropoff?: LocationPick;
  rideType: "AUTO" | "SEDAN" | "SUV";
  note?: string;
};

type RideState = {
  draft: RideDraft;
  tripId?: string;
  setPickup: (pickup?: LocationPick) => void;
  setDropoff: (dropoff?: LocationPick) => void;
  setRideType: (rideType: RideDraft["rideType"]) => void;
  setNote: (note: string) => void;
  reset: () => void;
  setTripId: (tripId?: string) => void;
};

export const useRideStore = create<RideState>((set) => ({
  draft: { rideType: "SEDAN" },
  setPickup: (pickup) => set((state) => ({ draft: { ...state.draft, pickup } })),
  setDropoff: (dropoff) => set((state) => ({ draft: { ...state.draft, dropoff } })),
  setRideType: (rideType) => set((state) => ({ draft: { ...state.draft, rideType } })),
  setNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),
  reset: () => set({ draft: { rideType: "SEDAN" }, tripId: undefined }),
  setTripId: (tripId) => set({ tripId })
}));
