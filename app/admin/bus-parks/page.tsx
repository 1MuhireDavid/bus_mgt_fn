"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Car,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Activity,
  ParkingCircle,
  Settings
} from 'lucide-react';
import { busAPI, busParkAPI } from '@/lib/api';
import { StatsCard } from '@/components/ui/StatsCard';
import { toast } from "react-toastify";



// Bus Park Details Component
const BusParkDetailsCard = ({ busPark, onClose, onEdit }) => {
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['bus-park-buses', busPark?.id],
    queryFn: () => busParkAPI.getBusesAtPark(busPark.id),
    enabled: !!busPark
  });

  const { data: allBusesData } = useQuery({
    queryKey: ['all-buses'],
    queryFn: () => busAPI.getAll()
  });

  const allBuses = allBusesData?.data?.data || allBusesData?.data || [];
  
  // Get buses currently at this park
  const busesAtPark = allBuses.filter(bus => 
    bus.current_location && bus.current_location.toString() === busPark.id.toString()
  );

  const totalCapacity = 50; // You might want to add this to your BusPark model
  const occupancyRate = totalCapacity > 0 ? (busesAtPark.length / totalCapacity) * 100 : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              {busPark.name}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {busPark.location}
              </div>
              <Badge variant={busPark.is_active ? "default" : "secondary"}>
                {busPark.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onEdit(busPark)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Park Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Buses Parked</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{busesAtPark.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ParkingCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Capacity</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{totalCapacity}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Occupancy</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{occupancyRate.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Available</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{totalCapacity - busesAtPark.length}</p>
            </div>
          </div>

          {/* Parked Buses List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              Parked Buses ({busesAtPark.length})
            </h3>
            
            {busesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading buses...
              </div>
            ) : busesAtPark.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No buses currently parked</p>
                <p className="text-sm text-muted-foreground">
                  This bus park is currently empty.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Parked Since</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {busesAtPark.map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">{bus.plate_number}</TableCell>
                        <TableCell>{bus.model}</TableCell>
                        <TableCell>{bus.year}</TableCell>
                        <TableCell>{bus.capacity} seats</TableCell>
                        <TableCell>
                          <Badge variant={
                            bus.status === 'active' ? 'default' : 
                            bus.status === 'under_maintenance' ? 'destructive' : 'secondary'
                          }>
                            {bus.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bus.updated_at ? new Date(bus.updated_at).toLocaleDateString() : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Park Information */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Park Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(busPark.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <p className="text-sm">{busPark.created_by_name || 'System'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm">{busPark.company_name || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Create/Edit Bus Park Dialog
const BusParkFormDialog = ({ isOpen, onClose, busPark, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    is_active: true
  });

  React.useEffect(() => {
    if (busPark) {
      setFormData({
        name: busPark.name || '',
        location: busPark.location || '',
        is_active: busPark.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        location: '',
        is_active: true
      });
    }
  }, [busPark]);

  const handleSave = () => {
    if (!formData.name || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {busPark ? 'Edit Bus Park' : 'Create New Bus Park'}
          </DialogTitle>
          <DialogDescription>
            {busPark ? 'Update bus park information' : 'Add a new bus park to the system'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bus Park Name *</Label>
            <Input
              id="name"
              placeholder="Enter bus park name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Textarea
              id="location"
              placeholder="Enter full address or location description"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Bus park is active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {busPark ? 'Update' : 'Create'} Bus Park
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Bus Parks Admin Component
export default function BusParksAdminPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPark, setSelectedPark] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [parkToEdit, setParkToEdit] = useState(null);
  const [parkToDelete, setParkToDelete] = useState(null);

  // Fetch bus parks
  const { data: busParksData, isLoading, error, refetch } = useQuery({
    queryKey: ['bus-parks'],
    queryFn: () => busParkAPI.getAll(),
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['bus-parks-stats'],
    queryFn: () => busParkAPI.getStats(),
  });

  // Create bus park mutation
  const createParkMutation = useMutation({
    mutationFn: (data) => busParkAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-parks'] });
      setIsCreateDialogOpen(false);
      toast.success('Bus park created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create bus park');
    }
  });

  // Update bus park mutation
  const updateParkMutation = useMutation({
    mutationFn: ({ id, data }) => busParkAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-parks'] });
      setIsEditDialogOpen(false);
      setParkToEdit(null);
      toast.success('Bus park updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update bus park');
    }
  });

  // Delete bus park mutation
  const deleteParkMutation = useMutation({
    mutationFn: (id) => busParkAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-parks'] });
      setParkToDelete(null);
      toast.success('Bus park deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete bus park');
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id) => busParkAPI.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-parks'] });
      toast.success('Bus park status updated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  const busParks = busParksData?.data?.data || [];
  const stats = statsData?.data || { total: 0, active: 0, inactive: 0 };

  // Filter bus parks
  const filteredParks = busParks.filter((park) => {
    const matchesSearch = 
      park.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      park.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && park.is_active) ||
      (statusFilter === 'inactive' && !park.is_active);

    return matchesSearch && matchesStatus;
  });


  const handleCreatePark = (formData) => {
    createParkMutation.mutate(formData);
  };

  const handleEditPark = (park) => {
    setParkToEdit(park);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePark = (formData) => {
    if (parkToEdit) {
      updateParkMutation.mutate({
        id: parkToEdit.id,
        data: formData
      });
    }
  };

  const handleDeletePark = (park) => {
    setParkToDelete(park);
  };

  const confirmDelete = () => {
    if (parkToDelete) {
      deleteParkMutation.mutate(parkToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span className="text-lg">Loading bus parks...</span>
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
            <Building2 className="w-8 h-8 text-blue-600" />
            Bus Parks Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage bus parking locations and monitor fleet distribution
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bus Park
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Parks"
          value={stats.total}
          icon={Building2}
          description="All bus parks"
        />
        <StatsCard
          title="Active Parks"
          value={stats.active}
          icon={ParkingCircle}
          description="Currently operational"
        />
        <StatsCard
          title="Inactive Parks"
          value={stats.inactive}
          icon={AlertCircle}
          description="Currently inactive"
        />
        <StatsCard
          title="Total Capacity"
          value={stats.total * 50} // Assuming 50 buses per park
          icon={Car}
          description="Total parking spaces"
        />
      </div>

      {/* Selected Park Details */}
      {selectedPark && (
        <BusParkDetailsCard
          busPark={selectedPark}
          onClose={() => setSelectedPark(null)}
          onEdit={handleEditPark}
        />
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Parks</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or location..."
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
                  Clear
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bus Parks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Bus Parks ({filteredParks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Error loading bus parks</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredParks.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No bus parks found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {busParks.length === 0 
                  ? "Start by creating your first bus park."
                  : "Try adjusting your search or filters."
                }
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Bus Park
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Park Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParks.map((park) => (
                    <TableRow key={park.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {park.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-xs" title={park.location}>
                            {park.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={park.is_active ? "default" : "secondary"}>
                          {park.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(park.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {park.created_by_name || 'System'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {park.company_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPark(park)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPark(park)}
                            title="Edit Park"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate(park.id)}
                            disabled={toggleStatusMutation.isPending}
                            title="Toggle Status"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePark(park)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Park"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create Bus Park Dialog */}
      <BusParkFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreatePark}
      />

      {/* Edit Bus Park Dialog */}
      <BusParkFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setParkToEdit(null);
        }}
        busPark={parkToEdit}
        onSave={handleUpdatePark}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!parkToDelete} onOpenChange={() => setParkToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bus Park</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{parkToDelete?.name}"? This action cannot be undone.
              Any buses currently parked here will need to be relocated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParkToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteParkMutation.isPending}
            >
              {deleteParkMutation.isPending ? 'Deleting...' : 'Delete Bus Park'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}