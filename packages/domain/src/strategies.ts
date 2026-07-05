import { Location, Driver, Trip, Vehicle } from "./entities";
import { RideType } from "@ridewithme/shared";

export interface DriverMatchingStrategy {
  findDrivers(drivers: Driver[], location: Location, rideType: RideType): Driver[];
}

export interface PricingStrategy {
  calculateFare(pickup: Location, dropoff: Location, rideType: RideType): number;
}

export class NearestDriverMatchingStrategy implements DriverMatchingStrategy {
  static MAX_DISTANCE_KM = 8;

  findDrivers(drivers: Driver[], location: Location, rideType: RideType) {
    return drivers
      .filter((driver) => driver.status === "ONLINE" && driver.vehicle.type === rideType)
      .map((driver) => ({
        driver,
        distance: driver.currentLocation.distanceTo(location)
      }))
      .filter((entry) => entry.distance <= NearestDriverMatchingStrategy.MAX_DISTANCE_KM)
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.driver);
  }
}

export class FlatRatePricingStrategy implements PricingStrategy {
  static FLAT_RATE = 4.5;
  static BASE_FARE = 1.8;

  calculateFare(pickup: Location, dropoff: Location, _rideType: RideType) {
    return FlatRatePricingStrategy.BASE_FARE + FlatRatePricingStrategy.FLAT_RATE + pickup.distanceTo(dropoff) * 1.15;
  }
}

export class VehicleBasedPricingStrategy implements PricingStrategy {
  static RATE_PER_KM: Record<RideType, number> = {
    AUTO: 0.8,
    SEDAN: 1.2,
    SUV: 1.6
  };
  static BASE_FARE = 2;

  calculateFare(pickup: Location, dropoff: Location, rideType: RideType) {
    return VehicleBasedPricingStrategy.BASE_FARE + pickup.distanceTo(dropoff) * VehicleBasedPricingStrategy.RATE_PER_KM[rideType];
  }
}

export interface TripState {
  request(trip: Trip): void;
  start(trip: Trip): void;
  assign(trip: Trip, driver: Driver): void;
  end(trip: Trip): void;
}
