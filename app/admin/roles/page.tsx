'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  Plus, 
  Search, 
  Users,
  Key,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { roleAPI, permissionAPI, userRoleAPI, userAPI } from '@/lib/api';

export default function RolePermissionManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permission_ids: []
  });

  const [permissionForm, setPermissionForm] = useState({
    name: '',
    resource: '',
    actions: [],
    description: ''
  });

  const [userRoleForm, setUserRoleForm] = useState({
    role_ids: []
  });

  // Available permission actions
  const availableActions = [
    { value: 'read', label: 'Read' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'manage', label: 'Manage (All)' }
  ];

  // Resource types
  const resourceTypes = [
    'bus', 'driver', 'route', 'assignment', 'maintenance', 'fuel', 
    'wash', 'user', 'role', 'permission', 'report', 'dashboard'
  ];

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleAPI.getAll(),
  });

  // Fetch permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionAPI.getAll(),
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.getAll(),
  });

  console.log(selectedUser?.id,"selectedUser?.id..")
  // Fetch selected user's current roles
  const { data: userRolesData, isLoading: userRolesLoading } = useQuery({
    queryKey: ['user-roles', selectedUser?.id],
    queryFn: () => userRoleAPI.getUserRoles(selectedUser?.id),
    enabled: !!selectedUser?.id,
  });

  const roles = rolesData?.data?.data || rolesData?.data || [];
  const permissions = permissionsData?.data?.data || permissionsData?.data || [];
  const users = usersData?.data?.data?.users || [];
  const currentUserRoles = userRolesData?.data?.roles || [];

  // Add success/error states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data) => roleAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateRoleOpen(false);
      resetRoleForm();
      setSuccessMessage('Role created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.message || 'Failed to create role');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => permissionAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setIsCreatePermissionOpen(false);
      resetPermissionForm();
      setSuccessMessage('Permission created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.message || 'Failed to create permission');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, data }) => userRoleAPI.assignRoles(userId, data),
    onSuccess: () => {
      setIsAssignRoleOpen(false);
      setSelectedUser(null);
      resetUserRoleForm();
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      setSuccessMessage('Roles assigned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.message || 'Failed to assign roles');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => roleAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('Role deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.message || 'Failed to delete role');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });

  // Form reset functions
  const resetRoleForm = () => {
    setRoleForm({ name: '', description: '', permission_ids: [] });
  };

  const resetPermissionForm = () => {
    setPermissionForm({ name: '', resource: '', actions: [], description: '' });
  };

  const resetUserRoleForm = () => {
    setUserRoleForm({ role_ids: [] });
  };

  // Handle form submissions
  const handleCreateRole = () => {
    createRoleMutation.mutate(roleForm);
  };

  const handleCreatePermission = () => {
    createPermissionMutation.mutate(permissionForm);
  };

  const handleAssignRoles = () => {
    if (!selectedUser) return;
    assignRolesMutation.mutate({
      userId: selectedUser.id,
      data: { role_ids: userRoleForm.role_ids }
    });
  };

  // Filter functions
  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission =>
    permission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsUserSelectOpen(false);
    setIsAssignRoleOpen(true);
    // Reset role selection when user changes
    setUserRoleForm({ role_ids: [] });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Role & Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage user roles, permissions, and access control</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="user-assignment" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            User Assignment
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Roles Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions for your system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      placeholder="e.g., Fleet Manager"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Textarea
                      id="role-description"
                      placeholder="Describe the role's responsibilities..."
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({...prev, description: e.target.value}))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={roleForm.permission_ids.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setRoleForm(prev => ({
                                  ...prev,
                                  permission_ids: [...prev.permission_ids, permission.id]
                                }));
                              } else {
                                setRoleForm(prev => ({
                                  ...prev,
                                  permission_ids: prev.permission_ids.filter(id => id !== permission.id)
                                }));
                              }
                            }}
                          />
                          <label htmlFor={`perm-${permission.id}`} className="text-sm font-medium">
                            {permission.name}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {permission.resource}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRole} 
                    disabled={createRoleMutation.isPending || !roleForm.name}
                  >
                    {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roles List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rolesLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading roles...
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No roles found</p>
                <p className="text-sm text-muted-foreground">Create your first role to get started.</p>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.permissions_count || 0} permissions
                        </p>
                      </div>
                      <Badge variant={role.is_active ? 'default' : 'destructive'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">{role.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedRole(role)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteRoleMutation.mutate(role.id)}
                        disabled={deleteRoleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          {/* Permissions Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <Dialog open={isCreatePermissionOpen} onOpenChange={setIsCreatePermissionOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Permission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Permission</DialogTitle>
                  <DialogDescription>
                    Define a new permission for system resources.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="perm-name">Permission Name</Label>
                    <Input
                      id="perm-name"
                      placeholder="e.g., manage_buses"
                      value={permissionForm.name}
                      onChange={(e) => setPermissionForm(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-resource">Resource</Label>
                    <Select 
                      value={permissionForm.resource} 
                      onValueChange={(value) => setPermissionForm(prev => ({...prev, resource: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((resource) => (
                          <SelectItem key={resource} value={resource}>
                            {resource.charAt(0).toUpperCase() + resource.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Actions</Label>
                    <div className="space-y-2">
                      {availableActions.map((action) => (
                        <div key={action.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`action-${action.value}`}
                            checked={permissionForm.actions.includes(action.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPermissionForm(prev => ({
                                  ...prev,
                                  actions: [...prev.actions, action.value]
                                }));
                              } else {
                                setPermissionForm(prev => ({
                                  ...prev,
                                  actions: prev.actions.filter(a => a !== action.value)
                                }));
                              }
                            }}
                          />
                          <label htmlFor={`action-${action.value}`} className="text-sm font-medium">
                            {action.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-description">Description (Optional)</Label>
                    <Textarea
                      id="perm-description"
                      placeholder="Describe what this permission allows..."
                      value={permissionForm.description}
                      onChange={(e) => setPermissionForm(prev => ({...prev, description: e.target.value}))}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatePermissionOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePermission} 
                    disabled={createPermissionMutation.isPending || !permissionForm.name || !permissionForm.resource || permissionForm.actions.length === 0}
                  >
                    {createPermissionMutation.isPending ? 'Creating...' : 'Create Permission'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Permissions List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {permissionsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading permissions...
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No permissions found</p>
                <p className="text-sm text-muted-foreground">Create your first permission to get started.</p>
              </div>
            ) : (
              filteredPermissions.map((permission) => (
                <Card key={permission.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{permission.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {permission.resource}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Actions:</p>
                      <div className="flex flex-wrap gap-1">
                        {permission.actions?.map((action) => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {permission.description && (
                      <p className="text-sm text-gray-700">{permission.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* User Assignment Tab */}
        <TabsContent value="user-assignment" className="space-y-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select User to Assign Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, username, or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog open={isUserSelectOpen} onOpenChange={setIsUserSelectOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Browse Users
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Select User</DialogTitle>
                      <DialogDescription>
                        Choose a user to assign roles to.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {usersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            Loading users...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your search term.</p>
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <Card key={user.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleUserSelect(user)}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-600">
                                        {user.first_name?.[0] || user.username?.[0] || 'U'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {user.first_name} {user.last_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                                      <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                      {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      ID: {user.id}...
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUserSelectOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Quick User List */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.slice(0, 6).map((user) => (
                  <Card key={user.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleUserSelect(user)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {user.first_name?.[0] || user.username?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        </div>
                        <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-xs">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredUsers.length > 6 && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => setIsUserSelectOpen(true)}>
                    View All {filteredUsers.length} Users
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Assignment Dialog */}
          <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Roles</DialogTitle>
                <DialogDescription>
                  {selectedUser && (
                    <>Assign roles to {selectedUser.first_name} {selectedUser.last_name} (@{selectedUser.username})</>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="space-y-4">
                  {/* Selected User Info */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {selectedUser.first_name?.[0] || selectedUser.username?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                          <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                          <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Roles */}
                  {userRolesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Loading current roles...
                    </div>
                  ) : currentUserRoles.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Current Roles:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentUserRoles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label>Select Roles to Assign</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
                      {roles.map((role) => {
                        const isCurrentlyAssigned = currentUserRoles.some(ur => ur.id === role.id);
                        return (
                          <div key={role.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-role-${role.id}`}
                              checked={userRoleForm.role_ids.includes(role.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setUserRoleForm(prev => ({
                                    ...prev,
                                    role_ids: [...prev.role_ids, role.id]
                                  }));
                                } else {
                                  setUserRoleForm(prev => ({
                                    ...prev,
                                    role_ids: prev.role_ids.filter(id => id !== role.id)
                                  }));
                                }
                              }}
                            />
                            <label htmlFor={`user-role-${role.id}`} className="text-sm font-medium flex-1">
                              {role.name}
                              {isCurrentlyAssigned && (
                                <span className="ml-2 text-xs text-green-600">(Currently assigned)</span>
                              )}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {role.permissions_count} permissions
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAssignRoleOpen(false);
                  setSelectedUser(null);
                  resetUserRoleForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignRoles}
                  disabled={assignRolesMutation.isPending || !selectedUser || userRoleForm.role_ids.length === 0}
                  className="flex items-center gap-2"
                >
                  {assignRolesMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Assign Roles
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}