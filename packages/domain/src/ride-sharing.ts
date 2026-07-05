import { randomUUID } from "node:crypto";
import { Driver, Location, Rider, Trip, Vehicle } from "./entities";
import { DriverMatchingStrategy, PricingStrategy } from "./strategies";
import { NearestDriverMatchingStrategy, VehicleBasedPricingStrategy } from "./strategies";
import { RideType } from "@ridewithme/shared";

export class RideSharingService {
  private static instance: RideSharingService | null = null;

  pricingStrategy: PricingStrategy = new VehicleBasedPricingStrategy();
  driverMatchingStrategy: DriverMatchingStrategy = new NearestDriverMatchingStrategy();
  trips = new Map<string, Trip>();
  drivers = new Map<string, Driver>();
  riders = new Map<string, Rider>();

  static getInstance() {
    if (!RideSharingService.instance) {
      RideSharingService.instance = new RideSharingService();
    }
    return RideSharingService.instance;
  }

  setDriverMatchingStrategy(strategy: DriverMatchingStrategy) {
    this.driverMatchingStrategy = strategy;
  }

  setPricingStrategy(strategy: PricingStrategy) {
    this.pricingStrategy = strategy;
  }

  registerRider(name: string, contact: string) {
    const rider = new Rider(randomUUID(), name, contact);
    this.riders.set(rider.id, rider);
    return rider;
  }

  registerDriver(name: string, contact: string, vehicle: Vehicle, currentLocation: Location) {
    const driver = new Driver(randomUUID(), name, vehicle, currentLocation, "ONLINE");
    this.drivers.set(driver.id, driver);
    return driver;
  }

  requestRide(riderId: string, pickupLocation: Location, dropoffLocation: Location, rideType: RideType) {
    const rider = this.riders.get(riderId);
    if (!rider) throw new Error("Rider not found");
    const trip = new Trip(randomUUID(), rider, pickupLocation, dropoffLocation, rideType);
    trip.fare = this.pricingStrategy.calculateFare(pickupLocation, dropoffLocation, rideType);
    this.trips.set(trip.id, trip);
    return trip;
  }

  acceptRide(tripId: string, driverId: string) {
    const trip = this.trips.get(tripId);
    const driver = this.drivers.get(driverId);
    if (!trip || !driver) throw new Error("Trip or driver not found");
    trip.assignDriver(driver);
    return trip;
  }

  startTrip(tripId: string) {
    const trip = this.trips.get(tripId);
    if (!trip) throw new Error("Trip not found");
    trip.startTrip();
    return trip;
  }

  endTrip(tripId: string) {
    const trip = this.trips.get(tripId);
    if (!trip) throw new Error("Trip not found");
    trip.endTrip();
    return trip;
  }
}
