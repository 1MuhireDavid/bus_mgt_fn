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

// Enhanced Bus API with detailed reporting
export const enhancedBusAPI = {
  // Get enhanced bus detail with expenses for a specific date
  getBusDetailWithExpenses: (busId: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/fleet/buses/${busId}/detail_with_expenses/${params}`);
  },

  // Get comprehensive single bus report
  getSingleBusReport: (busId: string, params?: {
    start_date?: string;
    end_date?: string;
    format?: 'json' | 'csv';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.format) searchParams.append('format', params.format);
    
    const queryString = searchParams.toString();
    const url = `/reports/buses/${busId}/detailed-report/${queryString ? `?${queryString}` : ''}`;
    
    if (params?.format === 'csv') {
      return api.get(url, { responseType: 'blob' });
    }
    return api.get(url);
  },

  // Download single bus report
  downloadBusReport: async (busId: string, format: 'json' | 'csv', params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await enhancedBusAPI.getSingleBusReport(busId, {
        ...params,
        format
      });
      
      // Create download
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get bus info for filename
      const busResponse = await api.get(`/fleet/buses/${busId}/`);
      const plateNumber = busResponse.data.plate_number || busId;
      const timestamp = new Date().toISOString().slice(0, 10);
      
      link.download = `bus_report_${plateNumber}_${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error };
    }
  }
};

// Enhanced Dashboard API with new bus park information
export const enhancedDashboardAPI = {
  // Enhanced bus expense report with bus park information
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

  // Export enhanced bus expense report
  exportBusExpenseReport: async (
    startDate: string, 
    endDate: string, 
    format: 'csv' | 'json',
    busId?: string
  ) => {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        format: format
      });
      
      if (busId) {
        params.append('bus_id', busId);
      }
      
      const response = await api.get(`/reports/bus-expenses/export/?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bus_expense_report_${startDate}_to_${endDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      cument.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error };
    }
  }
};
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
  getBusParks: () => api.get('/fleet/bus-parks/'),
  getBusDetailWithExpenses: (busId: string, date?: string) => {
  const params = date ? `?date=${date}` : '';
  return api.get(`/fleet/buses/${busId}/detail_with_expenses/${params}`);
},
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
  complete: (id: string, data: any) => api.post(`/operations/assignments/${id}/complete/`, data),
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

export const serviceAttendantAPI = {
  // Get all service attendants
  getAll: () => api.get('/operations/service-attendants/'),
  
  // Get attendants by type and location
  getByType: (params: {
    type: 'fuel' | 'car_wash' | 'maintenance';
    location_id?: string;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('type', params.type);
    if (params.location_id) {
      searchParams.append('location_id', params.location_id);
    }
    return api.get(`/operations/service-attendants/by_type/?${searchParams.toString()}`);
  },
  
  // Create service attendant
  create: (data: {
    user: string;
    attendant_type: 'fuel' | 'car_wash' | 'maintenance';
    fuel_station?: string;
    car_wash_station?: string;
    maintenance_garage?: string;
    phone?: string;
    shift_start?: string;
    shift_end?: string;
    hourly_rate?: number;
  }) => api.post('/operations/service-attendants/', data),
  
  // Update service attendant
  update: (id: string, data: any) => api.patch(`/operations/service-attendants/${id}/`, data),
  
  // Delete service attendant
  delete: (id: string) => api.delete(`/operations/service-attendants/${id}/`),
  
  // Get attendant performance
  getPerformance: (id: string, days?: number) => {
    const params = days ? `?days=${days}` : '';
    return api.get(`/operations/service-attendants/${id}/performance/${params}`);
  },
  
  // Get location choices for attendant type
  getLocationChoices: (attendantType: 'fuel' | 'car_wash' | 'maintenance') =>
    api.post('/operations/service-attendants/get_location_choices/', {
      attendant_type: attendantType
    }),
};

// Updated Location APIs
export const fuelStationAPI = {
  getAll: () => api.get('/operations/fuel-stations/'),
  getById: (id: string) => api.get(`/operations/fuel-stations/${id}/`),
  create: (data: any) => api.post('/operations/fuel-stations/', data),
  update: (id: string, data: any) => api.patch(`/operations/fuel-stations/${id}/`, data),
  delete: (id: string) => api.delete(`/operations/fuel-stations/${id}/`),
  
  // Get attendants at this station
  getAttendants: (id: string) => api.get(`/operations/fuel-stations/${id}/attendants/`),
  
  // Get daily records for this station
  getDailyRecords: (id: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/operations/fuel-stations/${id}/daily_records/${params}`);
  },
};


export const maintenanceGarageAPI = {
  getAll: () => api.get('/maintenance-garages/'),
  getById: (id: string) => api.get(`/maintenance-garages/${id}/`),
  create: (data: any) => api.post('/maintenance-garages/', data),
  update: (id: string, data: any) => api.patch(`/maintenance-garages/${id}/`, data),
  delete: (id: string) => api.delete(`/maintenance-garages/${id}/`),
  
  // Get attendants at this garage
  getAttendants: (id: string) => api.get(`/maintenance-garages/${id}/attendants/`),
};

