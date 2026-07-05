import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Screen } from "../../src/components/Screen";
import { Card } from "../../src/components/Card";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { colors } from "../../src/theme";
import { trpc } from "../../src/lib/api";
import { useRideStore } from "../../src/store/ride";

export default function HomeScreen() {
  const ride = useRideStore();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [activeField, setActiveField] = useState<"pickup" | "dropoff" | null>(null);

  const autocomplete = trpc.map.autocomplete.useQuery(
    { query: activeField === "pickup" ? pickupQuery : dropoffQuery },
    { enabled: !!activeField && (activeField === "pickup" ? pickupQuery.length > 1 : dropoffQuery.length > 1) }
  );
  const nearbyDrivers = trpc.map.nearbyDrivers.useQuery(
    { latitude: location?.latitude ?? 13.7563, longitude: location?.longitude ?? 100.5018, rideType: ride.draft.rideType },
    { refetchInterval: 5000, enabled: !!location }
  );
  const estimate = trpc.rides.estimate.useQuery(
    {
      pickup: ride.draft.pickup ?? { latitude: location?.latitude ?? 13.7563, longitude: location?.longitude ?? 100.5018, address: "Vị trí hiện tại" },
      dropoff: ride.draft.dropoff ?? { latitude: 13.7367, longitude: 100.5232, address: "Điểm đến" },
      rideType: ride.draft.rideType,
      note: ride.draft.note
    },
    { enabled: !!ride.draft.pickup && !!ride.draft.dropoff }
  );
  const resolvePlace = trpc.map.resolvePlace.useMutation();
  const createCheckout = trpc.rides.createCheckout.useMutation();
  const confirmPayment = trpc.rides.confirmPayment.useMutation();

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== "granted") return;
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(current.coords);
      ride.setPickup({
        description: "Vị trí hiện tại",
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      });
      setPickupQuery("Vị trí hiện tại");
    });
  }, []);

  const suggestions = useMemo(() => {
    const data = autocomplete.data ?? [];
    return data.map((item: any) => ({
      description: item.description,
      latitude: item.lat ?? item.latitude,
      longitude: item.lng ?? item.longitude,
      placeId: item.placeId
    }));
  }, [autocomplete.data]);
  const openPayment = async () => {
    if (!ride.draft.pickup || !ride.draft.dropoff) {
      Alert.alert("Thiếu thông tin", "Hãy chọn điểm đón và điểm đến.");
      return;
    }

    const checkout = await createCheckout.mutateAsync({
      pickup: ride.draft.pickup,
      dropoff: ride.draft.dropoff,
      rideType: ride.draft.rideType,
      note: ride.draft.note
    });

    const result = await WebBrowser.openAuthSessionAsync(checkout.paymentUrl, Linking.createURL("payment-return"));
    if (result.type !== "success" || !result.url) return;

    const parsed = Linking.parse(result.url);
    const query: Record<string, string> = {};
    Object.entries(parsed.queryParams ?? {}).forEach(([key, value]) => {
      if (typeof value === "string") query[key] = value;
    });

    const confirmation = await confirmPayment.mutateAsync({ query });
    if (confirmation.success) {
      ride.reset();
      ride.setTripId(confirmation.tripId);
      Alert.alert("Thanh toán thành công", "Chuyến xe đã được tạo.");
    } else {
      Alert.alert("Thanh toán thất bại", "VNPay trả về giao dịch không thành công.");
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>RideWithMe</Text>
          <Text style={styles.headline}>Đặt xe nhanh, đẹp và rõ ràng.</Text>
        </View>

        <View style={styles.mapWrap}>
          <MapView
            style={StyleSheet.absoluteFill}
            region={{
              latitude: location?.latitude ?? 13.7563,
              longitude: location?.longitude ?? 100.5018,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            }}
            showsUserLocation
            followsUserLocation
          >
            {nearbyDrivers.data?.map((driver) => (
              <Marker key={driver.id} coordinate={{ latitude: driver.latitude, longitude: driver.longitude }} title={driver.name} description={driver.type} />
            ))}
          </MapView>
        </View>

        <View style={styles.form}>
          <Card>
            <Text style={styles.label}>Điểm đón</Text>
            <TextInput
              value={pickupQuery}
              onChangeText={(value) => {
                setPickupQuery(value);
                setActiveField("pickup");
              }}
              onFocus={() => setActiveField("pickup")}
              placeholder="Tìm điểm đón"
              placeholderTextColor="#6f7f9c"
              style={styles.input}
            />
            <Text style={styles.label}>Điểm đến</Text>
            <TextInput
              value={dropoffQuery}
              onChangeText={(value) => {
                setDropoffQuery(value);
                setActiveField("dropoff");
              }}
              onFocus={() => setActiveField("dropoff")}
              placeholder="Tìm điểm đến"
              placeholderTextColor="#6f7f9c"
              style={styles.input}
            />
            {suggestions.length > 0 && activeField ? (
              <FlatList
                data={suggestions}
                keyExtractor={(item, index) => item.placeId ?? `${item.description}-${index}`}
                style={{ maxHeight: 180 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.suggestion}
                    onPress={async () => {
                      const resolved = item.placeId ? await resolvePlace.mutateAsync({ placeId: item.placeId }) : null;
                      const selected = {
                        description: resolved?.description ?? item.description,
                        latitude: resolved?.latitude ?? item.latitude ?? location?.latitude ?? 13.7563,
                        longitude: resolved?.longitude ?? item.longitude ?? location?.longitude ?? 100.5018
                      };
                      if (activeField === "pickup") {
                        ride.setPickup(selected);
                        setPickupQuery(selected.description);
                      } else {
                        ride.setDropoff(selected);
                        setDropoffQuery(selected.description);
                      }
                      setActiveField(null);
                    }}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </Pressable>
                )}
              />
            ) : null}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Xe gần bạn</Text>
            <FlatList
              data={nearbyDrivers.data ?? []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.driverChip}>
                  <Text style={styles.driverName}>{item.name}</Text>
                  <Text style={styles.driverMeta}>{item.type} • {item.rating.toFixed(1)}</Text>
                </View>
              )}
            />
          </Card>

          {estimate.data ? (
            <Card>
              <Text style={styles.sectionTitle}>Xác nhận chuyến đi</Text>
              <Text style={styles.meta}>Lộ trình: {ride.draft.pickup?.description ?? "Điểm đón"} → {ride.draft.dropoff?.description ?? "Điểm đến"}</Text>
              <Text style={styles.meta}>Thời gian ước tính: {estimate.data.durationMinutes} phút</Text>
              <Text style={styles.meta}>Giá cước: {estimate.data.fare.toLocaleString("vi-VN")} VND</Text>
            </Card>
          ) : null}

          <PrimaryButton title="Thanh toán VNPay" onPress={openPayment} disabled={createCheckout.isPending} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  header: { gap: 6 },
  brand: { color: colors.accent, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  headline: { color: colors.text, fontSize: 26, fontWeight: "900" },
  mapWrap: { height: 220, borderRadius: 24, overflow: "hidden", backgroundColor: "#0d1727" },
  form: { gap: 12, flex: 1 },
  label: { color: colors.muted, marginBottom: 6, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: colors.panel2, color: colors.text, padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  suggestion: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  suggestionText: { color: colors.text },
  sectionTitle: { color: colors.text, fontWeight: "800", marginBottom: 10, fontSize: 16 },
  driverChip: { backgroundColor: colors.panel2, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, marginRight: 10, minWidth: 120 },
  driverName: { color: colors.text, fontWeight: "800" },
  driverMeta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  meta: { color: colors.muted, marginBottom: 8, lineHeight: 20 }
});
