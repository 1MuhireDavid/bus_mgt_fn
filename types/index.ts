export interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  permissions_count: number;
}

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: Role[];
  is_active: boolean;
  createAt: string;
  company: string
  is_superuser: boolean;
  bus_park_name: string;
  phone: string;
}
export interface Bus {
  id: string;
  plate_number: string;
  model: string;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  created_at: string;
}

export interface BusAssignment {
  id: string;
  bus: Bus;
  driver: {
    id: string;
    driver_name: string;
    license_number: string;
  };
  conductor: User;
  departure_time: string;
  expected_return_time: string;
  return_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DashboardStats {
  total_buses: number;
  active_assignments: number;
  completed_trips: number;
  fuel_expenses: number;
  maintenance_pending: number;
}