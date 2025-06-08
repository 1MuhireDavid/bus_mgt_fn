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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "react-toastify";
import { 
  Wrench, 
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
  Building2
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { maintenanceGarageAPI } from '@/lib/api';

interface MaintenanceGarage {
  id: string;
  name: string;
  address: string;
  contact_info?: string;
  phone?: string;
  capacity?: number;
  services_offered?: string[];
  is_active: boolean;
  created_at: string;
  attendant_count?: number;
}

interface GarageFormData {
  name: string;
  address: string;
  contact_info: string;
  phone: string;
  capacity: number;
  services_offered: string[];
  is_active: boolean;
}

export default function GarageManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<MaintenanceGarage | null>(null);
  const [garageToDelete, setGarageToDelete] = useState<MaintenanceGarage | null>(null);

  // Form state
  const [formData, setFormData] = useState<GarageFormData>({
    name: '',
    address: '',
    contact_info: '',
    phone: '',
    capacity: 0,
    services_offered: [],
    is_active: true
  });

  // Available services
  const availableServices = [
    'Engine Repair',
    'Brake Service',
    'Oil Change',
    'Tire Service',
    'Electrical Work',
    'Body Work',
    'Transmission Repair',
    'AC Service',
    'General Maintenance',
    'Emergency Repairs'
  ];

  // Fetch garages
  const { data: garagesData, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance-garages', searchTerm, statusFilter],
    queryFn: () => maintenanceGarageAPI.getAll(),
  });

  // Create garage mutation
  const createGarageMutation = useMutation({
    mutationFn: (data: GarageFormData) => maintenanceGarageAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-garages'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Garage created successfully!');
    },
    onError: (error: any) => {
      console.error('Create garage error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to create garage';
      toast.error(errorMessage);
    }
  });

  // Update garage mutation
  const updateGarageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GarageFormData> }) =>
      maintenanceGarageAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-garages'] });
      setIsEditDialogOpen(false);
      setSelectedGarage(null);
      resetForm();
      toast.success('Garage updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update garage error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to update garage';
      toast.error(errorMessage);
    }
  });

  // Delete garage mutation
  const deleteGarageMutation = useMutation({
    mutationFn: (id: string) => maintenanceGarageAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-garages'] });
      setGarageToDelete(null);
      toast.success('Garage deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete garage error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete garage';
      toast.error(errorMessage);
    }
  });

  const garages = garagesData?.data || [];

  // Filter garages
  const filteredGarages = garages.filter((garage: MaintenanceGarage) => {
    const matchesSearch = 
      garage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garage.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      garage.contact_info?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && garage.is_active) ||
      (statusFilter === 'inactive' && !garage.is_active);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalGarages = garages.length;
  const activeGarages = garages.filter((g: MaintenanceGarage) => g.is_active).length;
  const inactiveGarages = totalGarages - activeGarages;
  const totalCapacity = garages.reduce((sum: number, g: MaintenanceGarage) => sum + (g.capacity || 0), 0);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contact_info: '',
      phone: '',
      capacity: 0,
      services_offered: [],
      is_active: true
    });
  };

  const handleCreateGarage = () => {
    if (!formData.name || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    createGarageMutation.mutate(formData);
  };

  const handleEditGarage = (garage: MaintenanceGarage) => {
    setSelectedGarage(garage);
    setFormData({
      name: garage.name,
      address: garage.address,
      contact_info: garage.contact_info || '',
      phone: garage.phone || '',
      capacity: garage.capacity || 0,
      services_offered: garage.specializations || [],
      is_active: garage.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateGarage = () => {
    if (!selectedGarage) return;

    if (!formData.name || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateGarageMutation.mutate({
      id: selectedGarage.id,
      data: formData
    });
  };

  const handleViewGarage = (garage: MaintenanceGarage) => {
    setSelectedGarage(garage);
    setIsViewDialogOpen(true);
  };

  const handleDeleteGarage = (garage: MaintenanceGarage) => {
    setGarageToDelete(garage);
  };

  const confirmDelete = () => {
    if (garageToDelete) {
      deleteGarageMutation.mutate(garageToDelete.id);
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

  // Check if user can manage garages
  const canManageGarages = user?.is_superuser || user?.user_roles?.some((role: string) => 
    ['admin', 'System Admin', 'Company Admin'].includes(role)
  );

  if (!canManageGarages) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage garages.
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
            <Wrench className="w-8 h-8 text-orange-600" />
            Garage Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage maintenance garages and service centers
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
          Add Garage
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Garages"
          value={totalGarages}
          icon={Building2}
          description="All registered garages"
        />
        <StatsCard
          title="Active Garages"
          value={activeGarages}
          icon={Wrench}
          description="Currently operational"
        />
        <StatsCard
          title="Inactive Garages"
          value={inactiveGarages}
          icon={AlertCircle}
          description="Currently inactive"
        />
        <StatsCard
          title="Total Capacity"
          value={totalCapacity}
          icon={Users}
          description="Total service capacity"
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
                  placeholder="Search by name, address..."
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

      {/* Garages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Maintenance Garages ({filteredGarages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading garages...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Error loading garages</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredGarages.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No garages found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {garages.length === 0 
                  ? "Start by creating your first garage."
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
                Add Garage
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGarages.map((garage: MaintenanceGarage) => (
                <Card key={garage.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1">
                        {/* Garage Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Garage Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Name:</span> {garage.name}</p>
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {garage.address}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Status:</span>
                              {getStatusBadge(garage.is_active)}
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact & Capacity
                          </h4>
                          <div className="space-y-1 text-sm">
                            {garage.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {garage.phone}
                              </p>
                            )}
                            <p><span className="text-muted-foreground">Capacity:</span> {garage.capacity || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Attendants:</span> {garage.attendant_count || 0}</p>
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <h4 className="font-semibold mb-2">Services Offered</h4>
                          <div className="flex flex-wrap gap-1">
                            {garage.specializations && garage.specializations.length > 0 ? (
                              garage.specializations.slice(0, 3).map((service) => (
                                <Badge key={service} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No services listed</span>
                            )}
                            {garage.specializations && garage.specializations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{garage.specializations.length - 3} more
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
                          onClick={() => handleViewGarage(garage)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGarage(garage)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGarage(garage)}
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

      {/* Create Garage Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Garage</DialogTitle>
            <DialogDescription>
              Add a new maintenance garage to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Garage Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter garage name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Service capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter garage address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
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
              <Label htmlFor="is_active_create">Garage is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGarage}
              disabled={createGarageMutation.isPending}
            >
              {createGarageMutation.isPending ? 'Creating...' : 'Create Garage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Garage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Garage</DialogTitle>
            <DialogDescription>
              Update garage information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Garage Name *</Label>
                <Input
                  id="edit_name"
                  placeholder="Enter garage name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_capacity">Capacity</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  placeholder="Service capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">Address *</Label>
              <Textarea
                id="edit_address"
                placeholder="Enter garage address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
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
              <Label htmlFor="is_active_edit">Garage is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGarage}
              disabled={updateGarageMutation.isPending}
            >
              {updateGarageMutation.isPending ? 'Updating...' : 'Update Garage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Garage Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Garage Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedGarage?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedGarage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Garage Name</Label>
                  <p className="text-sm mt-1">{selectedGarage.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedGarage.is_active)}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm mt-1">{selectedGarage.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm mt-1">{selectedGarage.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Capacity</Label>
                  <p className="text-sm mt-1">{selectedGarage.capacity || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact Info</Label>
                  <p className="text-sm mt-1">{selectedGarage.contact_info || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created Date</Label>
                  <p className="text-sm mt-1">{new Date(selectedGarage.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedGarage.services_offered && selectedGarage.services_offered.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Services Offered</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedGarage.services_offered.map((service) => (
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
              if (selectedGarage) {
                handleEditGarage(selectedGarage);
              }
            }}>
              <Edit className="w-4 h-4 mr-1" />
              Edit Garage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!garageToDelete} onOpenChange={() => setGarageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Garage</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{garageToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGarageToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteGarageMutation.isPending}
            >
              {deleteGarageMutation.isPending ? 'Deleting...' : 'Delete Garage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}