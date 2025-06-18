'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-toastify";
import { 
  Fuel, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Check, 
  X, 
  ToggleLeft,
  ToggleRight,
  Building,
  Tags,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { fuelPriceAPI, fuelStationAPI } from '@/lib/api';

export default function AdminFuelPricingManagement() {
  const queryClient = useQueryClient();
  
  const [selectedStation, setSelectedStation] = useState('all');
  const [isCreatePriceOpen, setIsCreatePriceOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);

  // Form state for creating/editing fuel prices
  const [priceForm, setPriceForm] = useState({
    fuel_station: '',
    fuel_type: 'diesel',
    price_per_liter: '',
    effective_date: new Date().toISOString().slice(0, 16),
    is_active: true
  });

  // Bulk update form state
  const [bulkPrices, setBulkPrices] = useState([
    { fuel_type: 'petrol', price_per_liter: '', is_active: true },
    { fuel_type: 'diesel', price_per_liter: '', is_active: true },
    { fuel_type: 'super', price_per_liter: '', is_active: true },
    { fuel_type: 'electricity', price_per_liter: '', is_active: true }
  ]);

  // Fetch fuel stations
  const { data: stationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['fuel-stations'],
    queryFn: () => fuelStationAPI.getAll(),
  });
  // Fetch fuel prices
  const { data: pricesData, isLoading: pricesLoading } = useQuery({
    queryKey: ['fuel-prices', selectedStation],
    queryFn: () => fuelPriceAPI.getAll({
      station_id: selectedStation !== 'all' ? selectedStation : undefined
    })
  });

  // Fetch prices by station for overview
  const { data: pricesByStationData } = useQuery({
    queryKey: ['fuel-prices-by-station'],
    queryFn: () => fuelPriceAPI.getByStation()
  });

  // Create fuel price mutation
  const createPriceMutation = useMutation({
    mutationFn: (data) => fuelPriceAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-prices-by-station'] });
      setIsCreatePriceOpen(false);
      resetForm();
      toast.success('Fuel price created successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data || {}).flat().join(', ') ||
                          'Failed to create fuel price';
      toast.error(errorMessage);
    }
  });

  // Update fuel price mutation
  const updatePriceMutation = useMutation({
    mutationFn: ({ id, data }) => fuelPriceAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-prices-by-station'] });
      setEditingPrice(null);
      resetForm();
      toast.success('Fuel price updated successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data || {}).flat().join(', ') ||
                          'Failed to update fuel price';
      toast.error(errorMessage);
    }
  });

  // Set active price mutation
  const setActiveMutation = useMutation({
    mutationFn: (id) => fuelPriceAPI.setActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-prices-by-station'] });
      toast.success('Price activated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to activate price');
    }
  });

  // Deactivate price mutation
  const deactivateMutation = useMutation({
    mutationFn: (id) => fuelPriceAPI.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-prices-by-station'] });
      toast.success('Price deactivated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to deactivate price');
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ stationId, prices }) => fuelStationAPI.bulkUpdatePrices(stationId, prices),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-prices-by-station'] });
      setIsBulkUpdateOpen(false);
      resetBulkForm();
      toast.success(`${response.data.created_count} prices updated successfully!`);
      if (response.data.errors_count > 0) {
        toast.warning(`${response.data.errors_count} prices had errors`);
      }
    },
    onError: (error) => {
      toast.error('Failed to bulk update prices');
    }
  });

  // Delete price mutation
  const deletePriceMutation = useMutation({
    mutationFn: (id) => fuelPriceAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-prices-by-station'] });
      toast.success('Fuel price deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete fuel price');
    }
  });

  const stations = stationsData?.data || [];

  const prices = pricesData?.data || [];
  const pricesByStation = pricesByStationData?.data.data || [];

  const resetForm = () => {
    setPriceForm({
      fuel_station: '',
      fuel_type: 'petrol',
      price_per_liter: '',
      effective_date: new Date().toISOString().slice(0, 16),
      is_active: true
    });
  };

  const resetBulkForm = () => {
    setBulkPrices([
      { fuel_type: 'petrol', price_per_liter: '', is_active: true },
      { fuel_type: 'diesel', price_per_liter: '', is_active: true },
      { fuel_type: 'super', price_per_liter: '', is_active: true },
      { fuel_type: 'premium', price_per_liter: '', is_active: true }
    ]);
  };

  const handleCreatePrice = () => {
    if (!priceForm.fuel_station || !priceForm.fuel_type || !priceForm.price_per_liter) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      fuel_station: priceForm.fuel_station,
      fuel_type: priceForm.fuel_type,
      price_per_liter: parseFloat(priceForm.price_per_liter),
      effective_date: priceForm.effective_date,
      is_active: priceForm.is_active
    };

    createPriceMutation.mutate(submitData);
  };

  const handleUpdatePrice = () => {
    if (!editingPrice || !priceForm.price_per_liter) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      fuel_type: priceForm.fuel_type,
      price_per_liter: parseFloat(priceForm.price_per_liter),
      effective_date: priceForm.effective_date,
      is_active: priceForm.is_active
    };

    updatePriceMutation.mutate({ id: editingPrice.id, data: submitData });
  };

  const handleEditPrice = (price) => {
    setEditingPrice(price);
    setPriceForm({
      fuel_station: price.fuel_station,
      fuel_type: price.fuel_type,
      price_per_liter: price.price_per_liter.toString(),
      effective_date: new Date(price.effective_date).toISOString().slice(0, 16),
      is_active: price.is_active
    });
    setIsCreatePriceOpen(true);
  };

  const handleBulkUpdate = () => {
    if (!selectedStation) {
      toast.error('Please select a station first');
      return;
    }

    const validPrices = bulkPrices.filter(price => 
      price.price_per_liter && parseFloat(price.price_per_liter) > 0
    ).map(price => ({
      ...price,
      price_per_liter: parseFloat(price.price_per_liter),
      effective_date: new Date().toISOString()
    }));

    if (validPrices.length === 0) {
      toast.error('Please enter at least one valid price');
      return;
    }

    bulkUpdateMutation.mutate({
      stationId: selectedStation,
      prices: validPrices
    });
  };

  const updateBulkPrice = (index, field, value) => {
    setBulkPrices(prev => prev.map((price, i) => 
      i === index ? { ...price, [field]: value } : price
    ));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  const getFuelTypeIcon = (fuelType) => {
    const icons = {
      petrol: '⛽',
      diesel: '🚛',
      super: '🏎️',
      premium: '💎'
    };
    return icons[fuelType] || '⛽';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            Fuel Pricing Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage fuel prices across all stations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsBulkUpdateOpen(true)} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Bulk Update
          </Button>
          <Button onClick={() => setIsCreatePriceOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Price
          </Button>
        </div>
      </div>

      {/* Station Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Filter by Station
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="station-filter">Select Station</Label>
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger>
                  <SelectValue placeholder="All stations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} - {station.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedStation('all')}
            >
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Station Overview Cards */}
      {selectedStation === 'all' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pricesByStation.map((station) => (
            <Card key={station.station_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {station.station_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{station.station_location}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Available Fuel Types:</span>
                    <span className="text-sm">{station.fuel_types_available.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {station.current_prices.map((price) => (
                      <div key={price.id} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <span>{getFuelTypeIcon(price.fuel_type)}</span>
                          <span className="font-medium capitalize">{price.fuel_type}</span>
                        </div>
                        <div className="text-green-600 font-semibold">
                          {formatCurrency(price.price_per_liter)}/L
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => setSelectedStation(station.station_id)}
                  >
                    Manage Prices
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fuel Prices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Prices
            {selectedStation && (
              <Badge variant="outline">
                {stations.find(s => s.id === selectedStation)?.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pricesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading prices...
            </div>
          ) : prices.length === 0 ? (
            <div className="text-center py-8 px-6">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No fuel prices found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by creating fuel prices for your stations.
              </p>
              <Button onClick={() => setIsCreatePriceOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Price
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Price per Liter</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{price.fuel_station_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getFuelTypeIcon(price.fuel_type)}</span>
                          <Badge variant="outline" className="capitalize">
                            {price.fuel_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(price.price_per_liter)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(price.effective_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(price.effective_date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {price.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              <X className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{price.created_by_name || 'System'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPrice(price)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {price.is_active ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deactivateMutation.mutate(price.id)}
                              className="h-8 w-8 p-0"
                              disabled={deactivateMutation.isPending}
                            >
                              <ToggleRight className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setActiveMutation.mutate(price.id)}
                              className="h-8 w-8 p-0"
                              disabled={setActiveMutation.isPending}
                            >
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this price?')) {
                                deletePriceMutation.mutate(price.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            disabled={deletePriceMutation.isPending}
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

      {/* Create/Edit Price Dialog */}
      <Dialog open={isCreatePriceOpen} onOpenChange={setIsCreatePriceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPrice ? 'Edit Fuel Price' : 'Create Fuel Price'}
            </DialogTitle>
            <DialogDescription>
              {editingPrice 
                ? 'Update the fuel price details.' 
                : 'Add a new fuel price for a station.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingPrice && (
              <div className="space-y-2">
                <Label htmlFor="fuel_station">Fuel Station *</Label>
                <Select 
                  value={priceForm.fuel_station} 
                  onValueChange={(value) => setPriceForm(prev => ({...prev, fuel_station: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name} - {station.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fuel_type">Fuel Type *</Label>
              <Select 
                value={priceForm.fuel_type} 
                onValueChange={(value) => setPriceForm(prev => ({...prev, fuel_type: value}))}
                disabled={!!editingPrice}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">
                    <div className="flex items-center gap-2">
                      <span>⛽</span>
                      <span>Petrol</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="diesel">
                    <div className="flex items-center gap-2">
                      <span>🚛</span>
                      <span>Diesel</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="super">
                    <div className="flex items-center gap-2">
                      <span>🏎️</span>
                      <span>Super</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <span>💎</span>
                      <span>Premium</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_liter">Price per Liter (RWF) *</Label>
              <Input
                id="price_per_liter"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={priceForm.price_per_liter}
                onChange={(e) => setPriceForm(prev => ({...prev, price_per_liter: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date & Time *</Label>
              <Input
                id="effective_date"
                type="datetime-local"
                value={priceForm.effective_date}
                onChange={(e) => setPriceForm(prev => ({...prev, effective_date: e.target.value}))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={priceForm.is_active}
                onChange={(e) => setPriceForm(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active">Set as active price</Label>
            </div>

            {priceForm.is_active && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Setting this as active will deactivate any existing active price for this fuel type at this station.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreatePriceOpen(false);
                setEditingPrice(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingPrice ? handleUpdatePrice : handleCreatePrice}
              disabled={
                (editingPrice ? updatePriceMutation.isPending : createPriceMutation.isPending) || 
                !priceForm.price_per_liter ||
                (!editingPrice && !priceForm.fuel_station)
              }
            >
              {editingPrice 
                ? (updatePriceMutation.isPending ? 'Updating...' : 'Update Price')
                : (createPriceMutation.isPending ? 'Creating...' : 'Create Price')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Update Fuel Prices</DialogTitle>
            <DialogDescription>
              Update multiple fuel prices for a station at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk_station">Select Station *</Label>
              <Select 
                value={selectedStation} 
                onValueChange={setSelectedStation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} - {station.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Fuel Prices</Label>
              {bulkPrices.map((price, index) => (
                <div key={price.fuel_type} className="grid grid-cols-3 gap-2 items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{getFuelTypeIcon(price.fuel_type)}</span>
                    <span className="font-medium capitalize">{price.fuel_type}</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price/L"
                    value={price.price_per_liter}
                    onChange={(e) => updateBulkPrice(index, 'price_per_liter', e.target.value)}
                  />
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={price.is_active}
                      onChange={(e) => updateBulkPrice(index, 'is_active', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only prices with values entered will be created/updated. Active prices will replace existing active prices for the same fuel type.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkUpdateOpen(false);
                resetBulkForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              disabled={bulkUpdateMutation.isPending || !selectedStation}
            >
              {bulkUpdateMutation.isPending ? 'Updating...' : 'Update Prices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}