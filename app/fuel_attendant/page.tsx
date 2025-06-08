'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "react-toastify";
import { 
  Fuel, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  Bus,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  RefreshCw,
  Droplets
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { fuelAPI, assignmentAPI, userServiceRoleAPI, fuelStationAPI } from '@/lib/api';

export default function FuelAttendantDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);
  const [userAttendantRole, setUserAttendantRole] = useState(null);

  // Form state for creating new fuel record
  const [fuelForm, setFuelForm] = useState({
    bus_assignment: '',
    fuel_station: '',
    liters: '',
    price_per_liter: '',
    receipt_number: '',
    notes: ''
  });

  // Fetch user's service roles to get attendant info
  const { data: userRolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-service-roles'],
    queryFn: () => userServiceRoleAPI.getMyRoles(),
    onSuccess: (data) => {
      const fuelRole = data?.data?.find(role => role.attendant_type === 'fuel');
      setUserAttendantRole(fuelRole);
    }
  });

  // Fetch fuel records (filtered by user's attendant role)
  const { data: fuelRecordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['fuel-records'],
    queryFn: () => fuelAPI.getMyRecords(),
  });

  // Fetch bus assignments for dropdown
  const { data: assignmentsData } = useQuery({
    queryKey: ['bus-assignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  // Fetch fuel stations
  const { data: fuelStationsData } = useQuery({
    queryKey: ['fuel-stations'],
    queryFn: () => fuelStationAPI.getAll(),
  });

  // Fetch fuel statistics
  const { data: statsData } = useQuery({
    queryKey: ['fuel-statistics'],
    queryFn: () => fuelAPI.getStatistics(userAttendantRole?.id),
    enabled: !!userAttendantRole?.id
  });

  // Create fuel record mutation
  const createFuelMutation = useMutation({
    mutationFn: (data) => fuelAPI.createRecord(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-statistics'] });
      setIsCreateRecordOpen(false);
      resetForm();
      toast.success('Fuel record created successfully!');
    },
    onError: (error) => {
      console.error('Create record error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail ||
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to create fuel record';
      toast.error(errorMessage);
    }
  });

  // Set user's attendant role when data is loaded
  useEffect(() => {
    if (userRolesData?.data) {
      const fuelRole = userRolesData.data.data.find(role => role.attendant_type === 'fuel');
      setUserAttendantRole(fuelRole);
    }
  }, [userRolesData]);

  const fuelRecords = fuelRecordsData?.data.data || [];
  const assignments = assignmentsData?.data || [];
  const fuelStations = fuelStationsData?.data || [];

  // Filter active bus assignments only
  const activeAssignments = assignments.filter(assignment => 
    assignment.status === 'assigned' || assignment.status === 'in_progress'
  );

  // Filter records based on search and date
  const filteredRecords = fuelRecords.filter((record) => {
    const matchesSearch = 
      record.bus_assignment?.bus?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fuel_station?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const recordDate = new Date(record.timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          matchesDate = recordDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = recordDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = recordDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Calculate statistics
  const todayRecords = filteredRecords.filter(record => {
    const today = new Date().toDateString();
    return new Date(record.timestamp).toDateString() === today;
  });

  const todayFuelSold = todayRecords.reduce((sum, record) => sum + parseFloat(record.liters || 0), 0);
  const todayRevenue = todayRecords.reduce((sum, record) => sum + parseFloat(record.total_amount || 0), 0);
  const avgPricePerLiter = filteredRecords.length > 0 ? 
    filteredRecords.reduce((sum, record) => sum + parseFloat(record.price_per_liter || 0), 0) / filteredRecords.length : 0;

  const resetForm = () => {
    setFuelForm({
      bus_assignment: '',
      fuel_station: '',
      liters: '',
      price_per_liter: '',
      receipt_number: '',
      notes: ''
    });
  };

  const handleCreateRecord = () => {
    if (!userAttendantRole) {
      toast.error('You must be registered as a fuel attendant to create records');
      return;
    }

    if (!fuelForm.bus_assignment || !fuelForm.fuel_station || !fuelForm.liters || !fuelForm.price_per_liter) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      bus_assignment: fuelForm.bus_assignment,
      attendant: userAttendantRole.id,
      fuel_station: fuelForm.fuel_station,
      liters: parseFloat(fuelForm.liters),
      price_per_liter: parseFloat(fuelForm.price_per_liter),
      receipt_number: fuelForm.receipt_number || '',
      notes: fuelForm.notes || ''
    };

    createFuelMutation.mutate(submitData);
  };

  const calculateTotal = () => {
    const liters = parseFloat(fuelForm.liters) || 0;
    const pricePerLiter = parseFloat(fuelForm.price_per_liter) || 0;
    return liters * pricePerLiter;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  // Show loading state if user roles are still loading
  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  // Show error if user is not a fuel attendant
  if (!userAttendantRole) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not registered as a fuel attendant. Please contact your administrator to set up your attendant role.
          </AlertDescription>
        </Alert>
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
            Fuel Attendant Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.first_name}! - {userAttendantRole?.location_name}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Transactions"
          value={todayRecords.length}
          icon={Fuel}
          description="Fuel sales today"
        />
        <StatsCard
          title="Fuel Sold Today"
          value={`${todayFuelSold.toFixed(1)} L`}
          icon={Droplets}
          description="Total liters dispensed"
        />
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
          description="Total earnings"
        />
        <StatsCard
          title="Avg Price/Liter"
          value={formatCurrency(avgPricePerLiter)}
          icon={TrendingUp}
          description="Average fuel price"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Dialog open={isCreateRecordOpen} onOpenChange={setIsCreateRecordOpen}>
              <DialogTrigger asChild>
                <Button className="h-20 flex flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  New Fuel Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Fuel Record</DialogTitle>
                  <DialogDescription>
                    Record a new fuel transaction at {userAttendantRole?.location_name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bus_assignment">Bus Assignment *</Label>
                    <Select 
                      value={fuelForm.bus_assignment} 
                      onValueChange={(value) => setFuelForm(prev => ({...prev, bus_assignment: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bus assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAssignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {assignment.plate_number}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Driver: {assignment.driver_name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel_station">Fuel Station *</Label>
                    <Select 
                      value={fuelForm.fuel_station} 
                      onValueChange={(value) => setFuelForm(prev => ({...prev, fuel_station: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel station" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelStations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name} - {station.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liters">Liters *</Label>
                      <Input
                        id="liters"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={fuelForm.liters}
                        onChange={(e) => setFuelForm(prev => ({...prev, liters: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_per_liter">Price/Liter (RWF) *</Label>
                      <Input
                        id="price_per_liter"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={fuelForm.price_per_liter}
                        onChange={(e) => setFuelForm(prev => ({...prev, price_per_liter: e.target.value}))}
                      />
                    </div>
                  </div>
                  {fuelForm.liters && fuelForm.price_per_liter && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium">Total Amount</Label>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(calculateTotal())}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="receipt_number">Receipt Number</Label>
                    <Input
                      id="receipt_number"
                      placeholder="Enter receipt number"
                      value={fuelForm.receipt_number}
                      onChange={(e) => setFuelForm(prev => ({...prev, receipt_number: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about the fuel transaction..."
                      value={fuelForm.notes}
                      onChange={(e) => setFuelForm(prev => ({...prev, notes: e.target.value}))}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateRecordOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRecord} 
                    disabled={createFuelMutation.isPending || !fuelForm.bus_assignment || !fuelForm.fuel_station || !fuelForm.liters || !fuelForm.price_per_liter}
                  >
                    {createFuelMutation.isPending ? 'Creating...' : 'Create Record'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              Daily Report
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              Schedule
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Clock className="h-6 w-6" />
              Time Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by bus, station, receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('today');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No fuel records found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {fuelRecords.length === 0 
                  ? "Start by creating your first fuel record."
                  : "Try adjusting your filters to see more records."
                }
              </p>
              <Button onClick={() => setIsCreateRecordOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Fuel Record
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* Bus Info */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          Bus Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Bus:</span> {record.bus_plate_number}</p>
                          <p><span className="text-muted-foreground">Driver:</span> {record.driver_name}</p>
                        </div>
                      </div>

                      {/* Fuel Info */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          Fuel Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Station:</span> {record.fuel_station_name}</p>
                          <p><span className="text-muted-foreground">Liters:</span> {record.liters} L</p>
                          <p><span className="text-muted-foreground">Price/L:</span> {formatCurrency(record.price_per_liter)}</p>
                          <p><span className="text-muted-foreground">Total:</span> 
                            <span className="font-medium text-green-600 ml-1">{formatCurrency(record.total_amount)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Transaction Info
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Date:</span> {new Date(record.timestamp).toLocaleDateString()}</p>
                          <p><span className="text-muted-foreground">Time:</span> {new Date(record.timestamp).toLocaleTimeString()}</p>
                          {record.receipt_number && (
                            <p><span className="text-muted-foreground">Receipt:</span> 
                              <Badge variant="outline" className="ml-1">{record.receipt_number}</Badge>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="font-semibold mb-2">Actions</h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewRecordOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {record.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {record.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Record Dialog */}
      <Dialog open={isViewRecordOpen} onOpenChange={setIsViewRecordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fuel Record Details</DialogTitle>
            <DialogDescription>
              Complete information about this fuel transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bus</Label>
                  <p className="text-sm">{selectedRecord.bus_plate_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Driver</Label>
                  <p className="text-sm">{selectedRecord.driver_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fuel Station</Label>
                  <p className="text-sm">{selectedRecord.fuel_station_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Liters</Label>
                  <p className="text-sm">{selectedRecord.liters} L</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Price per Liter</Label>
                  <p className="text-sm">{formatCurrency(selectedRecord.price_per_liter)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(selectedRecord.total_amount)}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">{new Date(selectedRecord.timestamp).toLocaleString()}</p>
                </div>
                {selectedRecord.receipt_number && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Receipt Number</Label>
                    <p className="text-sm">{selectedRecord.receipt_number}</p>
                  </div>
                )}
              </div>
              {selectedRecord.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewRecordOpen(false)}>
              Close
            </Button>
            <Button>
              <Edit className="w-4 h-4 mr-1" />
              Edit Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}