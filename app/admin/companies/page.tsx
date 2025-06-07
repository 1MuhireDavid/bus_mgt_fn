'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "react-toastify";
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { companyAPI } from '@/lib/api';

interface Company {
  id: string;
  name: string;
  tin: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

interface CompanyFormData {
  name: string;
  tin: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export default function CompanyManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    tin: '',
    email: '',
    phone: '',
    address: '',
    is_active: true
  });

  // Fetch companies
  const { data: companiesData, isLoading, error, refetch } = useQuery({
    queryKey: ['companies', searchTerm, statusFilter],
    queryFn: () => companyAPI.getAll(),
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyFormData) => companyAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Company created successfully!');
    },
    onError: (error: any) => {
      console.error('Create company error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to create company';
      toast.error(errorMessage);
    }
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyFormData> }) =>
      companyAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      resetForm();
      toast.success('Company updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update company error:', error);
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data?.errors || {}).flat().join(', ') ||
                          'Failed to update company';
      toast.error(errorMessage);
    }
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => companyAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setCompanyToDelete(null);
      toast.success('Company deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete company error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete company';
      toast.error(errorMessage);
    }
  });

  const companies = companiesData?.data?.data || companiesData?.data || [];

  // Filter companies
  const filteredCompanies = companies.filter((company: Company) => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.tin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && company.is_active) ||
      (statusFilter === 'inactive' && !company.is_active);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c: Company) => c.is_active).length;
  const inactiveCompanies = totalCompanies - activeCompanies;
  const recentCompanies = companies.filter((c: Company) => {
    const createdDate = new Date(c.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return createdDate >= weekAgo;
  }).length;

  const resetForm = () => {
    setFormData({
      name: '',
      tin: '',
      email: '',
      phone: '',
      address: '',
      is_active: true
    });
  };

  const handleCreateCompany = () => {
    if (!formData.name || !formData.tin || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    createCompanyMutation.mutate(formData);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      tin: company.tin,
      email: company.email,
      phone: company.phone || '',
      address: company.address || '',
      is_active: company.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = () => {
    if (!selectedCompany) return;

    if (!formData.name || !formData.tin || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateCompanyMutation.mutate({
      id: selectedCompany.id,
      data: formData
    });
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsViewDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteCompanyMutation.mutate(companyToDelete.id);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  // Check if user can manage companies (only system admin)
  const canManageCompanies = user?.is_superuser;

  if (!canManageCompanies) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only system administrators can manage companies.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            Company Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage companies in the system
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Companies"
          value={totalCompanies}
          icon={Building2}
          description="All registered companies"
        />
        <StatsCard
          title="Active Companies"
          value={activeCompanies}
          icon={CheckCircle}
          description="Currently active"
        />
        <StatsCard
          title="Inactive Companies"
          value={inactiveCompanies}
          icon={AlertCircle}
          description="Currently inactive"
        />
        <StatsCard
          title="Recent Additions"
          value={recentCompanies}
          icon={TrendingUp}
          description="Added this week"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, TIN, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="flex-1"
                >
                  Clear Filters
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Companies ({filteredCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading companies...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Error loading companies</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No companies found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {companies.length === 0 
                  ? "Start by creating your first company."
                  : "Try adjusting your search or filters."
                }
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map((company: Company) => (
                <Card key={company.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1">
                        {/* Company Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Company Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Name:</span> {company.name}</p>
                            <p><span className="text-muted-foreground">TIN:</span> {company.tin}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Status:</span>
                              {getStatusBadge(company.is_active)}
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact Information
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {company.email}
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {company.phone || 'N/A'}
                            </p>
                            {company.address && (
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {company.address}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div>
                          <h4 className="font-semibold mb-2">Created</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Date:</span> {new Date(company.created_at).toLocaleDateString()}</p>
                            <p><span className="text-muted-foreground">Time:</span> {new Date(company.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCompany(company)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCompany(company)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Company Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter company name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin">TIN *</Label>
                <Input
                  id="tin"
                  placeholder="Enter TIN number"
                  value={formData.tin}
                  onChange={(e) => setFormData(prev => ({...prev, tin: e.target.value}))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter company address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_create"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active_create">Company is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={createCompanyMutation.isPending}
            >
              {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Company Name *</Label>
                <Input
                  id="edit_name"
                  placeholder="Enter company name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_tin">TIN *</Label>
                <Input
                  id="edit_tin"
                  placeholder="Enter TIN number"
                  value={formData.tin}
                  onChange={(e) => setFormData(prev => ({...prev, tin: e.target.value}))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                placeholder="Enter company address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active_edit">Company is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCompany}
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending ? 'Updating...' : 'Update Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Company Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium">Company Name</Label>
                  <p className="text-sm mt-1">{selectedCompany.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">TIN</Label>
                  <p className="text-sm mt-1">{selectedCompany.tin}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm mt-1">{selectedCompany.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm mt-1">{selectedCompany.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCompany.is_active)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created Date</Label>
                  <p className="text-sm mt-1">{new Date(selectedCompany.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedCompany.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedCompany.address}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedCompany) {
                handleEditCompany(selectedCompany);
              }
            }}>
              <Edit className="w-4 h-4 mr-1" />
              Edit Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!companyToDelete} onOpenChange={() => setCompanyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{companyToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteCompanyMutation.isPending}
            >
              {deleteCompanyMutation.isPending ? 'Deleting...' : 'Delete Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}