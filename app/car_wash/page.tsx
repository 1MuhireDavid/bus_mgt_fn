'use client';

import { useState } from 'react';
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
import { 
  Droplets, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Bus,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";

import { carWashAPI, assignmentAPI } from '@/lib/api';

export default function CarWashAttendantDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [isCreateRecordOpen, setIsCreateRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewRecordOpen, setIsViewRecordOpen] = useState(false);

  // Form state for creating new wash record
  const [washForm, setWashForm] = useState({
    bus_assignment: '',
    cost: '',
    service_type: 'basic_wash',
    notes: ''
  });

  // Service types available
  const serviceTypes = [
    { value: 'basic_wash', label: 'Basic Wash', basePrice: 500 },
    { value: 'premium_wash', label: 'Premium Wash', basePrice: 800 },
    { value: 'full_service', label: 'Full Service', basePrice: 1200 },
    { value: 'interior_only', label: 'Interior Only', basePrice: 300 },
    { value: 'exterior_only', label: 'Exterior Only', basePrice: 400 }
  ];

  // Fetch car wash records
  const { data: washRecordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['car-wash-records'],
    queryFn: () => carWashAPI.getRecords(),
  });

  // Fetch bus assignments for dropdown
  const { data: assignmentsData } = useQuery({
    queryKey: ['bus-assignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  // Fetch wash statistics
  const { data: statsData } = useQuery({
    queryKey: ['car-wash-statistics'],
    queryFn: () => carWashAPI.getStatistics(),
  });

  // Create wash record mutation
  const createWashMutation = useMutation({
    mutationFn: (data) => carWashAPI.createRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-records'] });
      queryClient.invalidateQueries({ queryKey: ['car-wash-statistics'] });
      setIsCreateRecordOpen(false);
      resetForm();
    },
  });

 
  const washRecords = washRecordsData?.data || [];
  const assignments = assignmentsData?.data|| [];
  const stats = statsData?.data || {};

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
    const submitData = {
      ...washForm,
      cost: parseFloat(washForm.cost) || 0,
      attendant: user?.id
    };
    createWashMutation.mutate(submitData);
  };

  const handleServiceTypeChange = (serviceType) => {
    const selectedService = serviceTypes.find(s => s.value === serviceType);
    setWashForm(prev => ({
      ...prev,
      service_type: serviceType,
      cost: selectedService?.basePrice?.toString() || ''
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
    return <Badge variant={variants[serviceType] || 'outline'}>{serviceType}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Droplets className="w-8 h-8 text-blue-600" />
            Car Wash Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.first_name}!</p>
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
                    Record a new car wash service.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bus_assignment">Bus Assignment</Label>
                    <Select 
                      value={washForm.bus_assignment} 
                      onValueChange={(value) => setWashForm(prev => ({...prev, bus_assignment: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bus assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{assignment.plate_number}</span>
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
                    <Label htmlFor="service_type">Service Type</Label>
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
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatCurrency(service.basePrice)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (RWF)</Label>
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

      {/* Service Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Service Records
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
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* Bus Info */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          Bus Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Bus:</span> {record.bus_assignment?.bus?.plate_number}</p>
                          <p><span className="text-muted-foreground">Driver:</span> {record.bus_assignment?.driver?.driver_name}</p>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          Service
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div>{getServiceBadge(record.service_type)}</div>
                          <p><span className="text-muted-foreground">Cost:</span> 
                            <span className="font-medium text-green-600 ml-1">{formatCurrency(record.cost)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Timing
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Date:</span> {new Date(record.timestamp).toLocaleDateString()}</p>
                          <p><span className="text-muted-foreground">Time:</span> {new Date(record.timestamp).toLocaleTimeString()}</p>
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
                  <p className="text-sm">{selectedRecord.bus_assignment?.bus?.plate_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Driver</Label>
                  <p className="text-sm">{selectedRecord.bus_assignment?.driver?.driver_name}</p>
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