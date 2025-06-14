"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Bus,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Package,
} from "lucide-react";
import {
  maintenanceAPI,
  assignmentAPI,
  maintenanceTypesAPI,
  busAPI,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Checkbox } from "@/components/ui/checkbox";

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const { user } = useAuthStore();
  const [selectedMaintenanceItems, setSelectedMaintenanceItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);

  // Form state for creating new maintenance record
  const [newRecord, setNewRecord] = useState({
    bus_assignment_id: "",
    maintenance_type_id: "",
    description: "",
    cost: "",
    attendant: "",
    company: "",
  });

  // Fetch maintenance records
  const {
    data: maintenanceData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["maintenance-records"],
    queryFn: () => maintenanceAPI.getAll(),
  });

  // Fetch maintenance types
  const { data: typesData } = useQuery({
    queryKey: ["maintenance-types"],
    queryFn: () => maintenanceTypesAPI.getAll(),
  });

  // Fetch bus assignments for the dropdown
  const { data: assignmentsData } = useQuery({
    queryKey: ["bus-assignments"],
    queryFn: () => assignmentAPI.getAll(),
  });
  // Fetch maintenance items for selected type
  const { data: maintenanceItemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ["maintenance-items-by-type", newRecord.maintenance_type_id],
    queryFn: () => maintenanceTypesAPI.getAll(),
    enabled: !!newRecord.maintenance_type_id,
  });
  // Fetch maintenance statistics
  const { data: statsData } = useQuery({
    queryKey: ["maintenance-statistics"],
    queryFn: () => maintenanceAPI.getStatistics(),
  });
  const { data: assignedBusesData } = useQuery({
    queryKey: ["assigned-buses"],
    queryFn: () => busAPI.getAll(),
  });

  const assignedBuses = assignedBusesData?.data || [];

  // Create maintenance record mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: (data) => maintenanceAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-statistics"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Failed to create maintenance record:", error);
    },
  });
  const startMaintenanceMutation = useMutation({
    mutationFn: (data) => maintenanceAPI.startMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      setIsStartDialogOpen(false);
      setSelectedBus(null);
    },
    onError: (error) => {
      console.error("Failed to start maintenance:", error);
    },
  });
  const completeMaintenanceMutation = useMutation({
    mutationFn: (id) => maintenanceAPI.completeMaintenance(id),
    onSuccess: () => {
      toast.success("Maintenance marked completed");
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      setIsCompleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to complete");
    },
  });

  const records = maintenanceData?.data?.results || maintenanceData?.data || [];
  const maintenanceTypes = useMemo(
    () => typesData?.data || [],
    [typesData?.data]
  );
  useEffect(() => {
    const selectedType = maintenanceTypes.find(
      (type) => type.id === parseInt(newRecord.maintenance_type_id)
    );
    if (selectedType?.maintenance_items) {
      setAvailableItems(selectedType.maintenance_items);
      setSelectedMaintenanceItems([]);
    } else {
      setAvailableItems([]);
      setSelectedMaintenanceItems([]);
    }
  }, [newRecord.maintenance_type_id, maintenanceTypes]);
  const assignments =
    assignmentsData?.data?.results || assignmentsData?.data || [];
  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "assigned"
  );
  const stats = statsData?.data || {};

  // Filter records based on search and filters
  const filteredRecords = records.filter((record) => {
    const busPlateNumber = record.bus_plate_number || "";
    const maintenanceTypeName = record.maintenance_type_name || "";

    const matchesSearch =
      maintenanceTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      busPlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || record.maintenance_type_id?.name === typeFilter;

    let matchesDate = true;
    if (dateRange !== "all") {
      const recordDate = new Date(record.timestamp);
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(
        now.getTime() - daysAgo * 24 * 60 * 60 * 1000
      );
      matchesDate = recordDate >= cutoffDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "timestamp":
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
        break;
      case "cost":
        aValue = parseFloat(a.cost || 0);
        bValue = parseFloat(b.cost || 0);
        break;
      case "maintenance_type":
        aValue = a.maintenance_type_name || "";
        bValue = b.maintenance_type_name || "";
        break;
      case "bus_plate":
        aValue = a.bus_plate_number || "";
        bValue = b.bus_plate_number || "";
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calculate statistics from filtered records
  const totalCost = filteredRecords.reduce(
    (sum, record) => sum + parseFloat(record.cost || 0),
    0
  );
  const avgCost =
    filteredRecords.length > 0 ? totalCost / filteredRecords.length : 0;

  const resetForm = () => {
    setNewRecord({
      bus_assignment_id: "",
      maintenance_type_id: "",
      description: "",
      cost: "",
      attendant: "",
      company: "",
    });
    setSelectedMaintenanceItems([]);
    setAvailableItems([]);
  };

  const handleMaintenanceTypeChange = (value) => {
    setNewRecord((prev) => ({ ...prev, maintenance_type_id: value }));
    // Calculate estimated cost based on selected type
    const selectedType = maintenanceTypes.find(
      (type) => type.id === parseInt(value)
    );
    if (
      selectedType &&
      selectedType.default_cost &&
      parseFloat(selectedType.default_cost) > 0
    ) {
      setNewRecord((prev) => ({
        ...prev,
        cost: selectedType.default_cost.toString(),
      }));
    }
  };

  const handleItemToggle = (item, checked) => {
    if (checked) {
      setSelectedMaintenanceItems((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          unit_price: item.unit_price,
          unit: item.unit,
          quantity_used: 1,
          source: "company_stock",
        },
      ]);
    } else {
      setSelectedMaintenanceItems((prev) =>
        prev.filter((selected) => selected.id !== item.id)
      );
    }
  };
  const updateItemQuantity = (itemId, quantity) => {
    const numQuantity = Math.max(1, parseInt(quantity) || 1);
    setSelectedMaintenanceItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity_used: numQuantity } : item
      )
    );
  };

  const updateItemSource = (itemId, source) => {
    setSelectedMaintenanceItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, source } : item))
    );
  };

  const updateItemUnitCost = (itemId, unitCost) => {
    const numCost = Math.max(0, parseFloat(unitCost) || 0);
    setSelectedMaintenanceItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, unit_price: numCost } : item
      )
    );
  };

  const calculateTotalItemsCost = () => {
    return selectedMaintenanceItems.reduce(
      (total, item) => total + item.unit_price * item.quantity_used,
      0
    );
  };

  const calculateGrandTotal = () => {
    const baseCost = parseFloat(newRecord.cost) || 0;
    const itemsCost = calculateTotalItemsCost();
    return baseCost + itemsCost;
  };
  const handleCreateRecord = () => {
    const totalItemsCost = calculateTotalItemsCost();
    const baseCost = parseFloat(newRecord.cost) || 0;
    const totalCost = baseCost + totalItemsCost;
    const submitData = {
      cost: totalCost,
      bus_assignment_id: newRecord.bus_assignment_id,
      maintenance_type_id: newRecord.maintenance_type_id,
      attendant: user?.id,
      description: newRecord.description,
      company: user?.company,
      maintenance_items: selectedMaintenanceItems.map((item) => ({
        maintenance_item_id: item.id,
        quantity_used: item.quantity_used,
        unit_cost: item.unit_price,
        source: item.source,
      })),
    };
    createMaintenanceMutation.mutate(submitData);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-FR", {
      style: "currency",
      currency: "RWF",
    }).format(amount || 0);
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
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
          <p className="text-muted-foreground mt-1">
            Track and manage bus maintenance records
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Maintenance Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Maintenance Record</DialogTitle>
              <DialogDescription>
                Record a new maintenance activity for your fleet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bus_assignment">Bus Assignment</Label>
                  <Select
                    value={newRecord.bus_assignment_id}
                    onValueChange={(value) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        bus_assignment_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bus assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAssignments.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {assignment.plate_number}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Driver: {assignment.driver_name} -{" "}
                              {assignment.driver_phone_number}
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
                    onValueChange={handleMaintenanceTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select maintenance type" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.name}</span>
                            {type.description && (
                              <span className="text-xs text-muted-foreground">
                                {type.description}
                              </span>
                            )}
                            {type.default_cost &&
                              parseFloat(type.default_cost) > 0 && (
                                <span className="text-xs text-green-600">
                                  Base cost:{" "}
                                  {formatCurrency(
                                    parseFloat(type.default_cost)
                                  )}
                                </span>
                              )}
                            {type.items_count > 0 && (
                              <span className="text-xs text-blue-600">
                                {type.items_count} associated items
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Base Labor Cost (RWF)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={newRecord.cost}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        cost: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Total Cost Preview
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Labor Cost:</span>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(newRecord.cost) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          Items Cost ({selectedMaintenanceItems.length} items):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(calculateTotalItemsCost())}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2 text-green-600">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(calculateGrandTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the maintenance work performed..."
                  value={newRecord.description}
                  onChange={(e) =>
                    setNewRecord((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  required
                />
              </div>

              {/* Maintenance Items Selection */}
              {newRecord.maintenance_type_id && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-semibold">
                      Maintenance Items
                    </Label>
                    {isLoadingItems && (
                      <span className="text-sm text-muted-foreground">
                        Loading items...
                      </span>
                    )}
                    {maintenanceItemsData && !isLoadingItems && (
                      <span className="text-sm text-blue-600">
                        Found {availableItems.length} items for "
                        {maintenanceItemsData.name}"
                      </span>
                    )}
                  </div>

                  {isLoadingItems ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Loading maintenance items...
                      </p>
                    </div>
                  ) : availableItems.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Select items that will be used for this maintenance:
                      </p>

                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        {availableItems.map((item) => {
                          const isSelected = selectedMaintenanceItems.some(
                            (selected) => selected.id === item.id
                          );
                          const selectedItem = selectedMaintenanceItems.find(
                            (selected) => selected.id === item.id
                          );

                          return (
                            <div
                              key={item.id}
                              className="space-y-3 p-3 border-b last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`item-${item.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleItemToggle(item, checked)
                                  }
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <Label
                                        htmlFor={`item-${item.id}`}
                                        className="font-medium cursor-pointer"
                                      >
                                        {item.name}
                                      </Label>
                                      {item.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold">
                                        {formatCurrency(item.unit_price)} per{" "}
                                        {item.unit}
                                      </div>
                                      {item.current_stock_quantity !== null &&
                                        item.current_stock_quantity !==
                                          undefined && (
                                          <div
                                            className={`text-xs ${
                                              item.current_stock_quantity <=
                                              (item.minimum_quantity || 0)
                                                ? "text-red-600"
                                                : "text-muted-foreground"
                                            }`}
                                          >
                                            Stock: {item.current_stock_quantity}{" "}
                                            {item.unit}
                                            {item.current_stock_quantity <=
                                              (item.minimum_quantity || 0) && (
                                              <span className="ml-1 text-red-600">
                                                ⚠️ Low stock
                                              </span>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                      <div>
                                        <Label className="text-xs">
                                          Quantity
                                        </Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={
                                            selectedItem?.quantity_used || 1
                                          }
                                          onChange={(e) =>
                                            updateItemQuantity(
                                              item.id,
                                              e.target.value
                                            )
                                          }
                                          className="h-8"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">
                                          Unit Cost (RWF)
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={
                                            selectedItem?.unit_price ||
                                            parseFloat(item.unit_price)
                                          }
                                          onChange={(e) =>
                                            updateItemUnitCost(
                                              item.id,
                                              e.target.value
                                            )
                                          }
                                          className="h-8"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">
                                          Source
                                        </Label>
                                        <Select
                                          value={
                                            selectedItem?.source ||
                                            "company_stock"
                                          }
                                          onValueChange={(value) =>
                                            updateItemSource(item.id, value)
                                          }
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="company_stock">
                                              Company Stock
                                            </SelectItem>
                                            <SelectItem value="external_purchase">
                                              External Purchase
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  )}

                                  {isSelected && selectedItem && (
                                    <div className="mt-2 text-xs text-right text-green-600 font-medium">
                                      Subtotal:{" "}
                                      {formatCurrency(
                                        selectedItem.unit_price *
                                          selectedItem.quantity_used
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedMaintenanceItems.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <Label className="text-sm font-medium mb-2 block">
                            Selected Items Summary:
                          </Label>
                          <div className="space-y-2">
                            {selectedMaintenanceItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="flex-1">
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    x{item.quantity_used} @{" "}
                                    {formatCurrency(item.unit_price)}
                                  </span>
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(
                                    item.unit_price * item.quantity_used
                                  )}
                                </span>
                              </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between items-center font-semibold text-base">
                              <span>Items Total:</span>
                              <span className="text-green-600">
                                {formatCurrency(calculateTotalItemsCost())}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No maintenance items available for this type</p>
                      <p className="text-xs mt-1">
                        Items may need to be associated with this maintenance
                        type first
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRecord}
                disabled={
                  createMaintenanceMutation.isPending ||
                  !newRecord.bus_assignment_id ||
                  !newRecord.maintenance_type_id ||
                  !newRecord.description
                }
              >
                {createMaintenanceMutation.isPending
                  ? "Creating..."
                  : "Create Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Start Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Maintenance</DialogTitle>
              <DialogDescription>
                Begin a maintenance process and mark the bus as under
                maintenance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="bus">Bus</Label>
              <Select
                value={selectedBus?.id || ""}
                onValueChange={(value) => {
                  const bus = assignedBuses.find((b) => b.id === value);
                  setSelectedBus(bus || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bus" />
                </SelectTrigger>
                <SelectContent>
                  {assignedBuses
                    .filter((bus) => bus.status === "assigned")
                    .map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        <span className="font-medium">{bus.plate_number}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStartDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  startMaintenanceMutation.mutate({
                    bus_id: selectedBus.id,
                  })
                }
                disabled={
                  startMaintenanceMutation.isPending || !selectedBus?.id
                }
              >
                {startMaintenanceMutation.isPending
                  ? "Starting..."
                  : "Confirm Start"}
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
                <p className="text-2xl font-bold">
                  {stats.total_records || filteredRecords.length}
                </p>
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
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.total_cost || totalCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.average_cost_per_record || avgCost)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {stats.this_month_count || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
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
                  setSearchTerm("");
                  setTypeFilter("all");
                  setDateRange("all");
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
            <p className="text-muted-foreground">
              Loading maintenance records...
            </p>
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
            <h3 className="text-lg font-semibold mb-2">
              No maintenance records found
            </h3>
            <p className="text-muted-foreground mb-4">
              {records.length === 0
                ? "Get started by creating your first maintenance record."
                : "Try adjusting your filters to see more records."}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Maintenance Record
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      {!isLoading && sortedRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Maintenance Records ({sortedRecords.length})</span>
              <div className="text-sm text-muted-foreground">
                Showing {sortedRecords.length} of {records.length} records
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
                      onClick={() => handleSort("timestamp")}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <SortIcon column="timestamp" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("maintenance_type")}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        <SortIcon column="maintenance_type" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("bus_plate")}
                    >
                      <div className="flex items-center gap-2">
                        Bus
                        <SortIcon column="bus_plate" />
                      </div>
                    </TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort("cost")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Cost
                        <SortIcon column="cost" />
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>
                            {new Date(record.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {record.maintenance_type_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {record.bus_plate_number || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {record.driver_name || "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {record.driver_phone_number || ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(record.cost)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate"
                          title={record.description}
                        >
                          {record.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {record.status !== "completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  completeMaintenanceMutation.mutate(record.id)
                                }
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
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
                  <p className="text-sm">
                    {selectedRecord.maintenance_type_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cost</Label>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(selectedRecord.cost)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bus</Label>
                  <p className="text-sm">{selectedRecord?.bus_plate_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Driver</Label>
                  <p className="text-sm">
                    {selectedRecord.driver_name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">
                    {new Date(selectedRecord.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedRecord.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedRecord.description}
                  </p>
                </div>
              )}
              {selectedRecord.maintenance_type_id?.description && (
                <div>
                  <Label className="text-sm font-medium">
                    Type Description
                  </Label>
                  <p className="text-sm mt-1 p-3 bg-blue-50 rounded-md">
                    {selectedRecord.maintenance_type_id.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
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
