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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Tag,
  DollarSign,
  Link,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { maintenanceItemsAPI, maintenanceTypesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function MaintenanceItemsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isAssociateTypesDialogOpen, setIsAssociateTypesDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const { user } = useAuthStore();

  // Form state for creating/editing items
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    unit_price: '',
    unit: 'piece',
    is_consumable: true,
    minimum_quantity: '',
    maintenance_types: []
  });

  // State for type association
  const [selectedMaintenanceTypes, setSelectedMaintenanceTypes] = useState([]);

  // Fetch maintenance items
  const { data: itemsData, isLoading: itemsLoading, isError: itemsError } = useQuery({
    queryKey: ['maintenance-items'],
    queryFn: () => maintenanceItemsAPI.getAll(),
  });

  // Fetch maintenance types
  const { data: typesData } = useQuery({
    queryKey: ['maintenance-types'],
    queryFn: () => maintenanceTypesAPI.getAll(),
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: (data) => maintenanceItemsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-items'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
      setIsCreateItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error) => {
      console.error('Failed to create maintenance item:', error);
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => maintenanceItemsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-items'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
      setIsEditItemDialogOpen(false);
      resetItemForm();
    },
    onError: (error) => {
      console.error('Failed to update maintenance item:', error);
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id) => maintenanceItemsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-items'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
    },
    onError: (error) => {
      console.error('Failed to delete maintenance item:', error);
    }
  });

  // Associate types mutation
  const associateTypesMutation = useMutation({
    mutationFn: ({ itemId, typeIds }) => maintenanceTypesAPI.addItemsToTypes(itemId, typeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-items'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
      setIsAssociateTypesDialogOpen(false);
      setSelectedMaintenanceTypes([]);
    },
    onError: (error) => {
      console.error('Failed to associate types:', error);
    }
  });

  const items = itemsData?.data?.results || itemsData?.data || [];
  const maintenanceTypes = typesData?.data?.results || typesData?.data || [];

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || 
      item.maintenance_types_names?.includes(typeFilter);

    return matchesSearch && matchesType;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'unit_price':
        aValue = parseFloat(a.unit_price || 0);
        bValue = parseFloat(b.unit_price || 0);
        break;
      case 'unit':
        aValue = a.unit;
        bValue = b.unit;
        break;
      case 'stock':
        aValue = a.current_stock_quantity || 0;
        bValue = b.current_stock_quantity || 0;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      unit_price: '',
      unit: 'piece',
      is_consumable: true,
      minimum_quantity: '',
      maintenance_types: []
    });
    setSelectedItem(null);
  };

  const handleCreateItem = () => {
    const submitData = {
      ...itemForm,
      unit_price: parseFloat(itemForm.unit_price) || 0,
      minimum_quantity: parseInt(itemForm.minimum_quantity) || 0,
      company: user?.company
    };
    createItemMutation.mutate(submitData);
  };

  const handleUpdateItem = () => {
    const submitData = {
      ...itemForm,
      unit_price: parseFloat(itemForm.unit_price) || 0,
      minimum_quantity: parseInt(itemForm.minimum_quantity) || 0,
    };
    updateItemMutation.mutate({
      id: selectedItem.id,
      data: submitData
    });
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      unit_price: item.unit_price.toString(),
      unit: item.unit,
      is_consumable: item.is_consumable,
      minimum_quantity: item.minimum_quantity?.toString() || '',
      maintenance_types: item.maintenance_types || []
    });
    setIsEditItemDialogOpen(true);
  };

  const handleDeleteItem = (item) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const handleAssociateTypes = (item) => {
    setSelectedItem(item);
    setSelectedMaintenanceTypes(item.maintenance_types || []);
    setIsAssociateTypesDialogOpen(true);
  };

  const handleTypeAssociation = () => {
    associateTypesMutation.mutate({
      itemId: selectedItem.id,
      typeIds: selectedMaintenanceTypes
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const unitOptions = [
    'piece', 'liter', 'kg', 'meter', 'pack', 'bottle', 'gallon', 'box', 'roll', 'tube'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            Maintenance Items Management
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage maintenance items and parts</p>
        </div>
        <Dialog open={isCreateItemDialogOpen} onOpenChange={setIsCreateItemDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Item</DialogTitle>
              <DialogDescription>
                Add a new item or part that can be used in maintenance work.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Engine Oil, Brake Pads, Air Filter"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the item..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm(prev => ({...prev, description: e.target.value}))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price (RWF) *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    placeholder="0.00"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm(prev => ({...prev, unit_price: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select 
                    value={itemForm.unit} 
                    onValueChange={(value) => setItemForm(prev => ({...prev, unit: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Minimum Stock Quantity</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  placeholder="0"
                  value={itemForm.minimum_quantity}
                  onChange={(e) => setItemForm(prev => ({...prev, minimum_quantity: e.target.value}))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_consumable"
                  checked={itemForm.is_consumable}
                  onCheckedChange={(checked) => setItemForm(prev => ({...prev, is_consumable: checked}))}
                />
                <Label htmlFor="is_consumable" className="text-sm">
                  This is a consumable item (gets used up during maintenance)
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Associated Maintenance Types</Label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {maintenanceTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.id}`}
                        checked={itemForm.maintenance_types.includes(type.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setItemForm(prev => ({
                              ...prev,
                              maintenance_types: [...prev.maintenance_types, type.id]
                            }));
                          } else {
                            setItemForm(prev => ({
                              ...prev,
                              maintenance_types: prev.maintenance_types.filter(id => id !== type.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`type-${type.id}`} className="text-sm">
                        {type.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateItem} 
                disabled={createItemMutation.isPending || !itemForm.name || !itemForm.unit_price}
              >
                {createItemMutation.isPending ? 'Creating...' : 'Create Item'}
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
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumable Items</p>
                <p className="text-2xl font-bold">{items.filter(item => item.is_consumable).length}</p>
              </div>
              <Tag className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">
                  {items.filter(item => 
                    item.current_stock_quantity !== null && 
                    item.current_stock_quantity <= (item.minimum_quantity || 0)
                  ).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Price</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    items.length > 0 
                      ? items.reduce((sum, item) => sum + parseFloat(item.unit_price || 0), 0) / items.length
                      : 0
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
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
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
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
      {itemsLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading maintenance items...</p>
          </CardContent>
        </Card>
      )}

      {itemsError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Failed to fetch maintenance items. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!itemsLoading && sortedItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No maintenance items found</h3>
            <p className="text-muted-foreground mb-4">
              {items.length === 0 
                ? "Get started by creating your first maintenance item."
                : "Try adjusting your filters to see more items."
              }
            </p>
            <Button onClick={() => setIsCreateItemDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Maintenance Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {!itemsLoading && sortedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Maintenance Items ({sortedItems.length})</span>
              <div className="text-sm text-muted-foreground">
                Showing {sortedItems.length} of {items.length} items
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Item Name
                        <SortIcon column="name" />
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('unit_price')}
                    >
                      <div className="flex items-center gap-2">
                        Price
                        <SortIcon column="unit_price" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('unit')}
                    >
                      <div className="flex items-center gap-2">
                        Unit
                        <SortIcon column="unit" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('stock')}
                    >
                      <div className="flex items-center gap-2">
                        Stock
                        <SortIcon column="stock" />
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Maintenance Types</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          {item.is_consumable && (
                            <Badge variant="outline" className="w-fit mt-1">
                              <Tag className="w-3 h-3 mr-1" />
                              Consumable
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={item.description}>
                          {item.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.unit_price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.unit}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.current_stock_quantity !== null ? (
                          <div className="flex flex-col">
                            <span className={
                              item.current_stock_quantity <= (item.minimum_quantity || 0)
                                ? 'text-orange-600 font-semibold'
                                : 'text-green-600'
                            }>
                              {item.current_stock_quantity}
                            </span>
                            {item.minimum_quantity > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Min: {item.minimum_quantity}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.is_consumable ? (
                          <Badge variant="outline">Consumable</Badge>
                        ) : (
                          <Badge variant="secondary">Reusable</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.maintenance_types_names?.slice(0, 2).map((typeName) => (
                            <Badge key={typeName} variant="outline" className="text-xs">
                              {typeName}
                            </Badge>
                          ))}
                          {item.maintenance_types_names?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.maintenance_types_names.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAssociateTypes(item)}
                            title="Manage Types"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Item</DialogTitle>
            <DialogDescription>
              Update the details for this maintenance item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                value={itemForm.name}
                onChange={(e) => setItemForm(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={itemForm.description}
                onChange={(e) => setItemForm(prev => ({...prev, description: e.target.value}))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit-price">Unit Price (RWF) *</Label>
                <Input
                  id="edit-unit-price"
                  type="number"
                  value={itemForm.unit_price}
                  onChange={(e) => setItemForm(prev => ({...prev, unit_price: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit *</Label>
                <Select 
                  value={itemForm.unit} 
                  onValueChange={(value) => setItemForm(prev => ({...prev, unit: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-minimum-quantity">Minimum Stock Quantity</Label>
              <Input
                id="edit-minimum-quantity"
                type="number"
                value={itemForm.minimum_quantity}
                onChange={(e) => setItemForm(prev => ({...prev, minimum_quantity: e.target.value}))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-consumable"
                checked={itemForm.is_consumable}
                onCheckedChange={(checked) => setItemForm(prev => ({...prev, is_consumable: checked}))}
              />
              <Label htmlFor="edit-is-consumable" className="text-sm">
                This is a consumable item
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateItem} 
              disabled={updateItemMutation.isPending || !itemForm.name || !itemForm.unit_price}
            >
              {updateItemMutation.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Associate Types Dialog */}
      <Dialog open={isAssociateTypesDialogOpen} onOpenChange={setIsAssociateTypesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Maintenance Types</DialogTitle>
            <DialogDescription>
              Select which maintenance types can use "{selectedItem?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {maintenanceTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`associate-type-${type.id}`}
                    checked={selectedMaintenanceTypes.includes(type.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMaintenanceTypes(prev => [...prev, type.id]);
                      } else {
                        setSelectedMaintenanceTypes(prev => prev.filter(id => id !== type.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`associate-type-${type.id}`} className="font-medium">
                      {type.name}
                    </Label>
                    {type.description && (
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {maintenanceTypes.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No maintenance types available. Create some maintenance types first.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssociateTypesDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTypeAssociation} 
              disabled={associateTypesMutation.isPending}
            >
              {associateTypesMutation.isPending ? 'Updating...' : 'Update Associations'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}