import { DriverStatus, RideType, TripStatus } from "@ridewithme/shared";

export class Location {
  constructor(
    public longitude: number,
    public latitude: number,
    public address?: string
  ) {}

  distanceTo(other: Location) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const r = 6371;
    const dLat = toRad(other.latitude - this.latitude);
    const dLon = toRad(other.longitude - this.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(this.latitude)) * Math.cos(toRad(other.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export class Vehicle {
  constructor(
    public model: string,
    public type: RideType,
    public licenseNumber: string
  ) {}
}

export class Rider {
  constructor(
    public id: string,
    public name: string,
    public contact: string
  ) {}
}

export class Driver {
  constructor(
    public id: string,
    public name: string,
    public vehicle: Vehicle,
    public currentLocation: Location,
    public status: DriverStatus = "OFFLINE"
  ) {}

  onUpdate(_trip: Trip): void {}
}

export interface TripObserver {
  onUpdate(trip: Trip): void;
}

export class Trip {
  public observers: TripObserver[] = [];

  constructor(
    public id: string,
    public rider: Rider,
    public pickupLocation: Location,
    public dropoffLocation: Location,
    public rideType: RideType,
    public status: TripStatus = "REQUESTED",
    public driver?: Driver,
    public fare = 0
  ) {}

  addObserver(observer: TripObserver) {
    this.observers.push(observer);
  }

  assignDriver(driver: Driver) {
    this.driver = driver;
    this.status = "ASSIGNED";
    this.notifyObservers();
  }

  setState(status: TripStatus) {
    this.status = status;
    this.notifyObservers();
  }

  startTrip() {
    this.status = "IN_PROGRESS";
    this.notifyObservers();
  }

  endTrip() {
    this.status = "COMPLETED";
    this.notifyObservers();
  }

  notifyObservers() {
    this.observers.forEach((observer) => observer.onUpdate(this));
  }
}
