import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
      
      logout: () => {
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Clear state
        set({ user: null, isAuthenticated: false });
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },
      
      initializeAuth: () => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          const storedUser = get().user;
          
          if (token && storedUser) {
            set({ user: storedUser, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);