import { RideSharingService } from "./ride-sharing";
import { Location, Vehicle } from "./entities";

export class RideSharingServiceDemo {
  static main(_args: string[]) {
    const service = RideSharingService.getInstance();
    const rider = service.registerRider("Demo Rider", "demo@ridewithme.app");
    service.registerDriver(
      "Demo Driver",
      "driver@example.com",
      new Vehicle("Toyota Vios", "SEDAN", "AB-12345"),
      new Location(100.5018, 13.7563)
    );
    return rider.id;
  }
}
