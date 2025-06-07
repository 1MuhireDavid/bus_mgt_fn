import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { User } from '@/types/index';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 Checking authentication...');
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token found:', !!token);
      
      if (token) {
        console.log('📡 Fetching user profile...');
        const userData = await authService.getProfile();
        console.log('✅ User data received:', userData);
        setUser(userData);
        setError(null);
      } else {
        console.log('❌ No token found');
        router.push('/login')
        setError('No authentication token found');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
      console.log('✅ Auth check completed');
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 Attempting login for:', username);
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(username, password);
      console.log('✅ Login response:', response);
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(response.data.user);
      
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out...');
    try {
      await authService.logout();
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    setUser(null);
    setError(null);
    router.push('/login');
  };

  const hasRole = (role: string): boolean => {
    return user?.user_roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      hasRole,
      hasAnyRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};