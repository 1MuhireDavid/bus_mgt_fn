'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assignmentAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Bus,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  Plus
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Helper function to format dates
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

export default function ConductorDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['conductorAssignments'],
    queryFn: () => assignmentAPI.getAll(),
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const assignmentData = assignments?.data || [];
  const myAssignments = assignmentData.filter(
    (assignment: any) => assignment.conductor === user?.id
  );
  
  const today = new Date().toISOString().split('T')[0];
  const todayAssignments = myAssignments.filter((assignment: any) => 
    assignment.departure_time.split('T')[0] === today
  );
  
  const activeAssignment = myAssignments.find((assignment: any) => 
    assignment.status === 'in_progress'
  );

  const completedToday = todayAssignments.filter((assignment: any) => 
    assignment.status === 'completed'
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekAssignments = myAssignments.filter(a => {
    const assignmentDate = new Date(a.departure_time);
    return assignmentDate >= weekAgo;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conductor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.first_name}!</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => router.push('/conductor/assignments/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
          <div className="text-sm text-muted-foreground">
            {formatDate(new Date())}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Assignments"
          value={todayAssignments.length}
          icon={Calendar}
          description="Scheduled for today"
        />
        <StatsCard
          title="Completed Today"
          value={completedToday}
          icon={CheckCircle}
          description="Successfully finished"
        />
        <StatsCard
          title="Active Assignment"
          value={activeAssignment ? "1" : "0"}
          icon={Bus}
          description="Currently in progress"
        />
        <StatsCard
          title="Total This Week"
          value={thisWeekAssignments.length}
          icon={Clock}
          description="This week's total"
        />
      </div>

      {/* Active Assignment Card */}
      {activeAssignment && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Bus className="h-5 w-5" />
              Current Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Bus</p>
                <p className="font-medium">{activeAssignment.bus?.plate_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{activeAssignment.driver?.driver_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departure</p>
                <p className="font-medium">
                  {formatTime(activeAssignment.departure_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Return</p>
                <p className="font-medium">
                  {formatTime(activeAssignment.expected_return_time || activeAssignment.return_time)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                View Route
              </Button>
              <Button variant="outline" size="sm">
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAssignments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No assignments for today</p>
                  <Button 
                    size="sm" 
                    onClick={() => router.push('/conductor/assignments/create')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Assignment
                  </Button>
                </div>
              ) : (
                todayAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{assignment.bus?.plate_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(assignment.departure_time)} - 
                        {formatTime(assignment.expected_return_time || assignment.return_time)}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        assignment.status === 'completed' ? 'default' :
                        assignment.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {assignment.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAssignments.slice(0, 5).map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assignment.bus?.plate_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(assignment.departure_time)}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      assignment.status === 'completed' ? 'default' :
                      assignment.status === 'in_progress' ? 'secondary' : 'outline'
                    }
                  >
                    {assignment.status}
                  </Badge>
                </div>
              ))}
              {myAssignments.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No assignments yet</p>
                  <Button 
                    size="sm" 
                    onClick={() => router.push('/conductor/assignments/create')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Assignment
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button 
              className="h-20 flex flex-col gap-2" 
              onClick={() => router.push('/conductor/assignments/create')}
            >
              <Plus className="h-6 w-6" />
              Create Assignment
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => router.push('/conductor/assignments')}
            >
              <Calendar className="h-6 w-6" />
              View All Assignments
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              disabled={!activeAssignment}
            >
              <CheckCircle className="h-6 w-6" />
              Complete Trip
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => router.push('/conductor/profile')}
            >
              <User className="h-6 w-6" />
              My Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}