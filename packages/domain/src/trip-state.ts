import { Driver, Trip } from "./entities";
import { TripState } from "./strategies";

export class RequestedState implements TripState {
  request(trip: Trip) {
    trip.setState("REQUESTED");
  }
  start(_trip: Trip) {}
  assign(trip: Trip, driver: Driver) {
    trip.assignDriver(driver);
  }
  end(_trip: Trip) {}
}

export class AssignedState implements TripState {
  request(_trip: Trip) {}
  start(trip: Trip) {
    trip.startTrip();
  }
  assign(trip: Trip, driver: Driver) {
    trip.assignDriver(driver);
  }
  end(trip: Trip) {
    trip.endTrip();
  }
}

export class InProgressState implements TripState {
  request(_trip: Trip) {}
  start(trip: Trip) {
    trip.startTrip();
  }
  assign(trip: Trip, driver: Driver) {
    trip.assignDriver(driver);
  }
  end(trip: Trip) {
    trip.endTrip();
  }
}

export class CompletedState implements TripState {
  request(_trip: Trip) {}
  start(_trip: Trip) {}
  assign(_trip: Trip, _driver: Driver) {}
  end(trip: Trip) {
    trip.endTrip();
  }
}
