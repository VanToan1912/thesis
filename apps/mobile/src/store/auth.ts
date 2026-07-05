import { create } from "zustand";
import { clearToken, getToken, saveToken } from "../lib/auth-storage";

type User = {
  id: string;
  email: string;
  name: string;
  role: "RIDER" | "DRIVER" | "ADMIN";
  onboardingCompleted: boolean;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const authStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: true,
  hydrated: false,
  async setSession(token, user) {
    await saveToken(token);
    set({ token, user, hydrated: true, loading: false });
  },
  async clearSession() {
    await clearToken();
    set({ token: null, user: null, loading: false, hydrated: true });
  },
  async hydrate() {
    const token = await getToken();
    set({ token, hydrated: true, loading: false });
  },
  setUser(user) {
    set({ user });
  }
}));
