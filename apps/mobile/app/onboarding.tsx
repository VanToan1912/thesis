import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../src/components/Screen";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { Card } from "../src/components/Card";
import { colors } from "../src/theme";

export default function Onboarding() {
  const router = useRouter();
  return (
    <Screen>
      <LinearGradient colors={["#0b1627", "#07111f", "#0e1d33"]} style={styles.hero}>
        <Text style={styles.kicker}>RideWithMe</Text>
        <Text style={styles.title}>Di chuyển mượt mà, đặt xe trong vài chạm.</Text>
        <Text style={styles.subtitle}>
          Trải nghiệm mobile-first, bản đồ thời gian thực, thanh toán VNPay và quản lý chuyến đi rõ ràng.
        </Text>
      </LinearGradient>
      <View style={styles.content}>
        <Card>
          <Text style={styles.stepTitle}>Onboarding chuyên nghiệp</Text>
          <Text style={styles.stepText}>Giải thích nhanh giá trị app, bảo mật tài khoản và cách thanh toán an toàn.</Text>
        </Card>
        <Card>
          <Text style={styles.stepTitle}>Tài khoản linh hoạt</Text>
          <Text style={styles.stepText}>Email/mật khẩu, đăng nhập Google và quyền truy cập rõ ràng cho rider, driver, admin.</Text>
        </Card>
        <PrimaryButton title="Bắt đầu" onPress={() => router.replace("/auth/login")} style={{ marginTop: 12 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1.2, padding: 24, justifyContent: "flex-end", gap: 12 },
  kicker: { color: colors.accent, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 38, lineHeight: 44, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  content: { flex: 1, padding: 20, gap: 12 },
  stepTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
  stepText: { color: colors.muted, lineHeight: 21 }
});
