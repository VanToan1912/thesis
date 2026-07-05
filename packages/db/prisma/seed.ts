import { prisma } from "../src/index.ts";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ridewithme.app" },
    update: {},
    create: {
      email: "admin@ridewithme.app",
      name: "RideWithMe Admin",
      passwordHash,
      role: "ADMIN",
      provider: "EMAIL",
      onboardingCompleted: true
    }
  });

  await prisma.rider.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id }
  });

  const riderUser = await prisma.user.upsert({
    where: { email: "rider@ridewithme.app" },
    update: {},
    create: {
      email: "rider@ridewithme.app",
      name: "Demo Rider",
      passwordHash,
      role: "RIDER",
      provider: "EMAIL",
      onboardingCompleted: true
    }
  });

  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: {},
    create: { userId: riderUser.id }
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "driver@ridewithme.app" },
    update: {},
    create: {
      email: "driver@ridewithme.app",
      name: "Demo Driver",
      passwordHash,
      role: "DRIVER",
      provider: "EMAIL",
      onboardingCompleted: true
    }
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { licenseNumber: "1AB-2345" },
    update: {},
    create: {
      model: "Toyota Camry",
      type: "SEDAN",
      licenseNumber: "1AB-2345",
      color: "Black",
      capacity: 4
    }
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: { vehicleId: vehicle.id, status: "ONLINE", currentLat: 13.736717, currentLng: 100.523186 },
    create: {
      userId: driverUser.id,
      vehicleId: vehicle.id,
      status: "ONLINE",
      currentLat: 13.736717,
      currentLng: 100.523186
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
