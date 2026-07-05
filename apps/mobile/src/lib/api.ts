import Constants from "expo-constants";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { authStore } from "../store/auth";

export const trpc = createTRPCReact<any>();

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        headers() {
          const token = authStore.getState().token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        }
      })
    ]
  });
}
