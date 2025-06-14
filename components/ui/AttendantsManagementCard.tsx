
import { carWashStationAPI, serviceAttendantAPI, userAPI } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge, Eye, RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./button";
import { useState } from "react";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export const AttendantsManagementCard = ({ station }) => {
  const queryClient = useQueryClient();
  const [isAddAttendantOpen, setIsAddAttendantOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  // Fetch station attendants
  const { data: attendantsData, isLoading: loadingAttendants, refetch: refetchAttendants } = useQuery({
    queryKey: ['car-wash-attendants', station?.id],
    queryFn: () => carWashStationAPI.getAttendants(station.id),
    enabled: !!station
  });

  // Fetch all users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userAPI.getAll(),
    enabled: isAddAttendantOpen
  });
    
  // Add attendant mutation
  const addAttendantMutation = useMutation({
    mutationFn: (userData) => serviceAttendantAPI.create({
      user: userData.userId,
      attendant_type: 'car_wash',
      car_wash_station: station.id,
      is_active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-attendants'] });
      queryClient.invalidateQueries({ queryKey: ['car-wash-stations'] });
      setIsAddAttendantOpen(false);
      setSelectedUser('');
      toast.success('Attendant added successfully!');
      refetchAttendants();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to add attendant';
      toast.error(errorMessage);
    }
  });

  // Remove attendant mutation
  const removeAttendantMutation = useMutation({
    mutationFn: (attendantId) => serviceAttendantAPI.delete(attendantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-wash-attendants'] });
      queryClient.invalidateQueries({ queryKey: ['car-wash-stations'] });
      toast.success('Attendant removed successfully!');
      refetchAttendants();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to remove attendant';
      toast.error(errorMessage);
    }
  });

  const attendants = attendantsData?.data?.data || [];
  const users = usersData?.data?.data?.users || [];


  // Filter out users who are already attendants at this station
  const availableUsers = users.filter(user => 
    !attendants.some(attendant => attendant.user === user.id)
  );

  const handleAddAttendant = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    addAttendantMutation.mutate({ userId: selectedUser });
  };

  const handleRemoveAttendant = (attendantId) => {
    if (confirm('Are you sure you want to remove this attendant?')) {
      removeAttendantMutation.mutate(attendantId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Station Attendants ({attendants.length})
          </CardTitle>
          <Button
            onClick={() => setIsAddAttendantOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Attendant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingAttendants ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading attendants...
          </div>
        ) : attendants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No attendants assigned</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding attendants to this car wash station.
            </p>
            <Button onClick={() => setIsAddAttendantOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Attendant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {attendants.map((attendant) => (
              <div key={attendant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{attendant.attendant_name}</p>
                    <p className="text-sm text-muted-foreground">@{attendant.attendant_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={attendant.is_active ? "default" : "secondary"}>
                        {attendant.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Since {new Date(attendant.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to attendant performance/details
                      toast.info('View performance feature coming soon!');
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAttendant(attendant.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={removeAttendantMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Attendant Dialog */}
      <Dialog open={isAddAttendantOpen} onOpenChange={setIsAddAttendantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Car Wash Attendant</DialogTitle>
            <DialogDescription>
              Assign a user as an attendant to {station?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user to assign..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.first_name} {user.last_name}</span>
                        <span className="text-sm text-muted-foreground">@{user.username}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No available users to assign. All users are already attendants or no users exist.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAttendantOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAttendant}
              disabled={!selectedUser || addAttendantMutation.isPending}
            >
              {addAttendantMutation.isPending ? 'Adding...' : 'Add Attendant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};