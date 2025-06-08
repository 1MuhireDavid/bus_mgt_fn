import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bus, 
  MapPin, 
  User, 
  Clock, 
  Fuel,
  Wrench,
  Droplets,
  Calendar,
  Route,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { busAPI } from '@/lib/api';

// Bus Detail Modal Component
const BusDetailModal = ({ busId, isOpen, onClose, selectedDate }) => {
  // Query for bus details and daily expenses
  const { 
    data: busData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['bus-detail', busId, selectedDate],
    queryFn: () => busAPI.getBusDetailWithExpenses(busId, selectedDate),
    enabled: isOpen && !!busId,
  });

  const bus = busData?.data || {};
  const assignment = bus.current_assignment || {};
  const expenses = bus.daily_expenses || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  const formatTime = (datetime) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const variants = {
      'available': 'secondary',
      'assigned': 'default',
      'departed': 'default',
      'in_progress': 'default',
      'completed': 'outline',
      'maintenance': 'destructive',
      'out_of_service': 'destructive',
    };
    const colors = {
      'available': 'text-green-600',
      'assigned': 'text-blue-600',
      'departed': 'text-orange-600',
      'in_progress': 'text-orange-600',
      'completed': 'text-gray-600',
      'maintenance': 'text-red-600',
      'out_of_service': 'text-red-600',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className={colors[status]}>
        {status?.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="w-6 h-6 text-blue-600" />
            Bus Details - {bus.plate_number}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading bus details...</span>
          </div>
        )}

        {isError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Failed to load bus details: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && bus.plate_number && (
          <div className="space-y-6">
            {/* Bus Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Bus Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Plate Number</p>
                    <p className="font-medium text-lg">{bus.plate_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(bus.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{bus.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-medium">{bus.capacity || 'N/A'} passengers</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {bus.current_location?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedDate || new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Assignment Details */}
            {assignment.id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Current Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Driver</p>
                      <p className="font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {assignment.driver?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conductor</p>
                      <p className="font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {assignment.conductor?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Route</p>
                      <p className="font-medium">{assignment.route?.name || 'N/A'}</p>
                      {assignment.route && (
                        <p className="text-xs text-muted-foreground">
                          {assignment.route.start_location} → {assignment.route.end_location}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assignment Status</p>
                      <div className="mt-1">{getStatusBadge(assignment.status)}</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Departure Station</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {assignment.departure_bus_park?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departure Time</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(assignment.departure_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Return Station</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-red-600" />
                        {assignment.return_bus_park?.name || 'Not returned yet'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Return Time</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {assignment.return_time ? formatTime(assignment.return_time) : 'Not returned yet'}
                      </p>
                    </div>
                  </div>

                  {assignment.trip_duration && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Trip Duration</p>
                      <p className="font-medium">{assignment.trip_duration}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Daily Expenses Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Daily Expenses Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Fuel Expenses</p>
                          <p className="text-xl font-bold text-orange-600">
                            {formatCurrency(expenses.fuel?.total_cost || 0)}
                          </p>
                          {expenses.fuel?.total_liters > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {expenses.fuel.total_liters}L consumed
                            </p>
                          )}
                        </div>
                        <Fuel className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Maintenance</p>
                          <p className="text-xl font-bold text-purple-600">
                            {formatCurrency(expenses.maintenance?.total_cost || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expenses.maintenance?.records?.length || 0} records
                          </p>
                        </div>
                        <Wrench className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Car Wash</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(expenses.wash?.total_cost || 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expenses.wash?.records?.length || 0} washes
                          </p>
                        </div>
                        <Droplets className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Daily Expenses:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      (expenses.fuel?.total_cost || 0) +
                      (expenses.maintenance?.total_cost || 0) +
                      (expenses.wash?.total_cost || 0)
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Expense Records */}
            {(expenses.fuel?.records?.length > 0 || 
              expenses.maintenance?.records?.length > 0 || 
              expenses.wash?.records?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Expense Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Fuel Records */}
                    {expenses.fuel?.records?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          Fuel Records ({expenses.fuel.records.length})
                        </h4>
                        <div className="space-y-2">
                          {expenses.fuel.records.map((record, index) => (
                            <div key={index} className="bg-orange-50 p-3 rounded border-l-4 border-orange-500">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Time:</span> {formatTime(record.timestamp)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Attendant:</span> {record.attendant_name}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Liters:</span> {record.liters}L
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Amount:</span> {formatCurrency(record.amount)}
                                </div>
                              </div>
                              {record.receipt_number && record.receipt_number !== 'N/A' && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Receipt: {record.receipt_number}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Maintenance Records */}
                    {expenses.maintenance?.records?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Maintenance Records ({expenses.maintenance.records.length})
                        </h4>
                        <div className="space-y-2">
                          {expenses.maintenance.records.map((record, index) => (
                            <div key={index} className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Time:</span> {formatTime(record.timestamp)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Type:</span> {record.maintenance_type}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost:</span> {formatCurrency(record.cost)}
                                </div>
                              </div>
                              {record.description && (
                                <div className="mt-1 text-sm">
                                  <span className="text-muted-foreground">Description:</span> {record.description}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-muted-foreground">
                                Attendant: {record.attendant_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wash Records */}
                    {expenses.wash?.records?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          Car Wash Records ({expenses.wash.records.length})
                        </h4>
                        <div className="space-y-2">
                          {expenses.wash.records.map((record, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Time:</span> {formatTime(record.timestamp)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Attendant:</span> {record.attendant_name}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost:</span> {formatCurrency(record.cost)}
                                </div>
                              </div>
                              {record.notes && record.notes !== 'N/A' && (
                                <div className="mt-1 text-sm">
                                  <span className="text-muted-foreground">Notes:</span> {record.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Records Message */}
            {!expenses.fuel?.records?.length && 
             !expenses.maintenance?.records?.length && 
             !expenses.wash?.records?.length && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No expense records found</p>
                  <p className="text-sm text-muted-foreground">
                    No fuel, maintenance, or wash records for this bus on the selected date.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BusDetailModal;