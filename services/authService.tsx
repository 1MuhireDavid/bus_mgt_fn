const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class AuthService {
  async login(username: string, password: string) {
    
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Login failed:', errorData);
      throw new Error(errorData?.message || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async getProfile() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE}/auth/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Profile fetch failed:', errorData);
      
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Session expired');
      }
      
      throw new Error(errorData?.message || `Failed to get profile: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
    } catch (error) {
      console.error('❌ Logout error (ignored):', error);
      // Ignore logout errors - we'll clear tokens anyway
    }
  }
}

export const authService = new AuthService();