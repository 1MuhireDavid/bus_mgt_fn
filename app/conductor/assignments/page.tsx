'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assignmentAPI } from "@/lib/api";
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
  Plus
} from "lucide-react";

// Helper functions for date formatting
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (date) => {
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

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['conductorAssignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      assignmentAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conductorAssignments'] });
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const assignmentData = assignments?.data || [];
  
  const myAssignments = assignmentData.filter(
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

  const filteredAssignments = filterAssignmentsByPeriod(myAssignments);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
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

  const handleStartAssignment = (assignmentId: string) => {
    updateAssignmentMutation.mutate({
      id: assignmentId,
      data: { status: 'in_progress' }
    });
  };

  const handleCompleteAssignment = (assignmentId: string) => {
    updateAssignmentMutation.mutate({
      id: assignmentId,
      data: { 
        status: 'completed',
        return_time: new Date().toISOString()
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push('/conductor/assignments/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
          <select
            className="px-3 py-2 border rounded-md"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

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
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredAssignments.filter(a => a.status === 'assigned').length}
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
                  {filteredAssignments.filter(a => a.status === 'returned').length}
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
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No assignments found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  No assignments for the selected time period.
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
                          Assignment #{assignment.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(assignment.departure_time)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bus</p>
                        <p className="font-medium">{assignment?.plate_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Driver</p>
                        <p className="font-medium">{assignment?.driver_name}</p>
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
                  </div>

                  {assignment.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleStartAssignment(assignment.id)}
                        disabled={updateAssignmentMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Assignment
                      </Button>
                    </div>
                  )}

                  {assignment.status === 'assigned' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteAssignment(assignment.id)}
                        disabled={updateAssignmentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Assignment
                      </Button>
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                    </div>
                  )}

                  {assignment.status === 'completed' && assignment.return_time && (
                    <div className="text-sm text-muted-foreground">
                      Completed at: {formatDateTime(assignment.return_time)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}