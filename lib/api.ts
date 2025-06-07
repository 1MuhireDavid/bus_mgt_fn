import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login/', credentials),
  logout: (refreshToken: string) =>
    api.post('/auth/logout/', { refresh_token: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
};

export const busAPI = {
  getAll: () => api.get('/fleet/buses/'),
  getById: (id: string) => api.get(`/fleet/buses/${id}/`),
  updateStatus: (id: string, status: string) =>
    api.post(`/fleet/buses/${id}/set_status/`, { status }),
};

// Add new API endpoints for drivers
export const driverAPI = {
  getAll: () => api.get('/fleet/drivers/'),
  getById: (id: string) => api.get(`/fleet/drivers/${id}/`),
  create: (data: any) => api.post('/fleet/drivers/', data),
  update: (id: string, data: any) => api.patch(`/fleet/drivers/${id}/`, data),
  delete: (id: string) => api.delete(`/fleet/drivers/${id}/`),
};

// Add new API endpoints for routes
export const routeAPI = {
  getAll: () => api.get('/operations/routes/'),
  getById: (id: string) => api.get(`/operations/routes/${id}/`),
  create: (data: any) => api.post('/operations/routes/', data),
  update: (id: string, data: any) => api.patch(`/operations/routes/${id}/`, data),
  delete: (id: string) => api.delete(`/operations/routes/${id}/`),
};

export const assignmentAPI = {
  getAll: () => api.get('/operations/assignments/'),
  create: (data: any) => api.post('/operations/assignments/', data),
  update: (id: string, data: any) => api.patch(`/operations/assignments/${id}/`, data),
  delete: (id: string) => api.delete(`/operations/assignments/${id}/`),
};

export const dashboardAPI = {
  getStats: () => api.get('/reports/bus-expenses/'),
  
  // Bus Expense Report
  getBusExpenseReport: (startDate: string, endDate: string, busId?: string) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    if (busId) {
      params.append('bus_id', busId);
    }
    
    return api.get(`/reports/bus-expenses/?${params.toString()}`);
  },
  
  // Maintenance Summary Report
  getMaintenanceSummary: () => api.get('/reports/maintenance-expenses/'),
  
  // Stock Status Report
  getStockStatus: () => api.get('/reports/stock-expenses/'),
};

export const maintenanceAPI = {
  getAll: () => api.get('/maintenance/'),
  getById: (id: string) => api.get(`/maintenance/${id}/`),
  create: (data: any) => api.post('/maintenance/', data),
  update: (id: string, data: any) => api.put(`/maintenance/${id}/`, data),
  delete: (id: string) => api.delete(`/maintenance/${id}/`),
};
export const maintenanceTypesAPI = {
  getAll: () => api.get('/maintenance-types/'),
  getById: (id: string) => api.get(`/maintenance-types/${id}/`),
  create: (data: any) => api.post('/maintenance-types/', data),
  update: (id: string, data: any) => api.put(`/maintenance-types/${id}/`, data),
  delete: (id: string) => api.delete(`/maintenance-types/${id}/`),
};


// Role Management API
export const roleAPI = {
  // Get all roles
  getAll: () => api.get('/roles/'),
  
  // Get single role with permissions
  getById: (id: string) => api.get(`/roles/${id}/`),
  
  // Create new role
  create: (data: {
    name: string;
    description: string;
    permission_ids: string[];
  }) => api.post('/roles/', data),
  
  // Update role
  update: (id: string, data: {
    name?: string;
    description?: string;
    permission_ids?: string[];
  }) => api.patch(`/roles/${id}/`, data),
  
  // Delete role
  delete: (id: string) => api.delete(`/roles/${id}/`),
  
  // Search roles
  search: (params: {
    name?: string;
    is_active?: boolean;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/roles/?${searchParams.toString()}`);
  }
};

// Permission Management API
export const permissionAPI = {
  // Get all permissions
  getAll: () => api.get('/permissions/'),
  
  // Get single permission
  getById: (id: string) => api.get(`/permissions/${id}/`),
  
  // Create new permission
  create: (data: {
    name: string;
    resource: string;
    actions: string[];
    description?: string;
  }) => api.post('/permissions/', data),
  
  // Update permission
  update: (id: string, data: {
    name?: string;
    resource?: string;
    actions?: string[];
    description?: string;
  }) => api.patch(`/permissions/${id}/`, data),
  
  // Delete permission
  delete: (id: string) => api.delete(`/permissions/${id}/`),
  
  // Search permissions
  search: (params: {
    resource?: string;
    action?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/permissions/?${searchParams.toString()}`);
  }
};

