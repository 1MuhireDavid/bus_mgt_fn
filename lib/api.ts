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


// Enhanced Dashboard API with new bus park information
export const DashboardAPI = {

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
      document.body.removeChild(link);
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
      const response = await busAPI.getSingleBusReport(busId, {
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
  },
  // Get buses by maintenance status
  getByMaintenanceStatus: (status) => 
    api.get(`/fleet/buses/by_maintenance_status/?status=${status}`),
  
  // Get buses at specific garage
  getBusesAtGarage: (garageId) => 
    api.get(`/fleet/buses/at_garage/?garage_id=${garageId}`),
  
  // Move bus to maintenance garage
  moveToMaintenance: (busId, data) => 
    api.post(`/fleet/buses/${busId}/move_to_maintenance/`, data),
  
  // Return bus from maintenance
  returnFromMaintenance: (busId, data) => 
    api.post(`/fleet/buses/${busId}/return_from_maintenance/`, data),
  
  // Get bus maintenance history
  getMaintenanceHistory: (busId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/fleet/buses/${busId}/maintenance_history/?${searchParams.toString()}`);
  },
  
  // Get bus current maintenance details
  getCurrentMaintenance: (busId) => 
    api.get(`/fleet/buses/${busId}/current_maintenance/`),
  
  // Get buses due for maintenance
  getDueForMaintenance: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/fleet/buses/due_for_maintenance/?${searchParams.toString()}`);
  }


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
  startMaintenance: (data: any) => api.post('/maintenance/start_maintenance/', data),
  completeMaintenance: (maintenanceId: string) =>
    api.post(`/maintenance/${maintenanceId}/complete_maintenance/`),
  
  getGarageDashboard: () => api.get('/maintenance/garage_dashboard/'),
  addItems: (maintenanceId: string, items: Array<{
    stock_item_id?: string;
    description: string;
    quantity_used: number;
    unit_cost: number;
    source: 'company_stock' | 'external_purchase';
  }>) => api.post(`/maintenance/${maintenanceId}/add_items/`, { items }),
  updateMaintenanceStatus: (maintenanceId: string, data: any) =>
    api.patch(`/maintenance/${maintenanceId}/`, data),
  getStatistics: () => api.get('/maintenance/statistics/'),
};

export const maintenanceItemsAPI = {
  // Get all maintenance items
  getAll: () => api.get('/maintenance-items/'),
  
  // Get items by maintenance type
  getByMaintenanceType: (typeId: string) => 
    api.get(`/maintenance-types/${typeId}/items/`),
  
  // Create new maintenance item
  create: (data: {
    name: string;
    description?: string;
    unit_price: number;
    unit: string;
    maintenance_types: string[];
    stock_item_id?: string;
    is_consumable: boolean;
    minimum_quantity?: number;
  }) => api.post('/maintenance-items/', data),
  
  // Update maintenance item
  update: (id: string, data: any) => 
    api.patch(`/maintenance-items/${id}/`, data),
  
  // Delete maintenance item
  delete: (id: string) => 
    api.delete(`/maintenance-items/${id}/`),
  
  // Get items with current stock levels
  getWithStockLevels: () => 
    api.get('/maintenance-items/with_stock_levels/'),
  
  // Search items
  search: (query: string) => 
    api.get(`/maintenance-items/search/?q=${encodeURIComponent(query)}`),
    // Bulk associate items with maintenance types
  bulkAssociateTypes: (itemId: string, typeIds: string[]) =>
    api.post(`/maintenance-items/${itemId}/associate_types/`, { type_ids: typeIds }),
  
  // Remove associations
  removeTypeAssociations: (itemId: string, typeIds: string[]) =>
    api.post(`/maintenance-items/${itemId}/remove_types/`, { type_ids: typeIds }),
};

