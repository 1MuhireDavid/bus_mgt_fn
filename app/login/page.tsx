'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Bus, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setUser,initializeAuth,user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
    const redirectToDashboard = (userData: any) => {
    const isAdmin = userData.user_roles?.includes('admin') || 
                   userData.user_roles?.includes('Company Admin') ||
                   userData.is_superuser;
    
    if (isAdmin) {
      router.push('/admin');
      return;
    }

    const userRoles = userData.user_roles || [];
    
    // Check for specific attendant roles
    const isFuelAttendant = userRoles.includes('Fuel Attendant');
    const isCarWashAttendant = userRoles.includes('Car Wash Attendant');
    const isGarageAttendant = userRoles.includes('maintenance');
    const isConductor = userRoles.includes('conductor');

    
    if (isFuelAttendant) {
      router.push('/fuel_attendant');
    } else if (isCarWashAttendant) {
      router.push('/car_wash');
    } else if (isGarageAttendant) {
      router.push('/garage/maintenance');
    } else if (isConductor) {
      router.push('/conductor');
    } else {
      router.push('/');
    }
    

  
  };
    if (user) {
      redirectToDashboard(user);
    }

  }, [user, router,initializeAuth]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(credentials);
      const { data } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Set user in store
      setUser(data);
      redirectToDashboard(data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Bus className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Bus Management System</CardTitle>
          <p className="text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
