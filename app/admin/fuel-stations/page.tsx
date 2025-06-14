"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fuel, 
  Search, 
  Filter,
  Trash2,
  MapPin,
  Phone,
  Users,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  Car,
  UserPlus,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { fuelStationAPI, serviceAttendantAPI, userAPI } from '@/lib/api';
import { StatsCard } from '@/components/ui/StatsCard';
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';

// Daily Records Component for Fuel Station
const FuelDailyRecordsCard = ({ station, selectedDate, onDateChange }) => {
  const { data: dailyData, isLoading, refetch } = useQuery({
    queryKey: ['fuel-station-daily-records', station?.id, selectedDate],
    queryFn: () => fuelStationAPI.getDailyRecords(station.id, selectedDate),
    enabled: !!station
  });



  const records = dailyData?.data?.data?.records || [];
  const summary = dailyData?.data?.data?.summary || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Fuel Records
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-auto"
            />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Buses Served</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary.total_records || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Total Liters</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {(summary.total_liters || 0).toFixed(2)}L
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                ${(summary.total_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Records Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading records...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No fuel records for this date</p>
              <p className="text-sm text-muted-foreground">
                Select a different date to view records.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Liters</TableHead>
                    <TableHead>Price/L</TableHead>
                    <TableHead>Attendant</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.bus_plate_number}
                      </TableCell>
                      <TableCell>{record.driver_name}</TableCell>
                      <TableCell>{record.liters}L</TableCell>
                      <TableCell>${record.price_per_liter}</TableCell>
                      <TableCell>{record.attendant_name}</TableCell>
                      <TableCell className="font-medium">
                        ${record.total_amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Fuel Attendants Management Component
const FuelAttendantsManagementCard = ({ station }) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  

  // Get attendants for this station
  const { data: attendantsData, isLoading } = useQuery({
    queryKey: ['fuel-station-attendants', station?.id],
    queryFn: () => fuelStationAPI.getAttendants(station.id),
    enabled: !!station
  });


    const { data: availableUsersData } = useQuery({
      queryKey: ['users-for-assignment'],
      queryFn: () => userAPI.getAll(),
      enabled: isAddDialogOpen
    });

  // Add attendant mutation
  const addAttendantMutation = useMutation({
    mutationFn: (userId) => serviceAttendantAPI.create({
      user: userId,
      attendant_type: 'fuel',
      fuel_station: station.id,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuel-station-attendants', station.id]);
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      toast.success('Attendant added successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add attendant');
    }
  });

  // Remove attendant mutation
  const removeAttendantMutation = useMutation({
    mutationFn: (attendantId) => serviceAttendantAPI.delete(attendantId),
    onSuccess: () => {
      queryClient.invalidateQueries(['fuel-station-attendants', station.id]);
      toast.success('Attendant removed successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove attendant');
    }
  });

  const attendants = attendantsData?.data?.data || [];
  const users = availableUsersData?.data?.data?.users || [];

  const availableUsers = users.filter(user => 
    !attendants.some(attendant => attendant.user === user.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Fuel Attendants ({attendants.length})
          </CardTitle>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            size="sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Attendant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading attendants...
          </div>
        ) : attendants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No attendants assigned</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add attendants to manage fuel services at this station.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Attendant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {attendants.map((attendant) => (
              <Card key={attendant.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{attendant.attendant_name}</h4>
                        <p className="text-sm text-muted-foreground">@{attendant.username}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Today: {attendant.today_services || 0} services
                          </span>
                          <span className="text-xs text-muted-foreground">
                            This week: {attendant.this_week_services || 0} services
                          </span>
                          <span className="text-xs text-green-600 font-medium">
                            Revenue: ${(attendant.total_revenue_today || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={attendant.is_active ? "default" : "secondary"}>
                        {attendant.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAttendantMutation.mutate(attendant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Attendant Dialog */}
        {isAddDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">Add Fuel Attendant</h3>
              <div className="space-y-4">
                <div>
                  <Label>Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedUserId('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => selectedUserId && addAttendantMutation.mutate(selectedUserId)}
                    disabled={!selectedUserId || addAttendantMutation.isPending}
                    className="flex-1"
                  >
                    {addAttendantMutation.isPending ? 'Adding...' : 'Add Attendant'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Statistics Card Component
const FuelStationStatsCard = ({ station }) => {
  const { data: weeklyStats } = useQuery({
    queryKey: ['fuel-station-weekly-stats', station?.id],
    queryFn: () => fuelStationAPI.getWeeklyStats?.(station.id),
    enabled: !!station
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ['fuel-station-monthly-stats', station?.id],
    queryFn: () => fuelStationAPI.getMonthlyStats?.(station.id),
    enabled: !!station
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Today's Services</p>
              <p className="text-2xl font-bold text-blue-600">{station?.today_services || 0}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Active Attendants</p>
              <p className="text-2xl font-bold text-green-600">{station?.attendant_count || 0}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">This Week</span>
              <span className="font-medium">{weeklyStats?.data?.total_services || 0} services</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">This Month</span>
              <span className="font-medium">{monthlyStats?.data?.total_services || 0} services</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Monthly Revenue</span>
              <span className="font-medium text-green-600">
                ${(monthlyStats?.data?.total_revenue || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Efficiency Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg. Services/Day</span>
              <span className="font-medium">
                {station?.attendant_count > 0 ? 
                  Math.round((station?.today_services || 0) / station.attendant_count) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg. Revenue/Service</span>
              <span className="font-medium">
                ${((monthlyStats?.data?.total_revenue || 0) / (monthlyStats?.data?.total_services || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Station Efficiency</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {station?.efficiency_score || 85}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Enhanced Fuel Station Management Component
export default function EnhancedFuelStationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  // Fetch fuel stations
  const { data: stationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['fuel-stations', searchTerm, statusFilter],
    queryFn: () => fuelStationAPI.getAll(),
  });

  const stations = stationsData?.data?.data || stationsData?.data || [];

  // Filter stations
  const filteredStations = stations.filter((station) => {
    const matchesSearch = 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && station.is_active) ||
      (statusFilter === 'inactive' && !station.is_active);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalStations = stations.length;

  const activeStations = stations.filter((s) => s.is_active).length;
  const inactiveStations = totalStations - activeStations;
  const totalAttendants = stations.reduce((sum, s) => sum + (s.attendant_count || 0), 0);

  const handleViewStationDetails = (station) => {
    setSelectedStation(station);
    setActiveTab('overview');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <span className="text-lg">Loading fuel stations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Fuel className="w-8 h-8 text-orange-600" />
            Fuel Station Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete fuel station management with daily records and attendant tracking
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Stations"
          value={totalStations}
          icon={Building2}
          description="All fuel stations"
        />
        <StatsCard
          title="Active Stations"
          value={activeStations}
          icon={Fuel}
          description="Currently operational"
          trend="up"
          trendValue={12}
        />
        <StatsCard
          title="Total Attendants"
          value={totalAttendants}
          icon={Users}
          description="Across all stations"
        />
      </div>

      {/* Station Selection and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Station Selection & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Stations</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="station-select">Select Station</Label>
              <Select 
                value={selectedStation?.id || ""} 
                onValueChange={(value) => {
                  const station = filteredStations.find(s => s.id === value);
                  setSelectedStation(station);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a station..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredStations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{station.name}</span>
                        <Badge variant={station.is_active ? "default" : "secondary"}>
                          {station.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={() => refetch()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={() => router.push('/admin/fuel-stations/fuel-pricing ')} className="w-full">
                
                Create Prices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Details */}
      {selectedStation ? (
        <div className="space-y-6">
          {/* Station Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-orange-600" />
                    {selectedStation.name}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedStation.location}
                    </div>
                    {selectedStation.contact_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {selectedStation.contact_phone}
                      </div>
                    )}
                    <Badge variant={selectedStation.is_active ? "default" : "secondary"}>
                      {selectedStation.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedStation(null)}
                >
                  Close Details
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="daily-records">Daily Records</TabsTrigger>
              <TabsTrigger value="attendants">Attendants</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <FuelStationStatsCard station={selectedStation} />
            </TabsContent>

            <TabsContent value="daily-records">
              <FuelDailyRecordsCard 
                station={selectedStation}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </TabsContent>

            <TabsContent value="attendants">
              <FuelAttendantsManagementCard station={selectedStation} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Fuel Station</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a station from the dropdown above to view detailed information, daily records, and manage attendants.
              </p>
              {filteredStations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No fuel stations found. {stations.length === 0 ? 'Create your first station to get started.' : 'Try adjusting your search filters.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-2 max-w-md mx-auto">
                  {filteredStations.slice(0, 3).map((station) => (
                    <Button
                      key={station.id}
                      variant="outline"
                      onClick={() => handleViewStationDetails(station)}
                      className="justify-start"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      {station.name}
                      <Badge 
                        variant={station.is_active ? "default" : "secondary"}
                        className="ml-auto"
                      >
                        {station.attendant_count || 0} attendants
                      </Badge>
                    </Button>
                  ))}
                  {filteredStations.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{filteredStations.length - 3} more stations
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}