// User Role Management API
export const userRoleAPI = {
  // Get user roles and permissions
  getUserRoles: (userId: string) => api.get(`/roles/user-roles/${userId}/`),
  
  // Assign roles to user
  assignRoles: (userId: string, data: {
    role_ids: string[];
  }) => api.post(`/roles/user-roles/${userId}/assign_roles/`, data),
  
  // Remove specific role from user
  removeRole: (userId: string, data: {
    role_id: string;
  }) => api.post(`/roles/user-roles/${userId}/remove_role/`, data),
  
  // Check if user has specific permission
  checkPermission: (userId: string, data: {
    permission_name: string;
    resource?: string;
  }) => api.post(`/roles/user-roles/${userId}/check_permission/`, data),
  
  // Get all permissions for a user
  getUserPermissions: (userId: string) => api.get(`/user-roles/${userId}/permissions/`)
};

// User Management API (if not already existing)
export const userAPI = {
  // Get all users
  getAll: () => api.get('/auth/users/'),
  
  // Get single user
  getById: (id: string) => api.get(`/users/${id}/`),
  
  // Search users
  search: (params: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/users/?${searchParams.toString()}`);
  }
};

// Car Wash API
export const carWashAPI = {
  // Get all car wash records
  getRecords: () => api.get('/operations/car-wash-records/'),
  
  // Get single car wash record
  getRecord: (id: string) => api.get(`/operations/car-wash-records/${id}/`),
  
  // Create new car wash record
  createRecord: (data: {
    bus_assignment: string;
    cost: number;
    service_type?: string;
    notes?: string;
    attendant?: string;
  }) => api.post('/operations/car-wash-records/', data),
  
  // Update car wash record
  updateRecord: (id: string, data: {
    bus_assignment?: string;
    cost?: number;
    service_type?: string;
    notes?: string;
  }) => api.patch(`/operations/car-wash-records/${id}/`, data),
  
  // Delete car wash record
  deleteRecord: (id: string) => api.delete(`/operations/car-wash-records/${id}/`),
  
  // Get car wash statistics for attendant
  getStatistics: (attendantId?: string, days?: number) => {
    const params = new URLSearchParams();
    if (attendantId) params.append('attendant_id', attendantId);
    if (days) params.append('days', days.toString());
    
    return api.get(`/operations/car-wash-records/statistics/?${params.toString()}`);
  },
  
  // Search car wash records
  search: (params: {
    bus_plate?: string;
    attendant?: string;
    start_date?: string;
    end_date?: string;
    service_type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    return api.get(`/operations/car-wash-records/?${searchParams.toString()}`);
  }
};

// Car Wash Station Management API
export const carWashStationAPI = {
  // Get all car wash stations
  getAll: () => api.get('/operations/car-washes/'),
  
  // Get single car wash station
  getById: (id: string) => api.get(`/operations/car-washes/${id}/`),
  
  // Create car wash station
  create: (data: {
    name: string;
    location: string;
    contact_info?: string;
    services_offered?: string[];
  }) => api.post('/operations/car-washes/', data),
  
  // Update car wash station
  update: (id: string, data: any) => api.patch(`/operations/car-washes/${id}/`, data),
  
  // Delete car wash station
  delete: (id: string) => api.delete(`/operations/car-washes/${id}/`),
};

// Car Wash Attendant Management API
export const carWashAttendantAPI = {
  // Get all car wash attendants
  getAll: () => api.get('/operations/car-wash-attendants/'),
  
  // Get single car wash attendant
  getById: (id: string) => api.get(`/operations/car-wash-attendants/${id}/`),
  
  // Create car wash attendant
  create: (data: {
    user: string;
    car_wash: string;
  }) => api.post('/operations/car-wash-attendants/', data),
  
  // Update car wash attendant
  update: (id: string, data: any) => api.patch(`/operations/car-wash-attendants/${id}/`, data),
  
  // Delete car wash attendant
  delete: (id: string) => api.delete(`/operations/car-wash-attendants/${id}/`),
  
  // Get attendant's performance statistics
  getPerformance: (attendantId: string, period?: string) => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    
    return api.get(`/operations/car-wash-attendants/${attendantId}/performance/?${params.toString()}`);
  }
};