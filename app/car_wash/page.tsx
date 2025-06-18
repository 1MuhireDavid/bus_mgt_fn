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
  Droplets, 
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
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";

import { carWashAPI, assignmentAPI, userServiceRoleAPI } from '@/lib/api';

export default function CarWashAttendantDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);
  const [userAttendantRole, setUserAttendantRole] = useState(null);

  // Form state for creating new wash record
  const [washForm, setWashForm] = useState({
    bus_assignment: '',
    cost: '',
    service_type: 'basic_wash',
    notes: ''
  });

  // Service types available
  const serviceTypes = [
    { value: 'basic_wash', label: 'Basic Wash' },
    { value: 'premium_wash', label: 'Premium Wash' },
    { value: 'full_service', label: 'Full Service'},
    { value: 'interior_only', label: 'Interior Only' },
    { value: 'exterior_only', label: 'Exterior Only'}
  ];

  // Fetch user's service roles to get attendant info
  const { data: userRolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-service-roles'],
    queryFn: () => userServiceRoleAPI.getMyRoles(),
    onSuccess: (data) => {
      const carWashRole = data?.data?.find(role => role.attendant_type === 'car_wash');
      setUserAttendantRole(carWashRole);
    }
  });

  // Fetch car wash records (filtered by user's attendant role)
  const { data: washRecordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['car-wash-records'],
    queryFn: () => carWashAPI.getMyRecords(), // Use getMyRecords for attendant-specific records
  });

  // Fetch bus assignments for dropdown
  const { data: assignmentsData } = useQuery({
    queryKey: ['bus-assignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  // Fetch wash statistics
  const { data: statsData } = useQuery({
    queryKey: ['car-wash-statistics'],
    queryFn: () => carWashAPI.getStatistics(userAttendantRole?.id),
    enabled: !!userAttendantRole?.id
  });

  // Create wash record mutation
  const createWashMutation = useMutation({
    mutationFn: (data) => carWashAPI.createRecord(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-records'] });
      queryClient.invalidateQueries({ queryKey: ['car-wash-statistics'] });
      setIsCreateRecordOpen(false);
      resetForm();
      toast.success('Car wash record created successfully!');
    },
    onError: (error) => {
      console.error('Create record error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail ||
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to create wash record';
      toast.error(errorMessage);
    }
  });

  // Set user's attendant role when data is loaded
  useEffect(() => {
    if (userRolesData?.data) {
      const carWashRole = userRolesData.data.data.find(role => role.attendant_type === 'car_wash');
      setUserAttendantRole(carWashRole);
    }
  }, [userRolesData]);

  const washRecords = washRecordsData?.data.data || [];
  const assignments = assignmentsData?.data || [];

  // Filter active bus assignments only
  const activeAssignments = assignments.filter(assignment => 
    assignment.status === 'assigned'
  );
  // Filter records based on search and date
  const filteredRecords = washRecords.filter((record) => {
    const matchesSearch = 
      record.bus_assignment?.bus?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const todayEarnings = todayRecords.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0);
  const avgServiceCost = filteredRecords.length > 0 ? 
    filteredRecords.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0) / filteredRecords.length : 0;

  const resetForm = () => {
    setWashForm({
      bus_assignment: '',
      cost: '',
      service_type: 'basic_wash',
      notes: ''
    });
  };

  const handleCreateRecord = () => {
    if (!userAttendantRole) {
      toast.error('You must be registered as a car wash attendant to create records');
      return;
    }

    if (!washForm.bus_assignment || !washForm.cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      bus_assignment: washForm.bus_assignment,
      service_type: washForm.service_type,
      cost: parseFloat(washForm.cost),
      notes: washForm.notes || '',
      attendant: washRecordsData?.data?.data?.[0]?.attendant,
      car_wash_station: washRecordsData?.data?.data?.[0]?.car_wash_station
    };

    createWashMutation.mutate(submitData);
  };

  const handleServiceTypeChange = (serviceType) => {
    setWashForm(prev => ({
      ...prev,
      service_type: serviceType
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  const getServiceBadge = (serviceType) => {
    const variants = {
      basic_wash: 'outline',
      premium_wash: 'default',
      full_service: 'secondary',
      interior_only: 'outline',
      exterior_only: 'outline'
    };
    return <Badge variant={variants[serviceType] || 'outline'}>{serviceType.replace('_', ' ')}</Badge>;
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

  // Show error if user is not a car wash attendant
  if (!userAttendantRole) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not registered as a car wash attendant. Please contact your administrator to set up your attendant role.
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
            <Droplets className="w-8 h-8 text-blue-600" />
            Car Wash Dashboard
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
          title="Today's Services"
          value={todayRecords.length}
          icon={Droplets}
          description="Cars washed today"
        />
        <StatsCard
          title="Today's Earnings"
          value={formatCurrency(todayEarnings)}
          icon={DollarSign}
          description="Revenue generated"
        />
        <StatsCard
          title="Total This Week"
          value={filteredRecords.filter(r => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(r.timestamp) >= weekAgo;
          }).length}
          icon={Calendar}
          description="This week's services"
        />
        <StatsCard
          title="Average Service Cost"
          value={formatCurrency(avgServiceCost)}
          icon={TrendingUp}
          description="Per service average"
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
                  New Wash Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Wash Record</DialogTitle>
                  <DialogDescription>
                    Record a new car wash service at {userAttendantRole?.location_name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bus_assignment">Bus Assignment *</Label>
                    <Select 
                      value={washForm.bus_assignment} 
                      onValueChange={(value) => setWashForm(prev => ({...prev, bus_assignment: value}))}
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
                                Driver: {assignment.driver_name} - 
                                {assignment.driver_phone_number}  
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select 
                      value={washForm.service_type} 
                      onValueChange={handleServiceTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.value} value={service.value}>
                            <div className="flex justify-between items-center w-full">
                              <span>{service.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (RWF) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0.00"
                      value={washForm.cost}
                      onChange={(e) => setWashForm(prev => ({...prev, cost: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about the service..."
                      value={washForm.notes}
                      onChange={(e) => setWashForm(prev => ({...prev, notes: e.target.value}))}
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
                    disabled={createWashMutation.isPending || !washForm.bus_assignment || !washForm.cost}
                  >
                    {createWashMutation.isPending ? 'Creating...' : 'Create Record'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  placeholder="Search by bus, service type..."
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

      {/* Service Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Service Records ({filteredRecords.length})
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
              <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No wash records found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {washRecords.length === 0 
                  ? "Start by creating your first wash record."
                  : "Try adjusting your filters to see more records."
                }
              </p>
              <Button onClick={() => setIsCreateRecordOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Wash Record
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.bus_plate_number}
                      </TableCell>
                      <TableCell>{record.driver_name}</TableCell>
                      <TableCell>
                        {getServiceBadge(record.service_type)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(record.cost)}
                      </TableCell>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {record.notes ? (
                          <span className="text-sm text-muted-foreground truncate block">
                            {record.notes.length > 50 
                              ? record.notes.substring(0, 50) + '...' 
                              : record.notes
                            }
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No notes</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsViewRecordOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
            <DialogTitle>Wash Record Details</DialogTitle>
            <DialogDescription>
              Complete information about this car wash service.
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
                  <Label className="text-sm font-medium">Service Type</Label>
                  <div className="mt-1">{getServiceBadge(selectedRecord.service_type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cost</Label>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(selectedRecord.cost)}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">{new Date(selectedRecord.timestamp).toLocaleString()}</p>
                </div>
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