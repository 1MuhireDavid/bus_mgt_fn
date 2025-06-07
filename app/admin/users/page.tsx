'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card,CardContent,CardHeader, CardTitle,} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, UserCheck, UserX
} from "lucide-react";
import { User } from '@/types';
import UserFormModal from '@/components/ui/UserFormModal';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const fetchUsers = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/users/`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
};

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const users = data?.data?.users || [];

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = [user.username, user.first_name, user.last_name, user.email]
      .some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.roles?.some(role => role.name === roleFilter);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserStatus = async (user: User) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    try {
      const res = await fetch(`${API_BASE_URL}/auth/${user.id}/${action}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      toast.success(`User ${action}d`);
      queryClient.invalidateQueries(['users']);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (!roles.length) return <Badge variant="outline">No Role</Badge>;
    const role = roles[0];
    const variant = role.includes('Admin') ? 'default' : 'secondary';
    return <Badge variant={variant}>{role}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'success' : 'destructive'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add New User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="border p-2 rounded" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option>System Admin</option>
            <option>Company Admin</option>
            <option>Branch Admin</option>
            <option>Bus Conductor</option>
            <option>Station Attendant</option>
            <option>Garage Attendant</option>
            <option>Car Wash Attendant</option>
          </select>
          <select className="border p-2 rounded" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Users ({filteredUsers.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.roles?.map(r => r.name) || [])}</TableCell>
                  <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                  <TableCell>{new Date(user.createAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedUser(user);
                        setIsModalOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(user)}>
                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refetch={() => queryClient.invalidateQueries(['users'])}
      />
    </div>
  );
}
