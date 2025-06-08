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
  Fuel, 
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
  DollarSign
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { fuelStationAPI } from '@/lib/api';

interface FuelStation {
  id: string;
  name: string;
  location: string;
  contact_info?: string;
  phone?: string;
  fuel_types?: string[];
  price_per_liter?: number;
  is_active: boolean;
  created_at: string;
  attendant_count?: number;
}

interface FuelStationFormData {
  name: string;
  location: string;
  contact_info: string;
  phone: string;
  fuel_types: string[];
  price_per_liter: number;
  is_active: boolean;
}

export default function FuelStationsManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<FuelStation | null>(null);
  const [stationToDelete, setStationToDelete] = useState<FuelStation | null>(null);

  // Form state
  const [formData, setFormData] = useState<FuelStationFormData>({
    name: '',
    location: '',
    contact_info: '',
    phone: '',
    fuel_types: [],
    price_per_liter: 0,
    is_active: true
  });

  // Available fuel types
  const availableFuelTypes = [
    'Petrol',
    'Diesel',
    'Premium',
    'Super',
    'Kerosene',
    'Gas Oil'
  ];

  // Fetch fuel stations
  const { data: stationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['fuel-stations', searchTerm, statusFilter],
    queryFn: () => fuelStationAPI.getAll(),
  });

  // Create station mutation
  const createStationMutation = useMutation({
    mutationFn: (data: FuelStationFormData) => fuelStationAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Fuel station created successfully!');
    },
    onError: (error: any) => {
      console.error('Create station error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to create fuel station';
      toast.error(errorMessage);
    }
  });

  // Update station mutation
  const updateStationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FuelStationFormData> }) =>
      fuelStationAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      setIsEditDialogOpen(false);
      setSelectedStation(null);
      resetForm();
      toast.success('Fuel station updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update station error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to update fuel station';
      toast.error(errorMessage);
    }
  });

  // Delete station mutation
  const deleteStationMutation = useMutation({
    mutationFn: (id: string) => fuelStationAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      setStationToDelete(null);
      toast.success('Fuel station deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete station error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete fuel station';
      toast.error(errorMessage);
    }
  });

  const stations = stationsData?.data?.data || stationsData?.data || [];

  // Filter stations
  const filteredStations = stations.filter((station: FuelStation) => {
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
  const activeStations = stations.filter((s: FuelStation) => s.is_active).length;
  const inactiveStations = totalStations - activeStations;
  const avgPrice = stations.length > 0 ? 
    stations.reduce((sum: number, s: FuelStation) => sum + (s.price_per_liter || 0), 0) / stations.length : 0;

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      contact_info: '',
      phone: '',
      fuel_types: [],
      price_per_liter: 0,
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

  const handleEditStation = (station: FuelStation) => {
    setSelectedStation(station);
    setFormData({
      name: station.name,
      location: station.location,
      contact_info: station.contact_info || '',
      phone: station.phone || '',
      fuel_types: station.fuel_types || [],
      price_per_liter: station.price_per_liter || 0,
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

  const handleViewStation = (station: FuelStation) => {
    setSelectedStation(station);
    setIsViewDialogOpen(true);
  };

  const handleDeleteStation = (station: FuelStation) => {
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

  const handleFuelTypeToggle = (fuelType: string) => {
    setFormData(prev => ({
      ...prev,
      fuel_types: prev.fuel_types.includes(fuelType)
        ? prev.fuel_types.filter(type => type !== fuelType)
        : [...prev.fuel_types, fuelType]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  // Check if user can manage fuel stations
  const canManageStations = user?.is_superuser || user?.user_roles?.some((role: string) => 
    ['admin', 'System Admin', 'Company Admin'].includes(role)
  );

  if (!canManageStations) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage fuel stations.
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
            Fuel Stations Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage fuel stations and service locations
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
          description="All fuel stations"
        />
        <StatsCard
          title="Active Stations"
          value={activeStations}
          icon={Fuel}
          description="Currently operational"
        />
        <StatsCard
          title="Inactive Stations"
          value={inactiveStations}
          icon={AlertCircle}
          description="Currently inactive"
        />
        <StatsCard
          title="Avg. Price/Liter"
          value={formatCurrency(avgPrice)}
          icon={DollarSign}
          description="Average fuel price"
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
            <Fuel className="w-5 h-5" />
            Fuel Stations ({filteredStations.length})
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
              <p className="text-lg font-medium">Error loading fuel stations</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-8">
              <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No fuel stations found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {stations.length === 0 
                  ? "Start by creating your first fuel station."
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
              {filteredStations.map((station: FuelStation) => (
                <Card key={station.id} className="border-l-4 border-l-orange-500">
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

                        {/* Contact & Price Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact & Pricing
                          </h4>
                          <div className="space-y-1 text-sm">
                            {station.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {station.phone}
                              </p>
                            )}
                            <p><span className="text-muted-foreground">Price/L:</span> {formatCurrency(station.price_per_liter || 0)}</p>
                            <p><span className="text-muted-foreground">Attendants:</span> {station.attendant_count || 0}</p>
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
            <DialogTitle>Create New Fuel Station</DialogTitle>
            <DialogDescription>
              Add a new fuel station to the system.
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
                <Label htmlFor="price_per_liter">Price per Liter (RWF)</Label>
                <Input
                  id="price_per_liter"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_per_liter}
                  onChange={(e) => setFormData(prev => ({...prev, price_per_liter: parseFloat(e.target.value) || 0}))}
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
              <Label>Fuel Types Available</Label>
              <div className="grid grid-cols-3 gap-2">
                {availableFuelTypes.map((fuelType) => (
                  <div key={fuelType} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`fuel_${fuelType}`}
                      checked={formData.fuel_types.includes(fuelType)}
                      onChange={() => handleFuelTypeToggle(fuelType)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`fuel_${fuelType}`} className="text-sm">
                      {fuelType}
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
            <DialogTitle>Edit Fuel Station</DialogTitle>
            <DialogDescription>
              Update fuel station information.
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
                <Label htmlFor="edit_price_per_liter">Price per Liter (RWF)</Label>
                <Input
                  id="edit_price_per_liter"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price_per_liter}
                  onChange={(e) => setFormData(prev => ({...prev, price_per_liter: parseFloat(e.target.value) || 0}))}
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
              <Label>Fuel Types Available</Label>
              <div className="grid grid-cols-3 gap-2">
                {availableFuelTypes.map((fuelType) => (
                  <div key={fuelType} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit_fuel_${fuelType}`}
                      checked={formData.fuel_types.includes(fuelType)}
                      onChange={() => handleFuelTypeToggle(fuelType)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`edit_fuel_${fuelType}`} className="text-sm">
                      {fuelType}
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
            <DialogTitle>Fuel Station Details</DialogTitle>
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
                  <Label className="text-sm font-medium">Price per Liter</Label>
                  <p className="text-sm mt-1">{formatCurrency(selectedStation.price_per_liter || 0)}</p>
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
              {selectedStation.fuel_types && selectedStation.fuel_types.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Fuel Types Available</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStation.fuel_types.map((type) => (
                      <Badge key={type} variant="outline">
                        {type}
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
            <DialogTitle>Delete Fuel Station</DialogTitle>
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