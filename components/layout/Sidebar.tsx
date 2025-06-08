'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard,
  Bus,
  Users,
  UserRoundCog,
  FileText,
  Wrench,
  Package,
  TrendingUp,
  LogOut,
  Building2,
  Activity,
  Fuel,
  Droplets,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const adminNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "System Overview", href: "/admin/system", icon: Activity },
  { name: "Fleet Management", href: "/admin/fleet", icon: Bus },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Reports", href: "/admin/report", icon: FileText },
  { name: "Company Management", href: "/admin/companies", icon: Building2 },
  { name: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { name: "Inventory", href: "/admin/inventory", icon: Package },
  { name: "Garage", href: "/admin/garage", icon: TrendingUp },
  { name: "Car washes", href: "/admin/car-wash-stations", icon: Droplets },
  { name: "Fuel Stations", href: "/admin/fuel-stations", icon: Fuel },
  { name: "Bus Parks", href: "/admin/bus-parks", icon: Bus },
  { name: "Roles", href: "/admin/roles", icon: UserRoundCog },
];

const conductorNavItems = [
  { name: "Dashboard", href: "/conductor", icon: LayoutDashboard },
  { name: "My Assignments", href: "/conductor/assignments", icon: Bus },
  { name: "Reports", href: "/conductor/report", icon: FileText },
];

const garageNavItems = [
  { name: "Dashboard", href: "/garage", icon: LayoutDashboard },
  { name: "Maintenance Records", href: "/garage/maintenance", icon: Wrench },
  { name: "Service History", href: "/garage/history", icon: FileText },
  { name: "Parts Inventory", href: "/garage/inventory", icon: Package },
  { name: "Reports", href: "/garage/reports", icon: BarChart3 },
];

const fuelAttendantNavItems = [
  { name: "Dashboard", href: "/fuel_attendant", icon: LayoutDashboard },
  { name: "Fuel Records", href: "/fuel_attendant/records", icon: Fuel },
  { name: "Daily Reports", href: "/fuel_attendant/reports", icon: FileText },
  { name: "Fuel Statistics", href: "/fuel_attendant/statistics", icon: BarChart3 },
  { name: "Station Management", href: "/fuel_attendant/station", icon: Settings },
];

const carWashNavItems = [
  { name: "Dashboard", href: "/car_wash", icon: LayoutDashboard },
  { name: "Wash Records", href: "/car_wash/records", icon: Droplets },
  { name: "Service Schedule", href: "/car_wash/schedule", icon: Calendar },
  { name: "Daily Reports", href: "/car_wash/reports", icon: FileText },
  { name: "Performance", href: "/car_wash/performance", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, initializeAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token && !user) {
      router.push('/login');
      return;
    }
  }, [user, router]);
  
  // Safe check for user roles with proper fallbacks
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const userRoleNames = Array.isArray(user?.user_roles) ? user.user_roles : [];

  // Check for different attendant types
  const isAdmin = userRoleNames.some(role => 
    role === 'admin' || 
    role === 'System Admin' || 
    role === 'Company Admin'
  ) || user?.is_superuser === true;

  const isFuelAttendant = userRoleNames.includes('Fuel Attendant');
  const isCarWashAttendant = userRoleNames.includes('Car Wash Attendant');
  const isGarageAttendant = userRoleNames.includes('Garage Attendant') || 
                           userRoleNames.includes('Maintenance Attendant');
  const isConductor = userRoleNames.includes('Conductor');

  // Determine navigation items based on role priority
  let navItems = conductorNavItems;
  let dashboardTitle = "Bus Management";

  if (isAdmin) {
    navItems = adminNavItems;
    dashboardTitle = "Admin Portal";
  } else if (isFuelAttendant) {
    navItems = fuelAttendantNavItems;
    dashboardTitle = "Fuel Station";
  } else if (isCarWashAttendant) {
    navItems = carWashNavItems;
    dashboardTitle = "Car Wash Station";
  } else if (isGarageAttendant) {
    navItems = garageNavItems;
    dashboardTitle = "Garage Station";
  } else if (isConductor) {
    navItems = conductorNavItems;
    dashboardTitle = "Conductor Portal";
  }

  // Don't render if user is not loaded yet
  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Bus Management</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Get user's primary role for display
  const getPrimaryRole = () => {
    if (isAdmin) return "Administrator";
    if (isFuelAttendant) return "Fuel Attendant";
    if (isCarWashAttendant) return "Car Wash Attendant";
    if (isGarageAttendant) return "Garage Attendant";
    if (isConductor) return "Conductor";
    return userRoleNames[0] || "User";
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">{dashboardTitle}</h2>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">
              {user?.first_name || user?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {getPrimaryRole()}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;