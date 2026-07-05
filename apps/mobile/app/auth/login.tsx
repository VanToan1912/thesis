import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Screen } from "../../src/components/Screen";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Card } from "../../src/components/Card";
import { colors } from "../../src/theme";
import { trpc } from "../../src/lib/api";
import { authStore } from "../../src/store/auth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("rider@ridewithme.app");
  const [password, setPassword] = useState("Password123!");
  const login = trpc.auth.login.useMutation();
  const googleLogin = trpc.auth.googleLogin.useMutation();
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: googleClientId,
    iosClientId: googleClientId,
    androidClientId: googleClientId,
    webClientId: googleClientId
  });

  useEffect(() => {
    const idToken = response?.authentication?.idToken;
    if (!idToken) return;
    googleLogin.mutateAsync({ idToken }).then(async (result) => {
      await authStore.getState().setSession(result.token, result.user as any);
      router.replace("/(tabs)/home");
    }).catch((error: any) => {
      Alert.alert("Google login thất bại", error.message ?? "Vui lòng thử lại.");
    });
  }, [response]);

  const handleLogin = async () => {
    try {
      const result = await login.mutateAsync({ email, password });
      await authStore.getState().setSession(result.token, result.user as any);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Đăng nhập thất bại", error.message ?? "Vui lòng kiểm tra lại thông tin.");
    }
  };

  const handleGoogle = async () => {
    if (!request) {
      Alert.alert("Google login", "Thiếu cấu hình Google client ID.");
      return;
    }
    await promptAsync();
  };

  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Card>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#6f7f9c" style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu" placeholderTextColor="#6f7f9c" secureTextEntry style={styles.input} />
          <PrimaryButton title="Đăng nhập" onPress={handleLogin} disabled={login.isPending} />
          <Pressable onPress={handleGoogle} style={styles.googleButton}>
            <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
          </Pressable>
        </Card>
        <Pressable onPress={() => router.push("/auth/register")}>
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: "center", gap: 16 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900" },
  input: { backgroundColor: colors.panel2, color: colors.text, padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  link: { color: colors.accent2, fontWeight: "700", textAlign: "center" },
  googleButton: { marginTop: 12, paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: "#ffffff10" },
  googleText: { color: colors.text, fontWeight: "700" }
});
