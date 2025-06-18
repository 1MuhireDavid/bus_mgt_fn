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
  Droplets, 
  Search, 
  Filter,
  Trash2,
  Eye,
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
  Clock
} from 'lucide-react';
import { carWashStationAPI} from '@/lib/api';
import { StatsCard } from '@/components/ui/StatsCard';
import { AttendantsManagementCard } from '@/components/ui/AttendantsManagementCard';

// Daily Records Component
const DailyRecordsCard = ({ station, selectedDate, onDateChange }) => {
  const { data: dailyData, isLoading, refetch } = useQuery({
    queryKey: ['car-wash-daily-records', station?.id, selectedDate],
    queryFn: () => carWashStationAPI.getDailyRecords(station.id, selectedDate),
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
            Daily Wash Records
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Buses Washed</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary.total_records || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${(summary.total_cost || 0).toFixed(2)}
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
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No wash records for this date</p>
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
                    <TableHead>Service Type</TableHead>
                    <TableHead>Attendant</TableHead>
                    <TableHead>Cost</TableHead>
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
                      <TableCell>
                        <Badge variant="outline">{record.service_type_display}</Badge>
                      </TableCell>
                      <TableCell>{record.attendant_name}</TableCell>
                      <TableCell className="font-medium">
                        ${record.cost}
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


// Main Enhanced Car Wash Station Management Component
export default function EnhancedCarWashStationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch car wash stations
  const { data: stationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['car-wash-stations', searchTerm, statusFilter],
    queryFn: () => carWashStationAPI.getAll(),
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
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span className="text-lg">Loading car washes...</span>
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
            <Droplets className="w-8 h-8 text-blue-600" />
            Car Wash Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete car wash management with daily records and attendant tracking
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Car wash"
          value={totalStations}
          icon={Building2}
          description="All car washes"
        />
        <StatsCard
          title="Active Car wash"
          value={activeStations}
          icon={Droplets}
          description="Currently operational"
          trend="up"
          trendValue={12}
        />
        <StatsCard
          title="Total Attendants"
          value={totalAttendants}
          icon={Users}
          description="Across all car wash"
        />
      </div>

      {/* Station Selection and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Car wash Selection & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Car wash</Label>
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
              <Label htmlFor="station-select">Select Car wash</Label>
              <Select 
                value={selectedStation?.id || ""} 
                onValueChange={(value) => {
                  const station = filteredStations.find(s => s.id === value);
                  setSelectedStation(station);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a car wash..." />
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
          </div>
        </CardContent>
      </Card>

      {/* Station Details */}
      {selectedStation ? (
        <div className="space-y-6">
          {/* Car wash Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
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
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Car wash Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Services Offered</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedStation.services_offered && selectedStation.services_offered.length > 0 ? (
                          selectedStation.services_offered.map((service) => (
                            <Badge key={service} variant="outline">
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No services specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Active Attendants</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedStation.attendant_count || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created Date</Label>
                      <p className="text-sm">
                        {new Date(selectedStation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Today&apos;s Washes</span>
                        <span className="font-bold">12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Week</span>
                        <span className="font-bold">89</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <span className="font-bold">342</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Monthly Revenue</span>
                        <span className="font-bold text-green-600">$2,450</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="daily-records">
              <DailyRecordsCard 
                station={selectedStation}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </TabsContent>

            <TabsContent value="attendants">
              <AttendantsManagementCard station={selectedStation} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Car Wash</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a car wash from the dropdown above to view detailed information, daily records, and manage attendants.
              </p>
              {filteredStations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No car wash found. {stations.length === 0 ? 'Create your first car wash to get started.' : 'Try adjusting your search filters.'}
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
                      +{filteredStations.length - 3} more car wash
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
  )}
  </div>)}