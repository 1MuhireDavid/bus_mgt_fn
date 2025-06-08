'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignmentAPI, busAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Bus,
  CheckCircle,
  XCircle,
  Play,
  Plus,
  Search,
  ArrowRight,
  Building
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

// Helper functions for date formatting
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ConductorAssignments() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAssignmentForCompletion, setSelectedAssignmentForCompletion] = useState<any>(null);
  const [selectedReturnPark, setSelectedReturnPark] = useState('');

  // Fetch bus parks for the completion modal
  const { data: busParksData } = useQuery({
    queryKey: ['busParks'],
    queryFn: () => busAPI.getBusParks(),
    enabled: showCompleteModal
  });

  const { data: assignmentsResponse, isLoading } = useQuery({
    queryKey: ['conductorAssignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  const completeAssignmentMutation = useMutation({
    mutationFn: ({ id, returnParkId }: { id: string; returnParkId: string }) => 
      assignmentAPI.complete(id, { return_bus_park_id: returnParkId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conductorAssignments'] });
    },
  });

  

  if (isLoading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  const assignments = assignmentsResponse?.data || [];
  console.log(assignments,"assignmentsassignments")
  // Filter assignments for current conductor
  const myAssignments = assignments.filter(
    (assignment: any) => assignment.conductor === user?.id
  );

  const filterAssignmentsByPeriod = (assignments: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'today':
        return assignments.filter(a => {
          const assignmentDate = new Date(a.departure_time);
          return assignmentDate >= today && assignmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return assignments.filter(a => new Date(a.departure_time) >= weekAgo);
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return assignments.filter(a => new Date(a.departure_time) >= monthAgo);
      default:
        return assignments;
    }
  };

  const filterByStatus = (assignments: any[]) => {
    if (statusFilter === 'all') return assignments;
    return assignments.filter(a => a.status === statusFilter);
  };

  const filterBySearch = (assignments: any[]) => {
    if (!searchTerm) return assignments;
    return assignments.filter(a => 
      a.bus_plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.route_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAssignments = filterBySearch(
    filterByStatus(
      filterAssignmentsByPeriod(myAssignments)
    )
  );



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-4 w-4" />;
      case 'departed':
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };



  const busParks = busParksData?.data?.results || busParksData?.data || [];
  const handleCompleteAssignment = async (assignment: any) => {
    setSelectedAssignmentForCompletion(assignment);
    setSelectedReturnPark(assignment.departure_bus_park_id || '');
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = () => {
    if (selectedAssignmentForCompletion && selectedReturnPark) {
      completeAssignmentMutation.mutate({
        id: selectedAssignmentForCompletion.id,
        returnParkId: selectedReturnPark
      });
      setShowCompleteModal(false);
      setSelectedAssignmentForCompletion(null);
      setSelectedReturnPark('');
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteModal(false);
    setSelectedAssignmentForCompletion(null);
    setSelectedReturnPark('');
  };

  const canCompleteAssignment = (assignment: any) => {
    return ['assigned', 'departed', 'in_progress'].includes(assignment.status);
  };


  console.log(filteredAssignments,"filteredAssignments")
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <Button 
          onClick={() => router.push('/conductor/assignments/create')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bus, driver, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Scheduled</SelectItem>
                <SelectItem value="completed">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{filteredAssignments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredAssignments.filter(a => ['assigned', 'departed', 'in_progress'].includes(a.status)).length}
                </p>
              </div>
              <Play className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAssignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Schedules Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No assignments found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  No assignments match your current filters.
                </p>
                <Button 
                  onClick={() => router.push('/conductor/assignments/create')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Assignment
                </Button>
              </div>
            ) : (
              filteredAssignments.map((assignment: any) => (
                <div key={assignment.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(assignment.status)}
                      <div>
                        <h3 className="font-semibold text-lg">
                          Schedule
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(assignment.departure_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bus</p>
                        <p className="font-medium">{assignment.plate_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Driver</p>
                        <p className="font-medium">{assignment.driver_name}</p>
                        <p className="font-medium">{assignment.driver_phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Departure</p>
                        <p className="font-medium">
                          {formatTime(assignment.departure_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Route</p>
                        <p className="font-medium">{assignment.route_name || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bus Park Information */}
                  {(assignment.departure_bus_park_name || assignment.return_bus_park_name) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        {assignment.departure_bus_park_name && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">From: {assignment.departure_bus_park_name}</span>
                          </div>
                        )}
                        {assignment.departure_bus_park_name && assignment.return_bus_park_name && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {assignment.return_bus_park_name && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">To: {assignment.return_bus_park_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trip Duration */}
                  {assignment.trip_duration && (
                    <div className="mb-4 text-sm text-muted-foreground">
                      Trip Duration: {assignment.trip_duration}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {canCompleteAssignment(assignment) && (
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteAssignment(assignment)}
                        disabled={completeAssignmentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Assignment
                      </Button>
                    )}
                  </div>

                  {/* Completed Assignment Info */}
                  {assignment.status === 'completed' && assignment.return_time && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      Completed at: {formatDateTime(assignment.return_time)}
                      {assignment.trip_duration && (
                        <span className="ml-4">Duration: {assignment.trip_duration}</span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {assignment.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Notes:</p>
                      <p className="text-sm">{assignment.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Assignment Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Schedules
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssignmentForCompletion && (
            <div className="space-y-4">
              {/* Assignment Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Schedule Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bus:</span>
                    <div className="font-medium">{selectedAssignmentForCompletion.bus_plate_number}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Driver:</span>
                    <div className="font-medium">{selectedAssignmentForCompletion.driver_name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    <div className="font-medium">{selectedAssignmentForCompletion.route_name || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Departure:</span>
                    <div className="font-medium">{formatTime(selectedAssignmentForCompletion.departure_time)}</div>
                  </div>
                </div>
              </div>

              {/* Return Bus Park Selection */}
              <div className="space-y-2">
                <Label htmlFor="return_park">Select Return Bus Park *</Label>
                <Select value={selectedReturnPark} onValueChange={setSelectedReturnPark}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose where the bus will be returned" />
                  </SelectTrigger>
                  <SelectContent>
                    {busParks.map((park: any) => (
                      <SelectItem key={park.id} value={park.id}>
                        <div>
                          <div className="font-medium">{park.name}</div>
                          <div className="text-sm text-muted-foreground">{park.location}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This will update the bus location and mark it as available for new assignments.
                </p>
              </div>

              {/* Completion Summary */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">What happens when you complete?</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Assignment status will be marked as "completed"</li>
                  <li>• Bus will be returned to the selected park</li>
                  <li>• Bus status will change to &quot;active/available&quot;</li>
                  <li>• Driver will become available for new assignments</li>
                  <li>• Trip duration will be calculated and recorded</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelComplete}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmComplete}
              disabled={!selectedReturnPark || completeAssignmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeAssignmentMutation.isPending ? (
                'Completing...'
              ) : (
                'Complete Assignment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}