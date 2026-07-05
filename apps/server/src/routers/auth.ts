import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { env } from "../env";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["RIDER", "DRIVER"]).default("RIDER")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const googleSchema = z.object({
  idToken: z.string().min(1)
});

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const exists = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new Error("Email đã tồn tại");

    const user = await ctx.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await bcrypt.hash(input.password, 10),
        role: input.role,
        provider: "EMAIL",
        onboardingCompleted: false
      }
    });

    if (input.role === "RIDER") {
      await ctx.prisma.rider.create({ data: { userId: user.id } });
    } else if (input.role === "DRIVER") {
      await ctx.prisma.driver.create({
        data: {
          userId: user.id,
          status: "OFFLINE",
          currentLat: 0,
          currentLng: 0
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "30d" });
    return { token, user };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash) throw new Error("Thông tin đăng nhập không hợp lệ");
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new Error("Thông tin đăng nhập không hợp lệ");

    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "30d" });
    return { token, user };
  }),

  googleLogin: publicProcedure.input(googleSchema).mutation(async ({ ctx, input }) => {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`);
    if (!response.ok) {
      throw new Error("Không thể xác minh Google token");
    }

    const payload = await response.json() as {
      email: string;
      name?: string;
      sub: string;
      picture?: string;
    };

    if (!payload.email || !payload.sub) {
      throw new Error("Google token không hợp lệ");
    }

    let user = await ctx.prisma.user.findUnique({ where: { googleSub: payload.sub } });
    if (!user) {
      user = await ctx.prisma.user.upsert({
        where: { email: payload.email },
        update: { googleSub: payload.sub, provider: "GOOGLE", avatarUrl: payload.picture },
        create: {
          email: payload.email,
          name: payload.name ?? payload.email.split("@")[0],
          role: "RIDER",
          provider: "GOOGLE",
          googleSub: payload.sub,
          avatarUrl: payload.picture
        }
      });
    }

    const rider = await ctx.prisma.rider.findUnique({ where: { userId: user.id } });
    if (!rider) {
      await ctx.prisma.rider.create({ data: { userId: user.id } });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "30d" });
    return { token, user };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { rider: true, driver: { include: { vehicle: true } } }
    });
  }),

  completeOnboarding: protectedProcedure.input(z.object({
    acceptedTerms: z.boolean(),
    marketingOptIn: z.boolean().default(false)
  })).mutation(async ({ ctx, input }) => {
    return ctx.prisma.user.update({
      where: { id: ctx.userId },
      data: {
        onboardingCompleted: input.acceptedTerms,
        marketingOptIn: input.marketingOptIn
      }
    });
  }),

  updateProfile: protectedProcedure.input(z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(6).optional(),
    avatarUrl: z.string().url().optional()
  })).mutation(async ({ ctx, input }) => {
    return ctx.prisma.user.update({ where: { id: ctx.userId }, data: input });
  })
});
