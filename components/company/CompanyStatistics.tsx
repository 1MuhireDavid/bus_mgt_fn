'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/ui/StatsCard";
import { 
  Users, 
  Bus, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Eye,
  Activity
} from 'lucide-react';
import { companyAPI } from '@/lib/api';

interface Company {
  id: string;
  name: string;
  tin: string;
  is_active: boolean;
}

interface CompanyStatisticsProps {
  company: Company;
}

interface CompanyStats {
  company_info: {
    name: string;
    tin: string;
    subscription_plan: string;
    is_active: boolean;
  };
  usage_stats: {
    total_users: number;
    active_users: number;
    total_buses: number;
    active_buses: number;
    total_stock_items: number;
    low_stock_items: number;
  };
  limits: {
    max_users: number;
    max_buses: number;
    can_add_users: boolean;
    can_add_buses: boolean;
  };
}

export function CompanyStatistics({ company }: CompanyStatisticsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch company statistics
  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['company-statistics', company.id],
    queryFn: () => companyAPI.getStatistics(company.id),
    enabled: isOpen, // Only fetch when dialog is open
  });

  const stats: CompanyStats | null = statsData?.data?.data || null;

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="w-4 h-4 mr-1" />
          Statistics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Company Statistics - {company.name}
          </DialogTitle>
          <DialogDescription>
            Detailed usage statistics and limits for {company.name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading statistics...
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Error loading statistics</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{stats.company_info.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TIN</p>
                    <p className="font-medium">{stats.company_info.tin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription</p>
                    <Badge variant="outline">{stats.company_info.subscription_plan || 'Basic'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={stats.company_info.is_active ? "default" : "secondary"}>
                      {stats.company_info.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Total Users"
                value={stats.usage_stats.total_users}
                icon={Users}
                description={`${stats.usage_stats.active_users} active`}
              />
              <StatsCard
                title="Total Buses"
                value={stats.usage_stats.total_buses}
                icon={Bus}
                description={`${stats.usage_stats.active_buses} active`}
              />
              <StatsCard
                title="Stock Items"
                value={stats.usage_stats.total_stock_items}
                icon={Package}
                description={`${stats.usage_stats.low_stock_items} low stock`}
              />
            </div>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usage Limits & Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Users Limit */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Users</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(stats.usage_stats.total_users, stats.limits.max_users))}`}>
                      {stats.usage_stats.total_users} / {stats.limits.max_users}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(stats.usage_stats.total_users, stats.limits.max_users)}
                    className="h-2"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getUsagePercentage(stats.usage_stats.total_users, stats.limits.max_users).toFixed(1)}% used
                    </span>
                    <div className="flex items-center gap-1">
                      {stats.limits.can_add_users ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {stats.limits.can_add_users ? 'Can add more' : 'Limit reached'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buses Limit */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Buses</span>
                    <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(stats.usage_stats.total_buses, stats.limits.max_buses))}`}>
                      {stats.usage_stats.total_buses} / {stats.limits.max_buses}
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(stats.usage_stats.total_buses, stats.limits.max_buses)}
                    className="h-2"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getUsagePercentage(stats.usage_stats.total_buses, stats.limits.max_buses).toFixed(1)}% used
                    </span>
                    <div className="flex items-center gap-1">
                      {stats.limits.can_add_buses ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {stats.limits.can_add_buses ? 'Can add more' : 'Limit reached'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {(stats.usage_stats.low_stock_items > 0 || !stats.limits.can_add_users || !stats.limits.can_add_buses) && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-5 h-5" />
                    Alerts & Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.usage_stats.low_stock_items > 0 && (
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">
                          {stats.usage_stats.low_stock_items} stock items are running low
                        </span>
                      </div>
                    )}
                    {!stats.limits.can_add_users && (
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          User limit reached ({stats.limits.max_users} users)
                        </span>
                      </div>
                    )}
                    {!stats.limits.can_add_buses && (
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Bus className="w-4 h-4" />
                        <span className="text-sm">
                          Bus limit reached ({stats.limits.max_buses} buses)
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>No statistics available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}