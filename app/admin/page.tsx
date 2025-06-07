'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardAPI, busAPI, assignmentAPI } from "@/lib/api";
import {
  Bus,
  Users,
  TrendingUp,
  Wrench,
  Package,
  CheckCircle,
  Clock
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';

// Create a simple stats card component since we can't import StatsCard
const StatsCard = ({ title, value, icon: Icon, description, trend }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </p>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    total_buses: 0,
    active_assignments: 0,
    maintenance_pending: 0,
    available_buses: 0,
  });

  // Fetch buses data
  const { data: buses, isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busAPI.getAll()
  });

  // Fetch assignments data
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentAPI.getAll()
  });

  // Fetch basic stats using the new method
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardAPI.getBasicStats()
  });

  // Update dashboard data when APIs respond
  useEffect(() => {
    const busData = buses?.data || [];
    const assignmentData = assignments?.data || [];
    const statsData = stats?.data || {};

    setDashboardData({
      total_buses: statsData.total_buses || busData.length,
      active_assignments: statsData.active_assignments || assignmentData.filter(a => a.status === 'assigned').length,
      maintenance_pending: statsData.maintenance_pending || busData.filter(b => b.status === 'maintenance').length,
      available_buses: busData.filter(b => b.status === 'active').length,
    });
  }, [buses, assignments, stats]);

  const getStatusBadge = (status) => {
    const variants = {
      available: 'default',
      in_use: 'secondary',
      maintenance: 'destructive',
      out_of_service: 'outline',
    };
    
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      out_of_service: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const isLoading = busesLoading || assignmentsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Buses"
          value={dashboardData.total_buses}
          icon={Bus}
          description="Fleet size"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Assignments"
          value={dashboardData.active_assignments}
          icon={TrendingUp}
          description="Currently running"
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="Maintenance Pending"
          value={dashboardData.maintenance_pending}
          icon={Wrench}
          description="Requires attention"
          trend={{ value: 2, isPositive: false }}
        />
        <StatsCard
          title="Fleet Availability"
          value={`${fleetAvailabilityPercentage}%`}
          icon={CheckCircle}
          description="Available buses"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bus Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Fleet Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {busData.length > 0 ? (
                busData.slice(0, 5).map((bus) => (
                  <div key={bus.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{bus.plate_number || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{bus.model || 'Unknown Model'}</p>
                    </div>
                    {getStatusBadge(bus.status)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No buses found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignmentData.length > 0 ? (
                assignmentData.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{assignment.bus?.plate_number || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">
                        Driver: {assignment?.driver_name || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'in_progress' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No assignments found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}