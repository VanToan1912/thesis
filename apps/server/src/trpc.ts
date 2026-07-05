import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { prisma } from "@ridewithme/db";
import type { UserRole } from "@ridewithme/shared";

export type Context = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  prisma: typeof prisma;
  userId?: string;
  role?: UserRole;
};

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(authHeader.slice(7), env.JWT_SECRET) as { userId: string; role: UserRole };
      return { req, res, prisma, userId: payload.userId, role: payload.role };
    } catch {
      return { req, res, prisma };
    }
  }

  return { req, res, prisma };
}

const t = initTRPC.context<Context>().create();

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      role: ctx.role
    }
  });
});

const requireRole = (roles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.userId || !ctx.role || !roles.includes(ctx.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth);
export const roleProcedure = (roles: UserRole[]) => t.procedure.use(requireRole(roles));
export const createTRPCRouter = t.router;
