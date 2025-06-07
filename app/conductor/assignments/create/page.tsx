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
import { Clock, Bus, User, MapPin, AlertCircle, ArrowLeft } from "lucide-react";
// Helper function to format dates
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
import { assignmentAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { busAPI, driverAPI, routeAPI } from "@/lib/api";

export default function CreateAssignmentPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    bus_id: '',
    driver_id: '',
    route: '',
    conductor: '',
    departure_time: '',
    status: 'assigned',
    notes: '',
    company: ''
  });
 
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        conductor: user.id,
        company: user.company
      }));
    }
  }, [user]);
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
  const buses = busesData?.data?.data || busesData?.data || [];
  const drivers = driversData?.data?.data || driversData?.data || [];
  const routes = routesData?.data?.data || routesData?.data || [];
  const [errors, setErrors] = useState({});

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (data) => assignmentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conductorAssignments'] });
      router.push('/conductor/assignments'); 
    },
    onError: (error) => {
      console.error('Failed to create assignment:', error);
      setErrors({ submit: 'Failed to create assignment. Please try again.' });
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bus_id) newErrors.bus_id = 'Please select a bus';
    if (!formData.driver_id) newErrors.driver_id = 'Please select a driver';
    if (!formData.route) newErrors.route = 'Please select a route';
    if (!formData.departure_time) newErrors.departure_time = 'Please set departure time';

    // Validate departure time is in the future
    if (formData.departure_time && new Date(formData.departure_time) <= new Date()) {
      newErrors.departure_time = 'Departure time must be in the future';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Convert string IDs to appropriate types for backend
    const submitData = {
      ...formData,
      driver_id: parseInt(formData.driver_id),
      route: parseInt(formData.route),
      conductor: parseInt(formData.conductor)
    };

    createAssignmentMutation.mutate(submitData);
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: 'default',
      maintenance: 'destructive',
      in_use: 'secondary',
      out_of_service: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

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

      {/* Success/Error Alerts */}
      {errors.submit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errors.submit}
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
                    {buses.map((bus) => (
                      <SelectItem 
                        key={bus.id} 
                        value={bus.id}
                        disabled={bus.status !== 'active'}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{bus.plate_number}</div>
                            <div className="text-sm text-muted-foreground">{bus.model}</div>
                          </div>
                          {getStatusBadge(bus.status)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bus_id && <p className="text-sm text-red-500">{errors.bus_id}</p>}
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
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        <div>
                          <div className="font-medium">{driver.driver_name}</div>
                          <div className="text-sm text-muted-foreground">
                            License: {driver.license_number} • {driver.phone}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.driver_id && <p className="text-sm text-red-500">{errors.driver_id}</p>}
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
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id.toString()}>
                      <div>
                        <div className="font-medium">{route.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {route.origin} → {route.destination} ({route.distance})
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.route && <p className="text-sm text-red-500">{errors.route}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Time Settings */}
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
                <Label htmlFor="departure_time">Departure Time</Label>
                <Input
                  id="departure_time"
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) => handleInputChange('departure_time', e.target.value)}
                  className={errors.departure_time ? 'border-red-500' : ''}
                />
                {errors.departure_time && <p className="text-sm text-red-500">{errors.departure_time}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Assignment Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes for this assignment..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Summary */}
        {formData.bus_id && formData.driver_id && formData.route && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-700">Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bus</p>
                  <p className="font-medium">
                    {buses.find(b => b.id === formData.bus_id)?.plate_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">
                    {drivers.find(d => d.id.toString() === formData.driver_id)?.driver_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {routes.find(r => r.id.toString() === formData.route)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="font-medium">
                    {formData.departure_time ? formatDate(formData.departure_time) : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleSubmit} 
            disabled={createAssignmentMutation.isPending}
            className="flex-1 md:flex-none"
          >
            {createAssignmentMutation.isPending ? 'Creating Assignment...' : 'Create Assignment'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/conductor/assignments')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}