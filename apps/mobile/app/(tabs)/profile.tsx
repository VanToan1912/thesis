import { Alert, Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { colors } from "../../src/theme";
import { trpc } from "../../src/lib/api";
import { authStore } from "../../src/store/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const me = trpc.auth.me.useQuery();

  const signOut = async () => {
    await authStore.getState().clearSession();
    router.replace("/auth/login");
  };

  return (
    <Screen>
      <View style={styles.page}>
        <Text style={styles.title}>Hồ sơ cá nhân</Text>
        <Card>
          <Text style={styles.name}>{me.data?.name ?? "Guest"}</Text>
          <Text style={styles.meta}>{me.data?.email}</Text>
          <Text style={styles.meta}>Vai trò: {me.data?.role}</Text>
        </Card>
        <Card>
          <Text style={styles.section}>Recent Rides</Text>
          <Text style={styles.meta}>Phần này lấy dữ liệu từ tab Recent.</Text>
        </Card>
        <PrimaryButton title="Đăng xuất" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginBottom: 16 },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  meta: { color: colors.muted, marginTop: 8 },
  section: { color: colors.text, fontSize: 16, fontWeight: "800" }
});
