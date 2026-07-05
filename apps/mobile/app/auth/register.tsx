import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Card } from "../../src/components/Card";
import { colors } from "../../src/theme";
import { trpc } from "../../src/lib/api";
import { authStore } from "../../src/store/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("Demo Rider");
  const [email, setEmail] = useState("new@ridewithme.app");
  const [password, setPassword] = useState("Password123!");
  const register = trpc.auth.register.useMutation();

  const handleRegister = async () => {
    try {
      const result = await register.mutateAsync({ name, email, password, role: "RIDER" });
      await authStore.getState().setSession(result.token, result.user as any);
      router.replace("/onboarding");
    } catch (error: any) {
      Alert.alert("Đăng ký thất bại", error.message ?? "Vui lòng thử lại.");
    }
  };

  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Card>
          <TextInput value={name} onChangeText={setName} placeholder="Tên hiển thị" placeholderTextColor="#6f7f9c" style={styles.input} />
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#6f7f9c" style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu" placeholderTextColor="#6f7f9c" secureTextEntry style={styles.input} />
          <PrimaryButton title="Đăng ký" onPress={handleRegister} disabled={register.isPending} />
        </Card>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Đã có tài khoản? Quay lại đăng nhập</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: "center", gap: 16 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900" },
  input: { backgroundColor: colors.panel2, color: colors.text, padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  link: { color: colors.accent2, fontWeight: "700", textAlign: "center" }
});
