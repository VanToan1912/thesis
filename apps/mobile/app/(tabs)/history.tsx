import { FlatList, Text, View, StyleSheet } from "react-native";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { colors } from "../../src/theme";
import { trpc } from "../../src/lib/api";

export default function RideHistoryScreen() {
  const history = trpc.rides.history.useQuery();

  return (
    <Screen>
      <View style={styles.page}>
        <Text style={styles.title}>Lịch sử chuyến đi</Text>
        <FlatList
          data={history.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.cardTitle}>{item.pickupAddress} → {item.dropoffAddress}</Text>
              <Text style={styles.meta}>{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}</Text>
              <Text style={styles.meta}>Trạng thái: {item.status} • Thanh toán: {item.paymentStatus}</Text>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginBottom: 16 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  meta: { color: colors.muted, marginTop: 8 }
});
