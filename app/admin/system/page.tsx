'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { 
  Building2, 
  Users, 
  Bus, 
  TrendingUp,
  Calendar,
  RefreshCw,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  Crown
} from 'lucide-react';
import { useAuthStore } from "@/store/authStore";
import { systemAdminAPI, companyAPI } from '@/lib/api';

interface SystemStats {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_buses: number;
  total_assignments: number;
}

interface TopCompany {
  name: string;
  tin: string;
  user_count: number;
  bus_count: number;
  subscription_plan: string;
}

interface RecentCompany {
  name: string;
  tin: string;
  created_at: string;
  subscription_plan: string;
}

interface SystemOverview {
  total_stats: SystemStats;
  top_companies: TopCompany[];
  recent_companies: RecentCompany[];
  subscription_breakdown: Record<string, number>;
}

export default function SystemAdminDashboard() {
  const { user } = useAuthStore();
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  // Fetch system overview
  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['system-overview'],
    queryFn: () => systemAdminAPI.getSystemOverview(),
    enabled: user?.is_superuser,
  });

  // Fetch companies for dropdown
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyAPI.getAll(),
    enabled: user?.is_superuser,
  });

  // Fetch company analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['company-analytics', selectedCompany],
    queryFn: () => systemAdminAPI.getCompanyAnalytics(selectedCompany === 'all' ? undefined : selectedCompany),
    enabled: user?.is_superuser,
  });

  const overview: SystemOverview | null = overviewData?.data?.data || null;
  const companies = companiesData?.data?.data || companiesData?.data || [];
  const analytics = analyticsData?.data?.data || null;

  // Check if user is system admin
  if (!user?.is_superuser) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only system administrators can access this dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-600" />
            System Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            System-wide analytics and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchOverview()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Stats */}
      {overviewLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading system overview...
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Companies"
              value={overview.total_stats.total_companies}
              icon={Building2}
              description={`${overview.total_stats.active_companies} active`}
            />
            <StatsCard
              title="Total Users"
              value={overview.total_stats.total_users}
              icon={Users}
              description="Across all companies"
            />
            <StatsCard
              title="Total Buses"
              value={overview.total_stats.total_buses}
              icon={Bus}
              description="Fleet-wide"
            />
            <StatsCard
              title="Active Assignments"
              value={overview.total_stats.total_assignments}
              icon={Activity}
              description="Current assignments"
            />
            <StatsCard
              title="Growth"
              value={`+${Math.round(((overview.total_stats.active_companies / overview.total_stats.total_companies) * 100))}%`}
              icon={TrendingUp}
              description="Active companies"
            />
          </div>

          {/* Company Analytics Filter */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Company Analytics
                </CardTitle>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.tin})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Loading analytics...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-4">Subscription Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(overview.subscription_breakdown).map(([plan, count]) => (
                        <div key={plan} className="flex justify-between items-center">
                          <Badge variant="outline">{plan || 'Basic'}</Badge>
                          <span className="font-medium">{count} companies</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">System Health</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">All systems operational</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Database connections stable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">API endpoints responding</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Companies and Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Companies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Companies by Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview.top_companies.slice(0, 5).map((company, index) => (
                    <div key={company.tin} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">TIN: {company.tin}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{company.user_count} users</p>
                        <p className="text-sm text-muted-foreground">{company.bus_count} buses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Companies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recently Added Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview.recent_companies.slice(0, 5).map((company) => (
                    <div key={company.tin} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">TIN: {company.tin}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{company.subscription_plan || 'Basic'}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(company.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No system data available</p>
          <p className="text-muted-foreground mb-4">Unable to load system overview</p>
          <Button variant="outline" onClick={() => refetchOverview()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}