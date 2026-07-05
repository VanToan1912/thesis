import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTrpcClient } from "../src/lib/api";
import { authStore } from "../src/store/auth";
import { Screen } from "../src/components/Screen";
import { colors } from "../src/theme";

const queryClient = new QueryClient();
const trpcClient = createTrpcClient();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const auth = authStore();

  useEffect(() => {
    auth.hydrate().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "auth" || segments[0] === "onboarding";
    if (!auth.token && !inAuth) {
      router.replace("/onboarding");
    }
    if (auth.token && inAuth) {
      router.replace("/(tabs)/home");
    }
  }, [ready, auth.token, segments]);

  if (!ready || auth.loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </trpc.Provider>
    </QueryClientProvider>
  );
}