export const maintenanceTypesAPI = {
  getAll: () => api.get('/maintenance-types/'),
  getById: (id: string) => api.get(`/maintenance-types/${id}/`),
  create: (data: any) => api.post('/maintenance-types/', data),
  update: (id: string, data: any) => api.put(`/maintenance-types/${id}/`, data),
  delete: (id: string) => api.delete(`/maintenance-types/${id}/`),

    // Get maintenance type with associated items
  getWithItems: (id: string) => 
    api.get(`/maintenance-types/${id}/with_items/`),
  
  // Add items to maintenance type
  addItems: (typeId: string, itemIds: string[]) => 
    api.post(`/maintenance-types/${typeId}/add_items/`, { item_ids: itemIds }),
  
  // Remove items from maintenance type
  removeItems: (typeId: string, itemIds: string[]) => 
    api.post(`/maintenance-types/${typeId}/remove_items/`, { item_ids: itemIds }),
  addItemsToTypes: (itemId: string, typeIds: string[]) =>
    api.post(`/maintenance-items/${itemId}/bulk_associate_types/`, { type_ids: typeIds }),
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
  getAll: () => api.get('/operations/car-washes/'),

  // Get single car wash station
  getById: (id: string) => api.get(`/operations/car-washes/${id}/`),
  
  create: (data: {
    name: string;
    location: string;
    contact_info?: string;
    services_offered?: string[];
  }) => api.post('/operations/car-washes/', data),
  
  update: (id: string, data: any) => api.patch(`/operations/car-washes/${id}/`, data),
  
  delete: (id: string) => api.delete(`/operations/car-washes/${id}/`),

  getDailyRecords: (stationId:string, date:string) => 
    api.get(`/operations/car-washes/${stationId}/daily_records/?date=${date}`),
  
  getAttendants: (stationId:string) => 
    api.get(`/operations/car-washes/${stationId}/attendants/`),
  
  getWeeklyStats: (stationId:string) => 
    api.get(`/operations/car-washes/${stationId}/weekly_stats/`),
  
  getMonthlyStats: (stationId:string) => 
    api.get(`/operations/car-washes/${stationId}/monthly_stats/`),

  addAttendant: (stationId:string, userId:number) => 
    api.post(`/operations/car-wash-stations/${stationId}/add_attendant/`, {
      user_id: userId
    }),
  
  removeAttendant: (stationId:string, attendantId:string) => 
    api.delete(`/operations/car-wash-stations/${stationId}/remove_attendant/?attendant_id=${attendantId}`),

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
  
  update: (id: string, data: any) => api.patch(`/operations/service-attendants/${id}/`, data),
  
  delete: (id: string) => api.delete(`/operations/service-attendants/${id}/`),
  
  getPerformance: (id: string, days?: number) => {
    const params = days ? `?days=${days}` : '';
    return api.get(`/operations/service-attendants/${id}/performance/${params}`);
  },
  
  // Get location choices for attendant type
  getLocationChoices: (attendantType: 'fuel' | 'car_wash' | 'maintenance') =>
    api.post('/operations/service-attendants/get_location_choices/', {
      attendant_type: attendantType
    }),

  // Get maintenance attendant profile
  getMaintenanceProfile: () => api.get('/operations/service-attendants/maintenance_profile/'),
  
  // Get attendant's current workload
  getCurrentWorkload: (attendantId) => 
    api.get(`/operations/service-attendants/${attendantId}/current_workload/`),
  
  // Get attendant performance for maintenance
  getMaintenancePerformance: (attendantId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/operations/service-attendants/${attendantId}/maintenance_performance/?${searchParams.toString()}`);
  },
  
  // Assign attendant to garage
  assignToGarage: (attendantId, garageId) => 
    api.post(`/operations/service-attendants/${attendantId}/assign_to_garage/`, {
      garage_id: garageId
    }),
  
  // Get available maintenance attendants
  getAvailableForMaintenance: () => 
    api.get('/operations/service-attendants/available_for_maintenance/')
};

// Updated Location APIs
export const fuelStationAPI = {
  getAll: () => api.get('/operations/fuel-stations/'),
  getById: (id: string) => api.get(`/operations/fuel-stations/${id}/`),
  create: (data: any) => api.post('/operations/fuel-stations/', data),
  update: (id: string, data: any) => api.patch(`/operations/fuel-stations/${id}/`, data),
  delete: (id: string) => api.delete(`/operations/fuel-stations/${id}/`),
  
  getAttendants: (id: string) => api.get(`/operations/fuel-stations/${id}/attendants/`),
  
  // Get daily records for this station
  getDailyRecords: (id: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/operations/fuel-stations/${id}/daily_records/${params}`);
  },
    // Get weekly statistics
  getWeeklyStats: (id: string, weeks?: number) => {
    const params = weeks ? `?weeks=${weeks}` : '';
    return api.get(`/operations/fuel-stations/${id}/weekly_stats/${params}`);
  },

  // Get monthly statistics
  getMonthlyStats: (id: string, months?: number) => {
    const params = months ? `?months=${months}` : '';
    return api.get(`/operations/fuel-stations/${id}/monthly_stats/${params}`);
  },

  // Get attendant performance
  getAttendantPerformance: (id: string, days?: number) => {
    const params = days ? `?days=${days}` : '';
    return api.get(`/operations/fuel-stations/${id}/attendant_performance/${params}`);
  },

  // Add attendant to station
  addAttendant: (stationId: string, userId: number) => 
    api.post(`/operations/fuel-stations/${stationId}/add_attendant/`, {
      user_id: userId
    }),
  
  // Remove attendant from station
  removeAttendant: (stationId: string, attendantId: string) => 
    api.delete(`/operations/fuel-stations/${stationId}/remove_attendant/?attendant_id=${attendantId}`),

  // Get dashboard summary for all fuel stations
  getDashboardSummary: () => api.get('/operations/fuel-stations/dashboard_summary/'),

  getFuelPrices: (stationId: string) => 
    api.get(`/operations/fuel-stations/${stationId}/fuel_prices/`),

  // Get current active prices for this station
  getCurrentPrices: (stationId: string) => 
    api.get(`/operations/fuel-stations/${stationId}/current_prices/`),

  // Add new fuel price to station
  addFuelPrice: (stationId: string, data: {
    fuel_type: 'petrol' | 'diesel' | 'super' | 'premium';
    price_per_liter: number;
    effective_date?: string;
    is_active?: boolean;
  }) => api.post(`/operations/fuel-stations/${stationId}/add_fuel_price/`, data),

  // Bulk update multiple fuel prices
  bulkUpdatePrices: (stationId: string, prices: Array<{
    fuel_type: 'petrol' | 'diesel' | 'super' | 'premium';
    price_per_liter: number;
    effective_date?: string;
    is_active?: boolean;
  }>) => api.post(`/operations/fuel-stations/${stationId}/bulk_update_prices/`, {
    prices
  })
};


