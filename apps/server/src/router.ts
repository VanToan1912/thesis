import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { mapRouter } from "./routers/map";
import { ridesRouter } from "./routers/rides";
import { adminRouter } from "./routers/admin";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  map: mapRouter,
  rides: ridesRouter,
  admin: adminRouter
});

export type AppRouter = typeof appRouter;
