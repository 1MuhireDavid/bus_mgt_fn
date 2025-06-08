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
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Bus,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { maintenanceAPI, assignmentAPI, maintenanceTypesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function EnhancedMaintenancePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const {user} = useAuthStore()

  // Form state for creating new maintenance record
  const [newRecord, setNewRecord] = useState({
    bus_assignment_id: '',
    maintenance_type_id: '',
    description: '',
    cost: '',
    attendant: '',
    company: ''
  });

  // Fetch maintenance records
  const { data: maintenanceData, isLoading, isError } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: () => maintenanceAPI.getAll(),
  });

  // Fetch maintenance types
  const { data: typesData } = useQuery({
    queryKey: ['maintenance-types'],
    queryFn: () => maintenanceTypesAPI.getAll(),
  });

  // Fetch bus assignments for the dropdown
  const { data: assignmentsData } = useQuery({
    queryKey: ['bus-assignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  // Fetch maintenance statistics
  const { data: statsData } = useQuery({
    queryKey: ['maintenance-statistics'],
    queryFn: () => maintenanceAPI.getStatistics(),
  });

  // Create maintenance record mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: (data) => maintenanceAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-statistics'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create maintenance record:', error);
    }
  });

  const records = maintenanceData?.data?.results || maintenanceData?.data || [];
  const maintenanceTypes = typesData?.data?.results || typesData?.data || [];
  const assignments = assignmentsData?.data?.results || assignmentsData?.data || [];
  const stats = statsData?.data || {};

  // Filter records based on search and filters
  const filteredRecords = records.filter((record) => {
    const busPlateNumber = record.bus_plate_number || '';
    const maintenanceTypeName = record.maintenance_type_name || '';
    
    const matchesSearch = 
      maintenanceTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      busPlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || record.maintenance_type_id?.name === typeFilter;

    let matchesDate = true;
    if (dateRange !== 'all') {
      const recordDate = new Date(record.timestamp);
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      matchesDate = recordDate >= cutoffDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Calculate statistics from filtered records
  const totalCost = filteredRecords.reduce((sum, record) => sum + parseFloat(record.cost || 0), 0);
  const avgCost = filteredRecords.length > 0 ? totalCost / filteredRecords.length : 0;

  const resetForm = () => {
    setNewRecord({
      bus_assignment_id: '',
      maintenance_type_id: '',
      description: '',
      cost: '',
      attendant: '',
      company: ''
    });
  };
  const handleCreateRecord = () => {
    
    const submitData = {
      ...newRecord,
      cost: parseFloat(newRecord.cost) || 0,
      bus_assignment: newRecord.bus_assignment_id,
      maintenance_type_id: newRecord.maintenance_type_id,
      attendant: user?.id,
      company: user?.company

    };
    createMaintenanceMutation.mutate(submitData);
  };

  const getPriorityBadge = (type) => {
    const typeName = type?.name?.toLowerCase() || '';
    if (typeName.includes('emergency') || typeName.includes('brake') || typeName.includes('engine')) {
      return <Badge variant="destructive">High Priority</Badge>;
    }
    if (typeName.includes('safety') || typeName.includes('transmission')) {
      return <Badge variant="default">Medium Priority</Badge>;
    }
    return <Badge variant="outline">Low Priority</Badge>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="w-8 h-8 text-blue-600" />
            Maintenance Management
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage bus maintenance records</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Maintenance Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Record</DialogTitle>
              <DialogDescription>
                Record a new maintenance activity for your fleet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bus_assignment">Bus Assignment</Label>
                <Select 
                  value={newRecord.bus_assignment_id} 
                  onValueChange={(value) => setNewRecord(prev => ({...prev, bus_assignment_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bus assignment" />
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
                <Label htmlFor="maintenance_type_id">Maintenance Type</Label>
                <Select 
                  value={newRecord.maintenance_type_id} 
                  onValueChange={(value) => setNewRecord(prev => ({...prev, maintenance_type_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.name}</span>
                          {type.description && (
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          )}
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
                  value={newRecord.cost}
                  onChange={(e) => setNewRecord(prev => ({...prev, cost: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the maintenance work performed..."
                  value={newRecord.description}
                  onChange={(e) => setNewRecord(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRecord} 
                disabled={createMaintenanceMutation.isPending || !newRecord.bus_assignment_id || !newRecord.maintenance_type_id || !newRecord.description}
              >
                {createMaintenanceMutation.isPending ? 'Creating...' : 'Create Record'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.total_records || filteredRecords.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.total_cost || totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.average_cost_per_record || avgCost)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Maintenance Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setDateRange('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading and Error States */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading maintenance records...</p>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Failed to fetch maintenance records. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && filteredRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No maintenance records found</h3>
            <p className="text-muted-foreground mb-4">
              {records.length === 0 
                ? "Get started by creating your first maintenance record."
                : "Try adjusting your filters to see more records."
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Maintenance Record
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Records Grid */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{record.maintenance_type_name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Bus className="w-4 h-4" />
                      {record.bus_plate_number || 'N/A'}
                    </p>
                    {record.bus_assignment?.driver && (
                      <p className="text-xs text-muted-foreground">
                        Driver: {record.driver_name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {getPriorityBadge(record.maintenance_type_id)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(record.cost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendant:</span>
                  <span className="text-xs">{record.attendant} {record.attendant?.last_name}</span>
                </div>
                {record.description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1 text-gray-700 line-clamp-2">{record.description}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsViewDialogOpen(true);
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Record Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Maintenance Record Details</DialogTitle>
            <DialogDescription>
              Complete information about this maintenance record.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedRecord.maintenance_type_id?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cost</Label>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(selectedRecord.cost)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bus</Label>
                  <p className="text-sm">{selectedRecord.bus_assignment?.bus?.plate_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Driver</Label>
                  <p className="text-sm">{selectedRecord.bus_assignment?.driver?.driver_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Attendant</Label>
                  <p className="text-sm">{selectedRecord.attendant?.first_name} {selectedRecord.attendant?.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{new Date(selectedRecord.timestamp).toLocaleString()}</p>
                </div>
              </div>
              {selectedRecord.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedRecord.description}</p>
                </div>
              )}
              {selectedRecord.maintenance_type_id?.description && (
                <div>
                  <Label className="text-sm font-medium">Type Description</Label>
                  <p className="text-sm mt-1 p-3 bg-blue-50 rounded-md">{selectedRecord.maintenance_type_id.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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
