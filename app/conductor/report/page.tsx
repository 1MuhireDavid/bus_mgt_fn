'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  Bus,
  Fuel,
  Wrench,
  Droplets,
  BarChart3,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';

export default function BusExpenseReport() {
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [selectedBusId, setSelectedBusId] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);

  // Query for expense report
  const { 
    data: reportData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['bus-expense-report', dateRange.start_date, dateRange.end_date, selectedBusId],
    queryFn: () => dashboardAPI.getBusExpenseReport(dateRange.start_date, dateRange.end_date, selectedBusId),
    enabled: reportGenerated && !!dateRange.start_date && !!dateRange.end_date,
  });

  const report = reportData?.data || {};
  const summary = report.summary || {};
  const assignments = report.assignments || [];

  const handleGenerateReport = () => {
    if (dateRange.start_date && dateRange.end_date) {
      setReportGenerated(true);
      refetch();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount || 0);
  };

  const downloadReport = (format) => {
    const reportContent = generateReportContent(format);
    const blob = new Blob([reportContent], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bus-expense-report-${dateRange.start_date}-to-${dateRange.end_date}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportContent = (format) => {
    if (format === 'csv') {
      let csv = 'Assignment ID,Bus,Driver,Route,Departure Date,Fuel Cost,Maintenance Cost,Wash Cost,Total Cost\n';
      assignments.forEach(assignment => {
        csv += `${assignment.assignment_id},`;
        csv += `${assignment.bus_info.plate_number},`;
        csv += `${assignment.driver_info.name},`;
        csv += `${assignment.route_info.name},`;
        csv += `${new Date(assignment.schedule.departure_time).toLocaleDateString()},`;
        csv += `${assignment.expenses.fuel.total_cost},`;
        csv += `${assignment.expenses.maintenance.total_cost},`;
        csv += `${assignment.expenses.wash.total_cost},`;
        csv += `${assignment.total_cost}\n`;
      });
      return csv;
    } else {
      return JSON.stringify(report, null, 2);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Bus Expense Report
          </h1>
          <p className="text-muted-foreground mt-1">Generate detailed expense reports for your bus fleet</p>
        </div>
      </div>

      {/* Report Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({...prev, start_date: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({...prev, end_date: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bus_filter">Bus Filter (Optional)</Label>
              <Input
                id="bus_filter"
                placeholder="Enter Bus ID"
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleGenerateReport}
              disabled={!dateRange.start_date || !dateRange.end_date || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Generate Report
            </Button>
            {reportGenerated && !isLoading && !isError && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => downloadReport('csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadReport('json')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Generating expense report...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Failed to generate report: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Report Summary */}
      {reportGenerated && !isLoading && !isError && report.date_range && (
        <>
          {/* Date Range Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Report Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{new Date(report.date_range.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{new Date(report.date_range.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="font-medium">{summary.total_assignments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.grand_total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Costs</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_fuel_cost)}</p>
                  </div>
                  <Fuel className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.total_maintenance_cost)}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Car Wash</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_wash_cost)}</p>
                  </div>
                  <Droplets className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Cost/Assignment</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.average_cost_per_assignment)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fuel (Liters)</p>
                    <p className="text-xl font-bold">{summary.total_fuel_liters?.toFixed(2) || 0}L</p>
                  </div>
                  <Fuel className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Fuel Price</p>
                    <p className="text-xl font-bold">{formatCurrency(summary.average_fuel_price)}/L</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Assignment List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No assignments found</p>
                  <p className="text-sm text-muted-foreground">
                    No bus assignments found for the selected date range.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.assignment_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          {/* Bus & Driver Info */}
                          <div>
                            <h4 className="font-semibold mb-2">Bus & Driver</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Bus:</span> {assignment.bus_info.plate_number}</p>
                              <p><span className="text-muted-foreground">Driver:</span> {assignment.driver_info.name} - {assignment.driver_info.phone_number}</p>
                              <p><span className="text-muted-foreground">Conductor:</span> {assignment.conductor_info.name}</p>
                            </div>
                          </div>

                          {/* Route & Schedule */}
                          <div>
                            <h4 className="font-semibold mb-2">Route & Schedule</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Route:</span> {assignment.route_info.name}</p>
                              <p><span className="text-muted-foreground">Departure:</span> {new Date(assignment.schedule.departure_time).toLocaleString()}</p>
                              <div className="mt-1">{getStatusBadge(assignment.schedule.status)}</div>
                            </div>
                          </div>

                          {/* Expense Breakdown */}
                          <div>
                            <h4 className="font-semibold mb-2">Expenses</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Fuel:</span>
                                <span className="text-orange-600 font-medium">{formatCurrency(assignment.expenses.fuel.total_cost)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Maintenance:</span>
                                <span className="text-purple-600 font-medium">{formatCurrency(assignment.expenses.maintenance.total_cost)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Wash:</span>
                                <span className="text-blue-600 font-medium">{formatCurrency(assignment.expenses.wash.total_cost)}</span>
                              </div>
                              <Separator className="my-1" />
                              <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span className="text-red-600">{formatCurrency(assignment.total_cost)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Additional Details */}
                          <div>
                            <h4 className="font-semibold mb-2">Details</h4>
                            <div className="space-y-1 text-sm">
                              {assignment.expenses.fuel.total_liters > 0 && (
                                <p><span className="text-muted-foreground">Fuel:</span> {assignment.expenses.fuel.total_liters}L</p>
                              )}
                              <p><span className="text-muted-foreground">Fuel Records:</span> {assignment.expenses.fuel.records.length}</p>
                              <p><span className="text-muted-foreground">Maintenance:</span> {assignment.expenses.maintenance.records.length}</p>
                              <p><span className="text-muted-foreground">Wash Records:</span> {assignment.expenses.wash.records.length}</p>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Records Section (Expandable) */}
                        {(assignment.expenses.fuel.records.length > 0 || 
                          assignment.expenses.maintenance.records.length > 0 || 
                          assignment.expenses.wash.records.length > 0) && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                              View Detailed Records
                            </summary>
                            <div className="mt-3 space-y-3">
                              {/* Fuel Records */}
                              {assignment.expenses.fuel.records.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-orange-600 mb-2">Fuel Records</h5>
                                  <div className="space-y-2">
                                    {assignment.expenses.fuel.records.map((fuel, index) => (
                                      <div key={index} className="bg-orange-50 p-3 rounded text-sm">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                          <div><span className="text-muted-foreground">Attendant:</span> {fuel.attendant_name}</div>
                                          <div><span className="text-muted-foreground">Liters:</span> {fuel.liters}L</div>
                                          <div><span className="text-muted-foreground">Price/L:</span> {formatCurrency(fuel.price_per_liter)}</div>
                                          <div><span className="text-muted-foreground">Total:</span> {formatCurrency(fuel.amount)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Maintenance Records */}
                              {assignment.expenses.maintenance.records.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-purple-600 mb-2">Maintenance Records</h5>
                                  <div className="space-y-2">
                                    {assignment.expenses.maintenance.records.map((maintenance, index) => (
                                      <div key={index} className="bg-purple-50 p-3 rounded text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                          <div><span className="text-muted-foreground">Type:</span> {maintenance.maintenance_type}</div>
                                          <div><span className="text-muted-foreground">Attendant:</span> {maintenance.attendant_name}</div>
                                          <div><span className="text-muted-foreground">Cost:</span> {formatCurrency(maintenance.cost)}</div>
                                        </div>
                                        {maintenance.description && (
                                          <div className="mt-1"><span className="text-muted-foreground">Description:</span> {maintenance.description}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Wash Records */}
                              {assignment.expenses.wash.records.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-blue-600 mb-2">Car Wash Records</h5>
                                  <div className="space-y-2">
                                    {assignment.expenses.wash.records.map((wash, index) => (
                                      <div key={index} className="bg-blue-50 p-3 rounded text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                          <div><span className="text-muted-foreground">Attendant:</span> {wash.attendant_name}</div>
                                          <div><span className="text-muted-foreground">Cost:</span> {formatCurrency(wash.cost)}</div>
                                          <div><span className="text-muted-foreground">Date:</span> {new Date(wash.timestamp).toLocaleString()}</div>
                                        </div>
                                        {wash.notes && wash.notes !== 'N/A' && (
                                          <div className="mt-1"><span className="text-muted-foreground">Notes:</span> {wash.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}