import crypto from "node:crypto";

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateMinutes(distanceKm: number, rideType: string) {
  const speed = rideType === "SUV" ? 30 : rideType === "AUTO" ? 28 : 35;
  return Math.max(8, Math.round((distanceKm / speed) * 60));
}

export function formatVietnameseDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
}

export function hmacSha512(secret: string, data: string) {
  return crypto.createHmac("sha512", secret).update(data, "utf8").digest("hex");
}

export function sortObject(obj: Record<string, string | number | undefined>) {
  return Object.keys(obj)
    .filter((key) => obj[key] !== undefined && obj[key] !== "")
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = String(obj[key]);
      return acc;
    }, {});
}
