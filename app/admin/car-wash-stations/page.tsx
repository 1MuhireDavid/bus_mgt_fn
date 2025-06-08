'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "react-toastify";
import { 
  Droplets, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Users,
  RefreshCw,
  AlertCircle,
  Building2,
  Clock,
  Settings
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { carWashStationAPI } from '@/lib/api';

interface CarWashStation {
  id: string;
  name: string;
  location: string;
  contact_info?: string;
  phone?: string;
  services_offered?: string[];
  operating_hours?: string;
  is_active: boolean;
  created_at: string;
  attendant_count?: number;
}

interface CarWashStationFormData {
  name: string;
  location: string;
  contact_info: string;
  phone: string;
  services_offered: string[];
  operating_hours: string;
  is_active: boolean;
}

export default function CarWashStationsManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<CarWashStation | null>(null);
  const [stationToDelete, setStationToDelete] = useState<CarWashStation | null>(null);

  // Form state
  const [formData, setFormData] = useState<CarWashStationFormData>({
    name: '',
    location: '',
    contact_info: '',
    phone: '',
    services_offered: [],
    operating_hours: '',
    is_active: true
  });

  // Available services
  const availableServices = [
    'Basic Wash',
    'Premium Wash',
    'Full Service',
    'Interior Cleaning',
    'Exterior Wash',
    'Wax & Polish',
    'Engine Cleaning',
    'Undercarriage Wash',
    'Vacuum Service',
    'Detailing'
  ];

  // Fetch car wash stations
  const { data: stationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['car-wash-stations', searchTerm, statusFilter],
    queryFn: () => carWashStationAPI.getAll(),
  });

  // Create station mutation
  const createStationMutation = useMutation({
    mutationFn: (data: CarWashStationFormData) => carWashStationAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-stations'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Car wash station created successfully!');
    },
    onError: (error: any) => {
      console.error('Create station error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to create car wash station';
      toast.error(errorMessage);
    }
  });

  // Update station mutation
  const updateStationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CarWashStationFormData> }) =>
      carWashStationAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-stations'] });
      setIsEditDialogOpen(false);
      setSelectedStation(null);
      resetForm();
      toast.success('Car wash station updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update station error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to update car wash station';
      toast.error(errorMessage);
    }
  });

  // Delete station mutation
  const deleteStationMutation = useMutation({
    mutationFn: (id: string) => carWashStationAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-stations'] });
      setStationToDelete(null);
      toast.success('Car wash station deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete station error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete car wash station';
      toast.error(errorMessage);
    }
  });

  const stations = stationsData?.data?.data || stationsData?.data || [];

  // Filter stations
  const filteredStations = stations.filter((station: CarWashStation) => {
    const matchesSearch = 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.contact_info?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && station.is_active) ||
      (statusFilter === 'inactive' && !station.is_active);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalStations = stations.length;
  const activeStations = stations.filter((s: CarWashStation) => s.is_active).length;
  const inactiveStations = totalStations - activeStations;
  const totalAttendants = stations.reduce((sum: number, s: CarWashStation) => sum + (s.attendant_count || 0), 0);

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      contact_info: '',
      phone: '',
      services_offered: [],
      operating_hours: '',
      is_active: true
    });
  };

  const handleCreateStation = () => {
    if (!formData.name || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    createStationMutation.mutate(formData);
  };

  const handleEditStation = (station: CarWashStation) => {
    setSelectedStation(station);
    setFormData({
      name: station.name,
      location: station.location,
      contact_info: station.contact_info || '',
      phone: station.phone || '',
      services_offered: station.services_offered || [],
      operating_hours: station.operating_hours || '',
      is_active: station.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStation = () => {
    if (!selectedStation) return;

    if (!formData.name || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateStationMutation.mutate({
      id: selectedStation.id,
      data: formData
    });
  };

  const handleViewStation = (station: CarWashStation) => {
    setSelectedStation(station);
    setIsViewDialogOpen(true);
  };

  const handleDeleteStation = (station: CarWashStation) => {
    setStationToDelete(station);
  };

  const confirmDelete = () => {
    if (stationToDelete) {
      deleteStationMutation.mutate(stationToDelete.id);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(service)
        ? prev.services_offered.filter(s => s !== service)
        : [...prev.services_offered, service]
    }));
  };

  // Check if user can manage car wash stations
  const canManageStations = user?.is_superuser || user?.user_roles?.some((role: string) => 
    ['admin', 'System Admin', 'Company Admin'].includes(role)
  );

  if (!canManageStations) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage car wash stations.
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
            Car Wash Stations Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage car wash stations and cleaning services
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Station
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stations"
          value={totalStations}
          icon={Building2}
          description="All car wash stations"
        />
        <StatsCard
          title="Active Stations"
          value={activeStations}
          icon={Droplets}
          description="Currently operational"
        />
        <StatsCard
          title="Inactive Stations"
          value={inactiveStations}
          icon={AlertCircle}
          description="Currently inactive"
        />
        <StatsCard
          title="Total Attendants"
          value={totalAttendants}
          icon={Users}
          description="Across all stations"
        />
      </div>

      {/* Filters */}
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
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="flex-1"
                >
                  Clear Filters
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Car Wash Stations ({filteredStations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading stations...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Error loading car wash stations</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-8">
              <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No car wash stations found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {stations.length === 0 
                  ? "Start by creating your first car wash station."
                  : "Try adjusting your search or filters."
                }
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Station
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStations.map((station: CarWashStation) => (
                <Card key={station.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1">
                        {/* Station Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Station Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Name:</span> {station.name}</p>
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {station.location}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Status:</span>
                              {getStatusBadge(station.is_active)}
                            </div>
                          </div>
                        </div>

                        {/* Contact & Hours Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact & Hours
                          </h4>
                          <div className="space-y-1 text-sm">
                            {station.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {station.phone}
                              </p>
                            )}
                            {station.operating_hours && (
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {station.operating_hours}
                              </p>
                            )}
                            <p><span className="text-muted-foreground">Attendants:</span> {station.attendant_count || 0}</p>
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <h4 className="font-semibold mb-2">Services Offered</h4>
                          <div className="flex flex-wrap gap-1">
                            {station.services_offered && station.services_offered.length > 0 ? (
                              station.services_offered.slice(0, 3).map((service) => (
                                <Badge key={service} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No services listed</span>
                            )}
                            {station.services_offered && station.services_offered.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{station.services_offered.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStation(station)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStation(station)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStation(station)}
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
        </CardContent>
      </Card>

      {/* Create Station Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Car Wash Station</DialogTitle>
            <DialogDescription>
              Add a new car wash station to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Station Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter station name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Input
                  id="operating_hours"
                  placeholder="e.g., 6:00 AM - 8:00 PM"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData(prev => ({...prev, operating_hours: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Textarea
                id="location"
                placeholder="Enter station location/address"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact Info</Label>
                <Input
                  id="contact_info"
                  placeholder="Additional contact info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData(prev => ({...prev, contact_info: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Services Offered</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`service_${service}`}
                      checked={formData.services_offered.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`service_${service}`} className="text-sm">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_create"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active_create">Station is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateStation}
              disabled={createStationMutation.isPending}
            >
              {createStationMutation.isPending ? 'Creating...' : 'Create Station'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Station Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Car Wash Station</DialogTitle>
            <DialogDescription>
              Update car wash station information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Station Name *</Label>
                <Input
                  id="edit_name"
                  placeholder="Enter station name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_operating_hours">Operating Hours</Label>
                <Input
                  id="edit_operating_hours"
                  placeholder="e.g., 6:00 AM - 8:00 PM"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData(prev => ({...prev, operating_hours: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_location">Location *</Label>
              <Textarea
                id="edit_location"
                placeholder="Enter station location/address"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_contact_info">Contact Info</Label>
                <Input
                  id="edit_contact_info"
                  placeholder="Additional contact info"
                  value={formData.contact_info}
                  onChange={(e) => setFormData(prev => ({...prev, contact_info: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Services Offered</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit_service_${service}`}
                      checked={formData.services_offered.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`edit_service_${service}`} className="text-sm">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active_edit">Station is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStation}
              disabled={updateStationMutation.isPending}
            >
              {updateStationMutation.isPending ? 'Updating...' : 'Update Station'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Station Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Car Wash Station Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedStation?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedStation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Station Name</Label>
                  <p className="text-sm mt-1">{selectedStation.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedStation.is_active)}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm mt-1">{selectedStation.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm mt-1">{selectedStation.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Operating Hours</Label>
                  <p className="text-sm mt-1">{selectedStation.operating_hours || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact Info</Label>
                  <p className="text-sm mt-1">{selectedStation.contact_info || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created Date</Label>
                  <p className="text-sm mt-1">{new Date(selectedStation.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedStation.services_offered && selectedStation.services_offered.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Services Offered</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStation.services_offered.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedStation) {
                handleEditStation(selectedStation);
              }
            }}>
              <Edit className="w-4 h-4 mr-1" />
              Edit Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Car Wash Station</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{stationToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStationToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteStationMutation.isPending}
            >
              {deleteStationMutation.isPending ? 'Deleting...' : 'Delete Station'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}