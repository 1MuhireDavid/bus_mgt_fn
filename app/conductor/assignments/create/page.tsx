'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Bus, User, MapPin, AlertCircle, ArrowLeft, Building, Calendar } from "lucide-react";
import { assignmentAPI, busAPI, driverAPI, routeAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';



export default function CreateAssignmentPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    bus_id: '',
    driver_id: '',
    route: '',
    conductor_id: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set conductor from current user
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        conductor_id: user.id.toString()
      }));
    }
  }, [user]);

  // Fetch data
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busAPI.getAll()
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverAPI.getAll()
  });

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routeAPI.getAll()
  });

  const { data: busParksData, isLoading: busParksLoading } = useQuery({
    queryKey: ['busParks'],
    queryFn: () => busAPI.getBusParks() // Assuming this endpoint exists
  });

  // Extract data from API responses
  const buses = busesData?.data?.results || busesData?.data || [];
  const drivers = driversData?.data?.results || driversData?.data || [];
  const routes = routesData?.data?.results || routesData?.data || [];
  const busParks = busParksData?.data?.results || busParksData?.data || [];

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => assignmentAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['conductorAssignments'] });
      router.push('/conductor/assignments');
    },
    onError: (error: any) => {
      console.error('Failed to create assignment:', error);
      
      // Handle validation errors from backend
      if (error.response?.data) {
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setErrors({ submit: backendErrors.message || 'Failed to create assignment. Please try again.' });
        }
      } else {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      }
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.bus_id) newErrors.bus_id = 'Please select a bus';
    if (!formData.driver_id) newErrors.driver_id = 'Please select a driver';
    if (!formData.route) newErrors.route = 'Please select a route';

    // Check if selected bus is available
    const selectedBus = buses.find((bus: any) => bus.id === formData.bus_id);
    if (selectedBus && !['active', 'available'].includes(selectedBus.status)) {
      newErrors.bus_id = 'Selected bus is not available for assignment';
    }

    // Check if selected driver is available
    const selectedDriver = drivers.find((driver: any) => driver.id.toString() === formData.driver_id);
    if (selectedDriver && selectedDriver.status !== 'available') {
      newErrors.driver_id = 'Selected driver is not available';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

  const now = new Date();
  const departureTime = now.toISOString();

    // Prepare data for backend - convert string IDs to integers where needed
    const submitData = {
      bus_id: formData.bus_id,
      driver_id: parseInt(formData.driver_id),
      conductor: parseInt(formData.conductor_id),
      route: parseInt(formData.route),
      departure_time: departureTime,
      notes: formData.notes.trim()
    };

    createAssignmentMutation.mutate(submitData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      available: 'default',
      under_maintenance: 'destructive',
      assigned: 'secondary',
      decommissioned: 'outline'
    };
    
    const colors: Record<string, string> = {
      active: 'text-green-700 bg-green-100',
      available: 'text-green-700 bg-green-100',
      under_maintenance: 'text-red-700 bg-red-100',
      assigned: 'text-yellow-700 bg-yellow-100',
      decommissioned: 'text-gray-700 bg-gray-100'
    };

    return (
      <Badge 
        variant={variants[status] || 'outline'} 
        className={colors[status] || ''}
      >
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getDriverStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'text-green-700 bg-green-100',
      assigned: 'text-yellow-700 bg-yellow-100',
      unavailable: 'text-red-700 bg-red-100'
    };

    return (
      <Badge className={colors[status] || 'text-gray-700 bg-gray-100'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Filter available buses and drivers
  const availableBuses = buses.filter((bus: any) => ['active', 'available'].includes(bus.status));
  const availableDrivers = drivers.filter((driver: any) => driver.status === 'available');

  const selectedBus = buses.find((bus: any) => bus.id === formData.bus_id);
  const selectedDriver = drivers.find((driver: any) => driver.id.toString() === formData.driver_id);
  const selectedRoute = routes.find((route: any) => route.id.toString() === formData.route);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Bus Assignment</h1>
          <p className="text-muted-foreground">Assign a bus and driver for a route</p>
        </div>
      </div>

      {/* Error Alerts */}
      {errors.submit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errors.submit}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {(busesLoading || driversLoading || routesLoading) && (
        <Alert>
          <AlertDescription>
            Loading available resources...
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Bus Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Select Bus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="bus">Available Buses</Label>
                <Select value={formData.bus_id} onValueChange={(value) => handleInputChange('bus_id', value)}>
                  <SelectTrigger className={errors.bus_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBuses.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No available buses found
                      </div>
                    ) : (
                      availableBuses.map((bus: any) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          <div className="flex items-center justify-between w-full min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{bus.plate_number}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {bus.model} • Capacity: {bus.capacity}
                              </div>
                              {bus.current_location && (
                                <div className="text-xs text-muted-foreground">
                                  Located at: {bus.current_location_name}
                                </div>
                              )}
                            </div>
                            <div className="ml-2">
                              {getStatusBadge(bus.status)}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.bus_id && <p className="text-sm text-red-500">{errors.bus_id}</p>}
                
                {/* Show all buses option for admin users */}
                {availableBuses.length === 0 && buses.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p>No buses currently available. All buses status:</p>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {buses.slice(0, 5).map((bus: any) => (
                        <div key={bus.id} className="flex justify-between items-center text-xs">
                          <span>{bus.plate_number}</span>
                          {getStatusBadge(bus.status)}
                        </div>
                      ))}
                      {buses.length > 5 && (
                        <div className="text-xs">... and {buses.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Driver Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="driver">Available Drivers</Label>
                <Select value={formData.driver_id} onValueChange={(value) => handleInputChange('driver_id', value)}>
                  <SelectTrigger className={errors.driver_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No available drivers found
                      </div>
                    ) : (
                      availableDrivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          <div className="flex items-center justify-between w-full min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{driver.driver_name}</div>
                              <div className="text-sm text-muted-foreground">
                                License: {driver.license_number}
                              </div>
                              {driver.phone_number && (
                                <div className="text-xs text-muted-foreground">
                                  Phone: {driver.phone_number}
                                </div>
                              )}
                              {driver.license_expiry && (
                                <div className="text-xs text-muted-foreground">
                                  License expires: {new Date(driver.license_expiry).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="ml-2">
                              {getDriverStatusBadge(driver.status)}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.driver_id && <p className="text-sm text-red-500">{errors.driver_id}</p>}
                
                {/* Show all drivers status for admin */}
                {availableDrivers.length === 0 && drivers.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p>No drivers currently available. All drivers status:</p>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {drivers.slice(0, 5).map((driver: any) => (
                        <div key={driver.id} className="flex justify-between items-center text-xs">
                          <span>{driver.driver_name}</span>
                          {getDriverStatusBadge(driver.status)}
                        </div>
                      ))}
                      {drivers.length > 5 && (
                        <div className="text-xs">... and {drivers.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="route">Available Routes</Label>
              <Select value={formData.route} onValueChange={(value) => handleInputChange('route', value)}>
                <SelectTrigger className={errors.route ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No routes available
                    </div>
                  ) : (
                    routes.map((route: any) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        <div>
                          <div className="font-medium">{route.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {route.start_location} → {route.end_location}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.route && <p className="text-sm text-red-500">{errors.route}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
        <Label>Departure Time</Label>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="font-medium">
            {new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            Assignment will be created with current time as departure
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The departure time will be automatically set when you create the assignment
        </p>
      </div>
              {/* Show current user as conductor */}
              <div className="space-y-2">
                <Label>Conductor</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You will be assigned as the conductor for this trip
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions, route details, or notes for this assignment..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.notes.length}/500 characters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Summary */}
        {formData.bus_id && formData.driver_id && formData.route && (
  <Card className="border-blue-200 bg-blue-50">
    <CardHeader>
      <CardTitle className="text-blue-700 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Assignment Summary
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Bus</p>
          <p className="font-medium">{selectedBus?.plate_number}</p>
          <p className="text-xs text-muted-foreground">{selectedBus?.model}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Driver</p>
          <p className="font-medium">{selectedDriver?.driver_name}</p>
          <p className="text-xs text-muted-foreground">{selectedDriver?.license_number}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Route</p>
          <p className="font-medium">{selectedRoute?.name}</p>
          <p className="text-xs text-muted-foreground">
            {selectedRoute?.start_location} → {selectedRoute?.end_location}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Departure</p>
          <p className="font-medium">
            {new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            Conductor: {user?.first_name} {user?.last_name}
          </p>
        </div>
      </div>

      {/* Business Rules Reminder */}
      <div className="mt-4 p-3 bg-white rounded-lg border">
        <h4 className="font-medium text-sm mb-2">Assignment Rules:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Bus will be marked as "assigned" upon creation</li>
          <li>• Driver will be marked as "assigned" and unavailable for other trips</li>
          <li>• Departure time will be set to the current time</li>
          <li>• Assignment can be cancelled before departure</li>
          <li>• Bus location will be tracked throughout the trip</li>
        </ul>
      </div>
    </CardContent>
  </Card>
)}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleSubmit} 
            disabled={createAssignmentMutation.isPending || availableBuses.length === 0 || availableDrivers.length === 0}
            className="flex-1 md:flex-none"
          >
            {createAssignmentMutation.isPending ? (
              <>Creating Assignment...</>
            ) : (
              <>Create Assignment</>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/conductor/assignments')}
            disabled={createAssignmentMutation.isPending}
          >
            Cancel
          </Button>
        </div>

        {/* Resource Availability Warning */}
        {(availableBuses.length === 0 || availableDrivers.length === 0) && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              {availableBuses.length === 0 && availableDrivers.length === 0 && 
                "No buses or drivers are currently available for assignment."}
              {availableBuses.length === 0 && availableDrivers.length > 0 && 
                "No buses are currently available for assignment."}
              {availableBuses.length > 0 && availableDrivers.length === 0 && 
                "No drivers are currently available for assignment."}
              {" "}Please check with fleet management or wait for resources to become available.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}