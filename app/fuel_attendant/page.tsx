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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCard } from "@/components/ui/StatsCard";
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
  Droplets,
  ChevronUp,
  ChevronDown,
  Tags,
  Info
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { fuelAPI, userServiceRoleAPI, fuelStationAPI } from '@/lib/api';

export default function EnhancedFuelAttendantDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);
  const [userAttendantRole, setUserAttendantRole] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // Enhanced form state for creating new fuel record
  const [fuelForm, setFuelForm] = useState({
    bus_assignment: '',
    fuel_type: 'petrol',
    fuel_price: '',
    liters: '',
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

  // Fetch available fuel prices for the user's station
  const { data: availablePricesData } = useQuery({
    queryKey: ['available-fuel-prices'],
    queryFn: () => fuelAPI.getAvailablePrices(),
    enabled: !!userAttendantRole
  });

  // Fetch active bus assignments
  const { data: activeAssignmentsData } = useQuery({
    queryKey: ['active-assignments-fuel'],
    queryFn: () => fuelAPI.getActiveAssignments(),
    enabled: !!userAttendantRole
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
  const availablePrices = availablePricesData?.data.data?.available_prices || [];
  const activeAssignments = activeAssignmentsData?.data.data?.active_assignments || [];
  const stationInfo = availablePricesData?.data.data;

  // Group available prices by fuel type for easier selection
  const pricesByFuelType = availablePrices.reduce((acc, price) => {
    if (!acc[price.fuel_type]) {
      acc[price.fuel_type] = [];
    }
    acc[price.fuel_type].push(price);
    return acc;
  }, {});

  // Get available fuel types
  const availableFuelTypes = Object.keys(pricesByFuelType);

  // Filter available prices based on selected fuel type
  const filteredPrices = pricesByFuelType[fuelForm.fuel_type] || [];

  // Get selected price details
  const selectedPrice = availablePrices.find(price => price.id === fuelForm.fuel_price);

  // Filter records based on search and date
  const filteredRecords = fuelRecords.filter((record) => {
    const matchesSearch = 
      record.bus_plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fuel_station_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fuel_type?.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested properties
    if (sortConfig.key === 'bus_plate_number') {
      aValue = a.bus_plate_number;
      bValue = b.bus_plate_number;
    } else if (sortConfig.key === 'fuel_station_name') {
      aValue = a.fuel_station_name;
      bValue = b.fuel_station_name;
    } else if (sortConfig.key === 'driver_name') {
      aValue = a.driver_name;
      bValue = b.driver_name;
    }

    // Convert to comparable values
    if (sortConfig.key === 'timestamp') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (['liters', 'price_per_liter', 'total_amount'].includes(sortConfig.key)) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    } else {
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
    }

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
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
      fuel_type: 'petrol',
      fuel_price: '',
      liters: '',
      receipt_number: '',
      notes: ''
    });
  };

  const handleCreateRecord = () => {
    if (!userAttendantRole) {
      toast.error('You must be registered as a fuel attendant to create records');
      return;
    }

    if (!fuelForm.bus_assignment || !fuelForm.fuel_type || !fuelForm.fuel_price || !fuelForm.liters) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      bus_assignment: fuelForm.bus_assignment,
      fuel_type: fuelForm.fuel_type,
      fuel_price: fuelForm.fuel_price,
      liters: parseFloat(fuelForm.liters),
      receipt_number: fuelForm.receipt_number || '',
      notes: fuelForm.notes || ''
    };

    createFuelMutation.mutate(submitData);
  };

  const calculateTotal = () => {
    const liters = parseFloat(fuelForm.liters) || 0;
    const pricePerLiter = selectedPrice ? parseFloat(selectedPrice.price_per_liter) : 0;
    return liters * pricePerLiter;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortableHeader = ({ children, sortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  // Handle fuel type change - reset fuel price selection
  const handleFuelTypeChange = (fuelType) => {
    setFuelForm(prev => ({
      ...prev,
      fuel_type: fuelType,
      fuel_price: '' // Reset price selection when fuel type changes
    }));
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

      {/* Station Info Card */}
      {stationInfo && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Fuel className="w-5 h-5" />
              Station Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-orange-700">Station</Label>
                <p className="text-lg font-semibold text-orange-900">{stationInfo.station_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-orange-700">Available Fuel Types</Label>
                <div className="flex gap-1 mt-1">
                  {availableFuelTypes.map(type => (
                    <Badge key={type} variant="outline" className="text-xs border-orange-300 text-orange-700">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-orange-700">Current Prices</Label>
                <div className="space-y-1">
                  {availablePrices.slice(0, 2).map(price => (
                    <div key={price.id} className="text-xs text-orange-800">
                      {price.fuel_type}: {formatCurrency(price.price_per_liter)}/L
                    </div>
                  ))}
                  {availablePrices.length > 2 && (
                    <div className="text-xs text-orange-600">+{availablePrices.length - 2} more</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="Search by bus, fuel type, receipt..."
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
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Fuel Record</DialogTitle>
                  <DialogDescription>
                    Record a new fuel transaction at {userAttendantRole?.location_name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
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
                                {assignment.bus_plate_number}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Driver: {assignment.driver_name} - {assignment.driver_phone}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Fuel Type *</Label>
                    <Select 
                      value={fuelForm.fuel_type} 
                      onValueChange={handleFuelTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFuelTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Tags className="w-4 h-4" />
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuel_price">Price Selection *</Label>
                    <Select 
                      value={fuelForm.fuel_price} 
                      onValueChange={(value) => setFuelForm(prev => ({...prev, fuel_price: value}))}
                      disabled={!fuelForm.fuel_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !fuelForm.fuel_type 
                            ? "Select fuel type first" 
                            : "Select price option"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPrices.map((price) => (
                          <SelectItem key={price.id} value={price.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{price.display_name}</span>
                              <Badge variant="outline" className="ml-2">
                                Current
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fuelForm.fuel_type && filteredPrices.length === 0 && (
                      <p className="text-sm text-orange-600 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        No active prices available for {fuelForm.fuel_type}. Contact admin.
                      </p>
                    )}
                  </div>

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

                  {selectedPrice && fuelForm.liters && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-orange-700">Fuel Type</Label>
                          <p className="font-medium text-orange-900">
                            {selectedPrice.fuel_type.charAt(0).toUpperCase() + selectedPrice.fuel_type.slice(1)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-orange-700">Price per Liter</Label>
                          <p className="font-medium text-orange-900">
                            {formatCurrency(selectedPrice.price_per_liter)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-orange-700">Liters</Label>
                          <p className="font-medium text-orange-900">{fuelForm.liters} L</p>
                        </div>
                        <div>
                          <Label className="text-orange-700">Total Amount</Label>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(calculateTotal())}
                          </p>
                        </div>
                      </div>
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
                    disabled={
                      createFuelMutation.isPending || 
                      !fuelForm.bus_assignment || 
                      !fuelForm.fuel_type || 
                      !fuelForm.fuel_price || 
                      !fuelForm.liters
                    }
                  >
                    {createFuelMutation.isPending ? 'Creating...' : 'Create Record'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5" />
              Fuel Records ({sortedRecords.length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCreateRecordOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recordsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading records...
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="text-center py-8 px-6">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHeader sortKey="timestamp">Date & Time</SortableHeader>
                    <SortableHeader sortKey="bus_plate_number">Bus</SortableHeader>
                    <SortableHeader sortKey="driver_name">Driver</SortableHeader>
                    <SortableHeader sortKey="fuel_type">Fuel Type</SortableHeader>
                    <SortableHeader sortKey="liters">Liters</SortableHeader>
                    <SortableHeader sortKey="price_per_liter">Price/L</SortableHeader>
                    <SortableHeader sortKey="total_amount">Total</SortableHeader>
                    <TableHead>Receipt</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{record.bus_plate_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{record.driver_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {record.fuel_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{record.liters}L</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatCurrency(record.price_per_liter)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(record.total_amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {record.receipt_number ? (
                          <Badge variant="outline" className="text-xs">
                            {record.receipt_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewRecordOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <Label className="text-sm font-medium">Fuel Type</Label>
                  <Badge variant="outline" className="capitalize text-xs">
                    {selectedRecord.fuel_type}
                  </Badge>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}