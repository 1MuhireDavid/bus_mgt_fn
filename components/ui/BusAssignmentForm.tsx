import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Clock, Bus, User, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { format } from 'date-fns';

// Mock data - replace with actual API calls
const mockBuses = [
  { id: "1", plate_number: "KCA 123A", status: "available", model: "Toyota Hiace" },
  { id: "2", plate_number: "KCB 456B", status: "available", model: "Nissan Matatu" },
  { id: "3", plate_number: "KCC 789C", status: "maintenance", model: "Isuzu NPR" },
  { id: "4", plate_number: "KCD 012D", status: "available", model: "Toyota Coaster" }
];

const mockDrivers = [
  { id: 1, driver_name: "John Kimani", license_number: "DL001", phone: "+254701234567" },
  { id: 2, driver_name: "Mary Wanjiku", license_number: "DL002", phone: "+254702345678" },
  { id: 3, driver_name: "Peter Otieno", license_number: "DL003", phone: "+254703456789" },
  { id: 4, driver_name: "Grace Muthoni", license_number: "DL004", phone: "+254704567890" }
];

const mockRoutes = [
  { id: 1, name: "Nairobi - Mombasa", origin: "Nairobi", destination: "Mombasa", distance: "480 km" },
  { id: 2, name: "Nairobi - Kisumu", origin: "Nairobi", destination: "Kisumu", distance: "350 km" },
  { id: 3, name: "Nairobi - Nakuru", origin: "Nairobi", destination: "Nakuru", distance: "160 km" },
  { id: 4, name: "Nairobi - Eldoret", origin: "Nairobi", destination: "Eldoret", distance: "310 km" }
];

const BusAssignmentForm = () => {
  const [formData, setFormData] = useState({
    bus_id: '',
    driver_id: '',
    route: '',
    conductor: '', // This will be set to current user
    departure_time: '',
    status: 'assigned',
    return_time: '',
    notes: '',
    company: '' // This will be set from user context
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Mock current user - replace with actual auth context
  const currentUser = {
    id: 'conductor-123',
    name: 'Sarah Mwangi',
    company: { id: 'company-456', name: 'Nairobi Express' }
  };

  useEffect(() => {
    // Set conductor and company from current user
    setFormData(prev => ({
      ...prev,
      conductor: currentUser.id,
      company: currentUser.company.id
    }));
  }, [currentUser.id, currentUser.company.id]);

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
    if (!formData.return_time) newErrors.return_time = 'Please set expected return time';

    // Validate departure time is in the future
    if (formData.departure_time && new Date(formData.departure_time) <= new Date()) {
      newErrors.departure_time = 'Departure time must be in the future';
    }

    // Validate return time is after departure time
    if (formData.departure_time && formData.return_time && 
        new Date(formData.return_time) <= new Date(formData.departure_time)) {
      newErrors.return_time = 'Return time must be after departure time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert string IDs to appropriate types for backend
      const submitData = {
        ...formData,
        driver_id: parseInt(formData.driver_id),
        route: parseInt(formData.route),
        conductor: parseInt(formData.conductor) // Assuming backend expects integer
      };
     
      // const response = await assignmentAPI.create(submitData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          bus_id: '',
          driver_id: '',
          route: '',
          conductor: currentUser.id,
          departure_time: '',
          status: 'assigned',
          return_time: '',
          notes: '',
          company: currentUser.company.id
        });
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create assignment:', error);
      setErrors({ submit: 'Failed to create assignment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: 'success',
      maintenance: 'destructive',
      in_use: 'default',
      out_of_service: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Bus Assignment</h1>
          <p className="text-muted-foreground">Assign a bus and driver for a route</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Conductor: {currentUser.name}
        </div>
      </div>

      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Bus assignment created successfully!
          </AlertDescription>
        </Alert>
      )}

      {errors.submit && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errors.submit}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    {mockBuses.map((bus) => (
                      <SelectItem 
                        key={bus.id} 
                        value={bus.id}
                        disabled={bus.status !== 'available'}
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
                    {mockDrivers.map((driver) => (
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
                  {mockRoutes.map((route) => (
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
              <div className="space-y-2">
                <Label htmlFor="return_time">Expected Return Time</Label>
                <Input
                  id="return_time"
                  type="datetime-local"
                  value={formData.return_time}
                  onChange={(e) => handleInputChange('return_time', e.target.value)}
                  className={errors.return_time ? 'border-red-500' : ''}
                />
                {errors.return_time && <p className="text-sm text-red-500">{errors.return_time}</p>}
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
                    {mockBuses.find(b => b.id === formData.bus_id)?.plate_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">
                    {mockDrivers.find(d => d.id.toString() === formData.driver_id)?.driver_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {mockRoutes.find(r => r.id.toString() === formData.route)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="font-medium">
                    {formData.departure_time ? format(new Date(formData.departure_time), 'PPp') : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 md:flex-none"
          >
            {isSubmitting ? 'Creating Assignment...' : 'Create Assignment'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setFormData({
                bus_id: '',
                driver_id: '',
                route: '',
                conductor: currentUser.id,
                departure_time: '',
                status: 'assigned',
                return_time: '',
                notes: '',
                company: currentUser.company.id
              });
              setErrors({});
            }}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusAssignmentForm;