
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean;
  deviceId: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      deviceId: null,
      login: (username: string, password: string) => {
        if (username === "admin" && password === "Ragnarok") {
          const deviceId = crypto.randomUUID();
          set({ isAuthenticated: true, deviceId });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, deviceId: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
