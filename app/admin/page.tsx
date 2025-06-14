'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardAPI, busAPI, assignmentAPI } from "@/lib/api";
import {
  Bus,
  TrendingUp,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  MapPin
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';

// Enhanced StatsCard component
const StatsCard = ({ title, value, icon: Icon, description, trend, variant = "default" }) => {
  const variants = {
    default: "border-slate-200",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50"
  };

  const iconColors = {
    default: "text-slate-600",
    success: "text-green-600",
    warning: "text-yellow-600", 
    danger: "text-red-600"
  };

  return (
    <Card className={`${variants[variant]} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{description}</p>
            {trend && (
              <div className={`flex items-center text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
                {trend.value}% from last month
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-white shadow-sm ${iconColors[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon: Icon, label, onClick, variant = "outline" }) => (
  <Button
    variant={variant}
    size="sm"
    onClick={onClick}
    className="flex items-center gap-2 h-auto py-3 px-4"
  >
    <Icon className="h-4 w-4" />
    {label}
  </Button>
);

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    total_buses: 0,
    active_assignments: 0,
    maintenance_pending: 0,
    available_buses: 0,
  });

  // Fetch data with React Query
  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busAPI.getAll()
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentAPI.getAll()
  });

  // Calculate stats from fetched data
  useEffect(() => {
    const busData = buses?.data || [];
    const assignmentData = assignments?.data || [];

    setDashboardData({
      total_buses: busData.length,
      active_assignments: assignmentData.filter(a => ['assigned', 'in_progress', 'departed'].includes(a.status)).length,
      maintenance_pending: busData.filter(b => b.status === 'under_maintenance').length,
      available_buses: busData.filter(b => b.status === 'active').length,
    });
  }, [buses, assignments]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'success' },
      available: { label: 'Available', variant: 'success' },
      assigned: { label: 'Assigned', variant: 'info' },
      in_use: { label: 'In Use', variant: 'info' },
      under_maintenance: { label: 'Maintenance', variant: 'warning' },
      maintenance: { label: 'Maintenance', variant: 'warning' },
      out_of_service: { label: 'Out of Service', variant: 'danger' },
      decommissioned: { label: 'Decommissioned', variant: 'danger' },
    };

    const config = statusConfig[status] || { label: status || 'Unknown', variant: 'default' };
    
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      default: 'bg-slate-100 text-slate-800 border-slate-200'
    };

    return (
      <Badge variant="outline" className={`${variants[config.variant]} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const isLoading = busesLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const busData = buses?.data || [];
  const assignmentData = assignments?.data || [];
  const fleetAvailabilityPercentage = busData.length > 0 
    ? Math.round((dashboardData.available_buses / busData.length) * 100) 
    : 0;

  // Get variant based on availability percentage
  const getAvailabilityVariant = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "danger";
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bus Overview</h1>
          <p className="text-slate-600 mt-1">Monitor and manage your bus operations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500 bg-white px-3 py-2 rounded-lg border">
            <Clock className="inline h-4 w-4 mr-1" />
            Updated {new Date().toLocaleTimeString()}
          </div>
          <Button className="bg-slate-800 hover:bg-slate-900">
            <Activity className="h-4 w-4 mr-2" />
            Real-time View
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Bus"
          value={dashboardData.total_buses}
          icon={Bus}
          description="Buses in operation"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Trips"
          value={dashboardData.active_assignments}
          icon={MapPin}
          description="Currently running"
          trend={{ value: 8, isPositive: true }}
          variant="default"
        />
        <StatsCard
          title="Maintenance Queue"
          value={dashboardData.maintenance_pending}
          icon={Wrench}
          description="Requires attention"
          trend={{ value: 3, isPositive: false }}
          variant={dashboardData.maintenance_pending > 5 ? "warning" : "default"}
        />
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <QuickActionButton
              icon={Bus}
              label="Add New Bus"
              onClick={() => {}}
              variant="default"
            />
            <QuickActionButton
              icon={TrendingUp}
              label="View Reports"
              onClick={() => {}}
              variant="outline"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bus Status */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Bus className="h-5 w-5" />
              Bus Status
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-600">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {busData.length > 0 ? (
              busData.slice(0, 6).map((bus) => (
                <div key={bus.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Bus className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{bus.plate_number || 'N/A'}</p>
                      <p className="text-sm text-slate-500">{bus.model || 'Unknown Model'}</p>
                    </div>
                  </div>
                  {getStatusBadge(bus.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Bus className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No buses found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-600">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignmentData.length > 0 ? (
              assignmentData.slice(0, 6).map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{assignment?.plate_number || 'N/A'}</p>
                      <p className="text-sm text-slate-500">
                        {assignment?.driver_name || 'N/A'} • {assignment?.route_name || 'No route'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Section */}
      {dashboardData.maintenance_pending > 3 && (
        <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {dashboardData.maintenance_pending} buses require maintenance attention
                </p>
                <p className="text-sm text-yellow-700">
                  Schedule maintenance to avoid service disruptions
                </p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto">
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}