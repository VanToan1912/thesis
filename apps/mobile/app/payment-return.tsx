import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../src/theme";

export default function PaymentReturnScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.title}>{params.status === "success" ? "Thanh toán thành công" : "Thanh toán thất bại"}</Text>
      <Text style={styles.meta}>Đang đồng bộ kết quả giao dịch...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  meta: { color: colors.muted }
});
