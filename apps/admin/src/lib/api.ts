import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { getAdminToken } from "./auth";

export const trpc = createTRPCReact<any>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/trpc`,
        headers() {
          const token = getAdminToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        }
      })
    ]
  });
}