export const maintenanceGarageAPI = {
  getAll: () => api.get('/maintenance-garages/'),
  getById: (id: string) => api.get(`/maintenance-garages/${id}/`),
  create: (data: any) => api.post('/maintenance-garages/', data),
  update: (id: string, data: any) => api.patch(`/maintenance-garages/${id}/`, data),
  delete: (id: string) => api.delete(`/maintenance-garages/${id}/`),
  
  // Get attendants at this garage
  getAttendants: (id: string) => api.get(`/maintenance-garages/${id}/attendants/`),

  // Get garage assigned to current user
  getMyGarage: () => api.get('/maintenance-garages/my_garage/'),
  
  // Get buses currently at a specific garage
  getBusesAtGarage: (garageId) => api.get(`/maintenance-garages/${garageId}/buses_at_garage/`),
  
  // Get available buses for maintenance
  getAvailableBuses: () => api.get('/fleet/buses/?status=active&available_for_maintenance=true'),
  
  // Admin overview of all garages
  getAdminOverview: () => api.get('/maintenance-garages/admin_overview/'),
  
  // Get garage statistics
  getGarageStats: (garageId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/maintenance-garages/${garageId}/stats/?${searchParams.toString()}`);
  },
    // Get garage performance metrics
  getGaragePerformance: (garageId, days = 30) => 
    api.get(`/maintenance-garages/${garageId}/performance/?days=${days}`),
  
  // Get workload distribution
  getWorkloadDistribution: () => api.get('/maintenance-garages/workload_distribution/')
};
export const maintenanceReportAPI = {
  // Get garage productivity report
  getGarageProductivityReport: (garageId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/reports/garage_productivity/${garageId}/?${searchParams.toString()}`);
  },
  
  // Get maintenance cost analysis
  getMaintenanceCostAnalysis: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/reports/maintenance_cost_analysis/?${searchParams.toString()}`);
  },
  
  // Get downtime report
  getDowntimeReport: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/reports/bus_downtime/?${searchParams.toString()}`);
  },
  
  // Get maintenance schedule report
  getMaintenanceSchedule: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/reports/maintenance_schedule/?${searchParams.toString()}`);
  },
  
  // Export maintenance report
  exportMaintenanceReport: async (reportType, params = {}, format = 'csv') => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      searchParams.append('format', format);
      
      const response = await api.get(`/reports/maintenance_export/${reportType}/?${searchParams.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance_${reportType}_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error };
    }
  }
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
  
  // Create new fuel record with simplified data structure
  createRecord: (data: {
    bus_assignment: string;
    fuel_type: 'petrol' | 'diesel' | 'super' | 'premium';
    fuel_price: string;  // FuelPrice ID
    liters: number;
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

  // Get available prices for current user's station
  getAvailablePrices: () => api.get('/operations/fuel-records/available_prices/'),

  // Get active assignments for fuel records
  getActiveAssignments: () => api.get('/operations/assignments/active_for_fuel/'),

  // Get price history
  getPriceHistory: (params?: {
    fuel_type?: string;
    station_id?: string;
    days?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.fuel_type) searchParams.append('fuel_type', params.fuel_type);
    if (params?.station_id) searchParams.append('station_id', params.station_id);
    if (params?.days) searchParams.append('days', params.days.toString());
    return api.get(`/operations/fuel-records/price_history/?${searchParams.toString()}`);
  },

  // Get fuel type statistics
  getFuelTypeStatistics: (days?: number) => {
    const params = days ? `?days=${days}` : '';
    return api.get(`/operations/fuel-records/fuel_type_statistics/${params}`);
  }
};
export const fuelPriceAPI = {
  // Get all fuel prices
  getAll: (params?: {
    station_id?: string;
    fuel_type?: string;
    is_active?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.station_id) searchParams.append('station_id', params.station_id);
    if (params?.fuel_type) searchParams.append('fuel_type', params.fuel_type);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    return api.get(`/operations/fuel-prices/?${searchParams.toString()}`);
  },

  // Get single fuel price
  getById: (id: string) => api.get(`/operations/fuel-prices/${id}/`),

  // Create new fuel price
  create: (data: {
    fuel_station: string;
    fuel_type: 'petrol' | 'diesel' | 'super' | 'premium';
    price_per_liter: number;
    effective_date?: string;
    is_active?: boolean;
  }) => api.post('/operations/fuel-prices/', data),

  // Update fuel price
  update: (id: string, data: any) => api.patch(`/operations/fuel-prices/${id}/`, data),

  // Delete fuel price
  delete: (id: string) => api.delete(`/operations/fuel-prices/${id}/`),

  // Get fuel prices grouped by station
  getByStation: () => api.get('/operations/fuel-prices/by_station/'),

  // Set fuel price as active (deactivates others of same type)
  setActive: (id: string) => api.post(`/operations/fuel-prices/${id}/set_active/`),

  // Deactivate fuel price
  deactivate: (id: string) => api.post(`/operations/fuel-prices/${id}/deactivate/`)
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

// Enhanced Bus Park API using your backend structure
export const busParkAPI = {
  getAll: () => api.get('/fleet/bus-parks/'),
  getById: (id) => api.get(`/fleet/bus-parks/${id}/`),
  getBusesAtPark: (parkId) => api.get(`/fleet/bus-parks/${parkId}/buses/`),
  create: (data) => api.post('/fleet/bus-parks/', data),
  update: (id, data) => api.patch(`/fleet/bus-parks/${id}/`, data),
  delete: (id) => api.delete(`/fleet/bus-parks/${id}/`),
  toggleStatus: (id) => api.post(`/fleet/bus-parks/${id}/toggle_status/`),
  getStats: () => api.get('/fleet/bus-parks/stats/'),
  getOccupancy: (parkId) => api.get(`/fleet/bus-parks/${parkId}/occupancy/`),
  getActivityLog: (parkId) => api.get(`/fleet/bus-parks/${parkId}/activity_log/`),
  getActiveParks: () => api.get('/fleet/bus-parks/?is_active=true'),
};

export const adminMaintenanceAPI = {
  // Get system-wide maintenance overview
  getSystemOverview: () => api.get('/admin/maintenance/system_overview/'),
  
  // Get garage comparison report
  getGarageComparison: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/admin/maintenance/garage_comparison/?${searchParams.toString()}`);
  },
  
  // Get maintenance efficiency metrics
  getEfficiencyMetrics: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/admin/maintenance/efficiency_metrics/?${searchParams.toString()}`);
  },
  
  // Get resource utilization
  getResourceUtilization: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return api.get(`/admin/maintenance/resource_utilization/?${searchParams.toString()}`);
  },
  
  // Get maintenance alerts
  getMaintenanceAlerts: () => api.get('/admin/maintenance/alerts/'),
  
  // Get overdue maintenance
  getOverdueMaintenance: () => api.get('/admin/maintenance/overdue/'),
  
  // Reassign maintenance work
  reassignMaintenance: (maintenanceId, data) => 
    api.post(`/admin/maintenance/${maintenanceId}/reassign/`, data),
  
  // Emergency maintenance assignment
  emergencyAssignment: (data) => 
    api.post('/admin/maintenance/emergency_assignment/', data)
};

// Real-time maintenance tracking API
export const maintenanceTrackingAPI = {
  // Get real-time garage status
  getRealTimeStatus: (garageId) => 
    api.get(`/tracking/garage/${garageId}/real_time_status/`),
  
  // Update maintenance progress
  updateProgress: (maintenanceId, data) => 
    api.post(`/tracking/maintenance/${maintenanceId}/update_progress/`, data),
  
  // Get maintenance timeline
  getMaintenanceTimeline: (maintenanceId) => 
    api.get(`/tracking/maintenance/${maintenanceId}/timeline/`),
  
  // Add maintenance log entry
  addLogEntry: (maintenanceId, data) => 
    api.post(`/tracking/maintenance/${maintenanceId}/add_log/`, data),
  
  // Get active maintenance across all garages
  getActiveMaintenance: () => 
    api.get('/tracking/active_maintenance/'),
  
  // Get maintenance queue
  getMaintenanceQueue: (garageId) => 
    api.get(`/tracking/garage/${garageId}/queue/`)
};