'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Building,
  MoreHorizontal
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Helper functions for date formatting
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateShort = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
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


 const getStatusBadge = (status: string) => {
    const statusConfig = {
      'assigned': { variant: 'secondary', label: 'Scheduled', icon: Clock },
      'departed': { variant: 'default', label: 'In Progress', icon: Play },
      'in_progress': { variant: 'default', label: 'In Progress', icon: Play },
      'completed': { variant: 'default', label: 'Returned', icon: CheckCircle, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'cancelled': { variant: 'destructive', label: 'Cancelled', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Updated function to handle completion with automatic bus park selection
  const handleCompleteAssignment = async (assignment: any) => {
    // Check if conductor has a designated bus park
    if (user?.bus_park_id) {
      // Automatically complete with conductor's bus park
      completeAssignmentMutation.mutate({
        id: assignment.id,
        returnParkId: user.bus_park_id
      });
    } else {
      // Fallback to original behavior if no bus park assigned
      setSelectedAssignmentForCompletion(assignment);
      setShowCompleteModal(true);
    }
  };

  // Updated function for manual completion (fallback)
  const handleConfirmComplete = () => {
    if (selectedAssignmentForCompletion) {
      // Use conductor's bus park or departure park as fallback
      const returnParkId = user?.bus_park_id || selectedAssignmentForCompletion.departure_bus_park_id;
      
      completeAssignmentMutation.mutate({
        id: selectedAssignmentForCompletion.id,
        returnParkId: returnParkId
      });
      setShowCompleteModal(false);
      setSelectedAssignmentForCompletion(null);
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteModal(false);
    setSelectedAssignmentForCompletion(null);
  };

  const canCompleteAssignment = (assignment: any) => {
    return ['assigned', 'departed', 'in_progress'].includes(assignment.status);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Schedules</h1>
        <Button 
          onClick={() => router.push('/conductor/assignments/create')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Schedule
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

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schedules Details</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No Schedule found</p>
              <p className="text-sm text-muted-foreground mb-4">
                No Schedules match your current filters.
              </p>
              <Button 
                onClick={() => router.push('/conductor/assignments/create')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Schedule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Bus Parks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment: any) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-medium">{formatDateShort(assignment.departure_time)}</div>
                      <div className="text-sm text-muted-foreground">{formatTime(assignment.departure_time)}</div>
                      {assignment.status === 'completed' && assignment.return_time && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Returned: {formatDateTime(assignment.return_time)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{assignment.plate_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.driver_name}</div>
                        <div className="text-sm text-muted-foreground">{assignment.driver_phone_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.route_name || 'Not specified'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(assignment.departure_park_name || assignment.return_park_name) ? (
                        <div className="text-sm">
                          {assignment.departure_park_name && (
                            <div className="flex items-center gap-1 mb-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">From:</span> {assignment.departure_park_name}
                            </div>
                          )}
                          {assignment.return_park_name && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">To:</span> {assignment.return_park_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment.status)}
                      {assignment.trip_duration && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Duration: {assignment.trip_duration}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canCompleteAssignment(assignment) && (
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteAssignment(assignment)}
                            disabled={completeAssignmentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {completeAssignmentMutation.isPending ? 'Completing...' : 'Complete'}
                          </Button>
                        )}
                        
                        {assignment.notes && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <div className="p-2">
                                <p className="text-sm font-medium mb-1">Notes:</p>
                                <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fallback Complete Assignment Modal (only shown if no bus park assigned) */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Schedule
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
                    <div className="font-medium">{selectedAssignmentForCompletion.plate_number}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Driver:</span>
                    <div className="font-medium">{selectedAssignmentForCompletion.driver_name}</div>
                  </div>
                </div>
              </div>

              {/* Information about automatic return */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Building className="inline h-4 w-4 mr-1" />
                  Bus will be returned to: <strong>{selectedAssignmentForCompletion.departure_park_name || 'Original departure location'}</strong>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelComplete}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmComplete}
              disabled={completeAssignmentMutation.isPending}
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