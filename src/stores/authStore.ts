import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token: string, user: User | null) =>
        set({ token, user, isAuthenticated: true }),
      logout: () => {
        // Drop cached pages so the next person to sign in on this browser
        // doesn't see the previous admin's data.
        queryClient.clear();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'questunit-auth',
    }
  )
);