// Updated Car Wash API (now uses normalized structure)
export const carWashAPI = {
  // Get all car wash records
  getRecords: () => api.get('/operations/car-wash-records/'),
  
  // Get current user's records (for attendant dashboard)
  getMyRecords: () => api.get('/operations/car-wash-records/my_records/'),
  
  // Create new car wash record
  createRecord: (data: {
    bus_assignment: string;
    attendant: string;  // ServiceAttendant ID
    car_wash_station: string;
    service_type: 'basic_wash' | 'premium_wash' | 'full_service' | 'interior_only' | 'exterior_only';
    cost: number;
    notes?: string;
  }) => api.post('/operations/car-wash-records/', data),
  
  // Update car wash record
  updateRecord: (id: string, data: any) => api.patch(`/operations/car-wash-records/${id}/`, data),
  
  // Get car wash statistics
  getStatistics: (attendantId?: string, days?: number) => {
    const params = new URLSearchParams();
    if (attendantId) params.append('attendant_id', attendantId);
    if (days) params.append('days', days.toString());
    return api.get(`/operations/car-wash-records/statistics/?${params.toString()}`);
  },
};

// Updated Fuel API
export const fuelAPI = {
  // Get all fuel records
  getRecords: () => api.get('/operations/fuel-records/'),
  
  // Get current user's records (for attendant dashboard)
  getMyRecords: () => api.get('/operations/fuel-records/my_records/'),
  
  // Create new fuel record
  createRecord: (data: {
    bus_assignment: string;
    attendant: string;  // ServiceAttendant ID
    fuel_station: string;
    liters: number;
    price_per_liter: number;
    receipt_number?: string;
    notes?: string;
  }) => api.post('/operations/fuel-records/', data),
  
  // Update fuel record
  updateRecord: (id: string, data: any) => api.patch(`/operations/fuel-records/${id}/`, data),
  
  // Get fuel statistics
  getStatistics: (attendantId?: string, days?: number) => {
    const params = new URLSearchParams();
    if (attendantId) params.append('attendant_id', attendantId);
    if (days) params.append('days', days.toString());
    return api.get(`/operations/fuel-records/statistics/?${params.toString()}`);
  },
};

// User Service Roles API
export const userServiceRoleAPI = {
  // Get current user's service roles
  getMyRoles: () => api.get('/operations/user-service-roles/my_roles/'),
  
  // Get all user service roles (admin only)
  getAll: () => api.get('/operations/user-service-roles/'),
};

// Enhanced Company API with additional endpoints based on your backend
export const companyAPI = {
  // Basic CRUD operations
  getAll: () => api.get('/companies/companies/'),
  getById: (id: string) => api.get(`/companies/companies/${id}/`),
  create: (data: any) => api.post('/companies/companies/', data),
  update: (id: string, data: any) => api.patch(`/companies/companies/${id}/`, data),
  delete: (id: string) => api.delete(`/companies/companies/${id}/`),
  
  // Get company statistics (from your backend)
  getStatistics: (id: string) => api.get(`/companies/${id}/statistics/`),
  
  // Search and filter companies
  search: (params: {
    name?: string;
    tin?: string;
    is_active?: boolean;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/companies/?${searchParams.toString()}`);
  },
  
  // Toggle company status
  toggleStatus: (id: string, isActive: boolean) => 
    api.patch(`/companies/${id}/`, { is_active: isActive }),
};

// System Admin Dashboard API (if you're implementing the system admin features)
export const systemAdminAPI = {
  // Get system-wide overview
  getSystemOverview: () => api.get('/system-admin/system_overview/'),
  
  // Get company analytics
  getCompanyAnalytics: (companyId?: string) => {
    const params = companyId ? `?company_id=${companyId}` : '';
    return api.get(`/system-admin/company_analytics/${params}`);
  },
};

// Multi-tenant user management (if implementing)
export const multiTenantUserAPI = {
  getAll: (params?: { company?: string; role?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.company) searchParams.append('company', params.company);
    if (params?.role) searchParams.append('role', params.role);
    return api.get(`/multi-tenant/users/?${searchParams.toString()}`);
  },
  
  create: (data: any) => api.post('/multi-tenant/users/', data),
  update: (id: string, data: any) => api.patch(`/multi-tenant/users/${id}/`, data),
  delete: (id: string) => api.delete(`/multi-tenant/users/${id}/`),
};

// Multi-tenant bus management
export const multiTenantBusAPI = {
  getAll: (params?: { company?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.company) searchParams.append('company', params.company);
    return api.get(`/multi-tenant/buses/?${searchParams.toString()}`);
  },
  
  create: (data: any) => api.post('/multi-tenant/buses/', data),
  update: (id: string, data: any) => api.patch(`/multi-tenant/buses/${id}/`, data),
  delete: (id: string) => api.delete(`/multi-tenant/buses/${id}/`),
};

// Multi-tenant stock management
export const multiTenantStockAPI = {
  getAll: (params?: { company?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.company) searchParams.append('company', params.company);
    return api.get(`/multi-tenant/stock/?${searchParams.toString()}`);
  },
  
  create: (data: any) => api.post('/multi-tenant/stock/', data),
  update: (id: string, data: any) => api.patch(`/multi-tenant/stock/${id}/`, data),
  delete: (id: string) => api.delete(`/multi-tenant/stock/${id}/`),
  
  // Get company stock summary
  getCompanySummary: () => api.get('/multi-tenant/stock/company_summary/'),
};

