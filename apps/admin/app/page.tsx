"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { trpc } from "../src/lib/api";
import { clearAdminToken, getAdminToken, setAdminToken } from "../src/lib/auth";

function Card({ children }: { children: ReactNode }) {
  return <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 16 }}>{children}</div>;
}

export default function Page() {
  const [email, setEmail] = useState("admin@ridewithme.app");
  const [password, setPassword] = useState("Password123!");
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation();
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!token });
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: !!token && me.data?.role === "ADMIN" });
  const users = trpc.admin.users.useQuery(undefined, { enabled: !!token && me.data?.role === "ADMIN" });
  const trips = trpc.admin.trips.useQuery(undefined, { enabled: !!token && me.data?.role === "ADMIN" });
  const drivers = trpc.admin.drivers.useQuery(undefined, { enabled: !!token && me.data?.role === "ADMIN" });
  const setDriverStatus = trpc.admin.setDriverStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([drivers.refetch(), stats.refetch()]);
    }
  });

  useEffect(() => {
    const existing = getAdminToken();
    setToken(existing);
    setReady(true);
  }, []);

  const handleLogin = async () => {
    const result = await login.mutateAsync({ email, password });
    setAdminToken(result.token);
    setToken(result.token);
  };

  const handleLogout = () => {
    clearAdminToken();
    setToken(null);
  };

  if (!ready) {
    return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading...</main>;
  }

  if (!token) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "min(100%, 420px)", display: "grid", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 40 }}>RideWithMe Admin</h1>
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={inputStyle} />
              <button onClick={handleLogin} style={buttonStyle}>Đăng nhập admin</button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (me.data && me.data.role !== "ADMIN") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Card>Access denied. Tài khoản hiện tại không có quyền admin.</Card>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", gap: 18 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--accent)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", fontSize: 12 }}>RideWithMe</div>
          <h1 style={{ margin: "6px 0 0", fontSize: 36 }}>Admin dashboard</h1>
        </div>
        <button onClick={handleLogout} style={buttonStyle}>Đăng xuất</button>
      </header>

      <section style={gridStyle}>
        <Card><strong>Users</strong><div style={metricStyle}>{stats.data?.users ?? "..."}</div></Card>
        <Card><strong>Trips</strong><div style={metricStyle}>{stats.data?.trips ?? "..."}</div></Card>
        <Card><strong>Drivers</strong><div style={metricStyle}>{stats.data?.drivers ?? "..."}</div></Card>
        <Card><strong>Revenue</strong><div style={metricStyle}>{Number(stats.data?.revenue ?? 0).toLocaleString("vi-VN")} VND</div></Card>
      </section>

      <section style={sectionStyle}>
        <Card>
          <h2>Users</h2>
          <table style={tableStyle}>
            <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Onboarding</th></tr></thead>
            <tbody>{(users.data ?? []).map((user: any) => (
              <tr key={user.id}><td>{user.email}</td><td>{user.name}</td><td>{user.role}</td><td>{user.onboardingCompleted ? "Yes" : "No"}</td></tr>
            ))}</tbody>
          </table>
        </Card>

        <Card>
          <h2>Trips</h2>
          <table style={tableStyle}>
            <thead><tr><th>Pickup</th><th>Dropoff</th><th>Status</th><th>Fare</th></tr></thead>
            <tbody>{(trips.data ?? []).map((trip: any) => (
              <tr key={trip.id}><td>{trip.pickupAddress}</td><td>{trip.dropoffAddress}</td><td>{trip.status}</td><td>{Number(trip.fare).toLocaleString("vi-VN")}</td></tr>
            ))}</tbody>
          </table>
        </Card>

        <Card>
          <h2>Drivers</h2>
          <table style={tableStyle}>
            <thead><tr><th>Name</th><th>Vehicle</th><th>Status</th></tr></thead>
            <tbody>{(drivers.data ?? []).map((driver: any) => (
              <tr key={driver.id}>
                <td>{driver.user.name}</td>
                <td>{driver.vehicle?.model ?? "-"}</td>
                <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{driver.status}</span>
                  <button onClick={() => setDriverStatus.mutate({ driverId: driver.id, status: "ONLINE" })} style={smallButton}>Online</button>
                  <button onClick={() => setDriverStatus.mutate({ driverId: driver.id, status: "OFFLINE" })} style={smallButton}>Offline</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </section>
    </main>
  );
}

const inputStyle: CSSProperties = { padding: "14px 16px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--text)" };
const buttonStyle: CSSProperties = { padding: "12px 16px", borderRadius: 14, border: 0, background: "var(--accent)", color: "#04111b", fontWeight: 800, cursor: "pointer" };
const gridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 };
const metricStyle: CSSProperties = { fontSize: 30, fontWeight: 900, marginTop: 8 };
const sectionStyle: CSSProperties = { display: "grid", gap: 14 };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", marginTop: 12 };
const smallButton: CSSProperties = { padding: "8px 10px", borderRadius: 10, border: "1px solid var(--line)", background: "transparent", color: "var(--text)", cursor: "pointer" };
