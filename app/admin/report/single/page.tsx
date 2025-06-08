"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertCircle,
  MapPin,
  Navigation,
  Clock,
  User,
  Route,
  Building,
  ArrowRight,
  CheckCircle,
  XCircle,
  Timer,
  Map,
  Info,
  Target,
  Activity,
  Calendar as CalendarIcon,
  Search,
  Truck
} from 'lucide-react';

// Import your actual API functions
import { dashboardAPI, busAPI } from '@/lib/api';

// Enhanced Bus Park Status Component for single bus
const BusParkStatus = ({ assignment }) => {
  const hasReturned = assignment.return_park_info && assignment.schedule.return_time;
  const isInProgress = assignment.schedule.status === 'in_progress' || assignment.schedule.status === 'departed';
  const isCompleted = assignment.schedule.status === 'completed';
  const hasDepartureInfo = assignment.departure_park_info;
  const hasReturnInfo = assignment.return_park_info;
  
  return (
    <div className="space-y-3">
      {/* Departure Information */}
      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-green-800">Departure</h4>
            <Badge variant="outline" className="text-green-700 border-green-300">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(assignment.schedule.departure_time).toLocaleString()}
            </Badge>
          </div>
          
          {hasDepartureInfo ? (
            <>
              <p className="font-medium text-green-700">{assignment.departure_park_info.name}</p>
              <p className="text-sm text-green-600">{assignment.departure_park_info.location}</p>
              {assignment.departure_park_info.contact && (
                <p className="text-xs text-green-500 mt-1">📞 {assignment.departure_park_info.contact}</p>
              )}
            </>
          ) : (
            <>
              <p className="font-medium text-green-700">From: {assignment.route_info.start_location}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Bus park details not available
              </p>
            </>
          )}
        </div>
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>

      {/* Route Arrow */}
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-px bg-gray-300 w-8"></div>
          <ArrowRight className="w-4 h-4" />
          <div className="h-px bg-gray-300 w-8"></div>
        </div>
      </div>

      {/* Return/Destination Information */}
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
        hasReturned || (isCompleted && hasReturnInfo)
          ? 'bg-blue-50 border-blue-200' 
          : isInProgress 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            hasReturned || (isCompleted && hasReturnInfo)
              ? 'bg-blue-100' 
              : isInProgress 
                ? 'bg-orange-100' 
                : 'bg-gray-100'
          }`}>
            {hasReturned || (isCompleted && hasReturnInfo) ? (
              <MapPin className="w-4 h-4 text-blue-600" />
            ) : isInProgress ? (
              <Timer className="w-4 h-4 text-orange-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${
              hasReturned || (isCompleted && hasReturnInfo)
                ? 'text-blue-800' 
                : isInProgress 
                  ? 'text-orange-800' 
                  : 'text-gray-600'
            }`}>
              Return
            </h4>
            {hasReturned && (
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(assignment.schedule.return_time).toLocaleString()}
              </Badge>
            )}
          </div>
          
          {hasReturnInfo ? (
            <>
              <p className="font-medium text-blue-700">{assignment.return_park_info.name}</p>
              <p className="text-sm text-blue-600">{assignment.return_park_info.location}</p>
              {assignment.return_park_info.contact && (
                <p className="text-xs text-blue-500 mt-1">📞 {assignment.return_park_info.contact}</p>
              )}
            </>
          ) : isInProgress ? (
            <>
              <p className="font-medium text-orange-700">En route to: {assignment.route_info.end_location}</p>
              <p className="text-sm text-orange-600">Trip in progress</p>
            </>
          ) : (
            <>
              <p className="font-medium text-gray-600">Expected: {assignment.route_info.end_location}</p>
              <p className="text-sm text-gray-500">Status: {assignment.schedule.status}</p>
            </>
          )}
        </div>
        
        {hasReturned || (isCompleted && hasReturnInfo) ? (
          <CheckCircle className="w-5 h-5 text-blue-600" />
        ) : isInProgress ? (
          <Navigation className="w-5 h-5 text-orange-600" />
        ) : (
          <Timer className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Trip Summary */}
      {hasReturned && assignment.schedule.return_time && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-center">
          <p className="text-sm text-gray-600">
            <strong>Trip Duration:</strong> {
              Math.round((new Date(assignment.schedule.return_time) - new Date(assignment.schedule.departure_time)) / (1000 * 60 * 60))
            } hours
          </p>
        </div>
      )}
    </div>
  );
};

export default function SingleBusReport() {
  const [selectedBusId, setSelectedBusId] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [reportGenerated, setReportGenerated] = useState(false);

  // Query for all buses to populate dropdown
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busAPI.getAll(),
  });

  // Query for single bus report
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['single-bus-report', selectedBusId, dateRange.start_date, dateRange.end_date],
    queryFn: () => dashboardAPI.getBusExpenseReport(dateRange.start_date, dateRange.end_date, selectedBusId),
    enabled: reportGenerated && !!selectedBusId && !!dateRange.start_date && !!dateRange.end_date,
  });

  const buses = busesData?.data || [];
  const report = reportData?.data || {};
  const summary = report.summary || {};
  const assignments = report.assignments || [];
  const selectedBus = buses.find(bus => bus.id === selectedBusId);

  const handleGenerateReport = () => {
    if (selectedBusId && dateRange.start_date && dateRange.end_date) {
      setReportGenerated(true);
      refetch();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-FR', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
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
    a.download = `single-bus-report-${selectedBus?.plate_number || selectedBusId}-${dateRange.start_date}-to-${dateRange.end_date}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadDetailedReport = (format) => {
    const reportContent = generateDetailedReportContent(format);
    const blob = new Blob([reportContent], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed-bus-report-${selectedBus?.plate_number || selectedBusId}-${dateRange.start_date}-to-${dateRange.end_date}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDetailedReportContent = (format) => {
    if (format === 'csv') {
      let csv = 'Assignment ID,Bus,Driver,Conductor,Route,Departure Date,Departure Park,Return Date,Return Park,Status,Record Type,Record ID,Attendant Name,Details,Cost,Timestamp,Additional Info\n';
      
      assignments.forEach(assignment => {
        const baseInfo = [
          assignment.assignment_id,
          selectedBus?.plate_number || 'N/A',
          assignment.driver_info.name,
          assignment.conductor_info.name,
          assignment.route_info.name,
          new Date(assignment.schedule.departure_time).toLocaleDateString(),
          `"${assignment.departure_park_info?.name || assignment.route_info.start_location}"`,
          assignment.schedule.return_time ? new Date(assignment.schedule.return_time).toLocaleDateString() : 'N/A',
          `"${assignment.return_park_info?.name || assignment.route_info.end_location}"`,
          assignment.schedule.status
        ];

        // Add fuel records
        if (assignment.expenses.fuel.records.length > 0) {
          assignment.expenses.fuel.records.forEach(fuel => {
            csv += baseInfo.join(',') + ',';
            csv += `FUEL,${fuel.id},"${fuel.attendant_name}","Station: ${fuel.fuel_station_name || 'N/A'} | ${fuel.liters}L @ ${formatCurrency(fuel.price_per_liter)}/L",${fuel.amount},${fuel.timestamp},"Receipt: ${fuel.receipt_number || 'N/A'}"\n`;
          });
        }

        // Add maintenance records
        if (assignment.expenses.maintenance.records.length > 0) {
          assignment.expenses.maintenance.records.forEach(maint => {
            csv += baseInfo.join(',') + ',';
            csv += `MAINTENANCE,${maint.id},"${maint.attendant_name}","${maint.maintenance_type}",${maint.cost},${maint.timestamp},"${maint.description || 'N/A'}"\n`;
          });
        }

        // Add wash records
        if (assignment.expenses.wash.records.length > 0) {
          assignment.expenses.wash.records.forEach(wash => {
            csv += baseInfo.join(',') + ',';
            csv += `WASH,${wash.id},"${wash.attendant_name}","Car Wash Service",${wash.cost},${wash.timestamp},"${wash.notes || 'N/A'}"\n`;
          });
        }

        // If no expense records, add a summary row
        if (assignment.expenses.fuel.records.length === 0 && 
            assignment.expenses.maintenance.records.length === 0 && 
            assignment.expenses.wash.records.length === 0) {
          csv += baseInfo.join(',') + ',';
          csv += `SUMMARY,N/A,"N/A","No expense records",${assignment.total_cost},"${assignment.schedule.departure_time}","${assignment.notes || 'N/A'}"\n`;
        }
      });
      
      return csv;
    } else {
      return JSON.stringify({
        bus_info: selectedBus,
        report_period: report.date_range,
        summary: summary,
        detailed_records: assignments.flatMap(assignment => [
          ...assignment.expenses.fuel.records.map(record => ({
            assignment_id: assignment.assignment_id,
            type: 'fuel',
            record: record,
            assignment_info: {
              bus: assignment.bus_info,
              driver: assignment.driver_info,
              conductor: assignment.conductor_info,
              route: assignment.route_info,
              schedule: assignment.schedule,
              parks: {
                departure: assignment.departure_park_info,
                return: assignment.return_park_info
              }
            }
          })),
          ...assignment.expenses.maintenance.records.map(record => ({
            assignment_id: assignment.assignment_id,
            type: 'maintenance',
            record: record,
            assignment_info: {
              bus: assignment.bus_info,
              driver: assignment.driver_info,
              conductor: assignment.conductor_info,
              route: assignment.route_info,
              schedule: assignment.schedule,
              parks: {
                departure: assignment.departure_park_info,
                return: assignment.return_park_info
              }
            }
          })),
          ...assignment.expenses.wash.records.map(record => ({
            assignment_id: assignment.assignment_id,
            type: 'wash',
            record: record,
            assignment_info: {
              bus: assignment.bus_info,
              driver: assignment.driver_info,
              conductor: assignment.conductor_info,
              route: assignment.route_info,
              schedule: assignment.schedule,
              parks: {
                departure: assignment.departure_park_info,
                return: assignment.return_park_info
              }
            }
          }))
        ])
      }, null, 2);
    }
  };

  const generateReportContent = (format) => {
    if (format === 'csv') {
      let csv = 'Assignment ID,Bus,Driver,Conductor,Route,Departure Date,Departure Park,Return Date,Return Park,Status,Total Cost,Fuel Total,Maintenance Total,Wash Total,Notes,Fuel Details,Maintenance Details,Wash Details\n';
      assignments.forEach(assignment => {
        // Basic assignment info
        csv += `${assignment.assignment_id},`;
        csv += `${selectedBus?.plate_number || 'N/A'},`;
        csv += `${assignment.driver_info.name},`;
        csv += `${assignment.conductor_info.name},`;
        csv += `${assignment.route_info.name},`;
        csv += `${new Date(assignment.schedule.departure_time).toLocaleDateString()},`;
        csv += `"${assignment.departure_park_info?.name || assignment.route_info.start_location}",`;
        csv += `${assignment.schedule.return_time ? new Date(assignment.schedule.return_time).toLocaleDateString() : 'N/A'},`;
        csv += `"${assignment.return_park_info?.name || assignment.route_info.end_location}",`;
        csv += `${assignment.schedule.status},`;
        csv += `${assignment.total_cost},`;
        csv += `${assignment.expenses.fuel.total_cost},`;
        csv += `${assignment.expenses.maintenance.total_cost},`;
        csv += `${assignment.expenses.wash.total_cost},`;
        csv += `"${assignment.notes}",`;
        
        // Detailed Fuel Records
        let fuelDetails = '';
        if (assignment.expenses.fuel.records.length > 0) {
          fuelDetails = assignment.expenses.fuel.records.map(fuel => 
            `Station: ${fuel.fuel_station_name || 'N/A'} | Attendant: ${fuel.attendant_name} | Liters: ${fuel.liters}L | Price/L: ${fuel.price_per_liter} | Total: ${fuel.amount} | Receipt: ${fuel.receipt_number || 'N/A'}`
          ).join(' || ');
        } else {
          fuelDetails = 'No fuel records';
        }
        csv += `"${fuelDetails}",`;
        
        // Detailed Maintenance Records
        let maintenanceDetails = '';
        if (assignment.expenses.maintenance.records.length > 0) {
          maintenanceDetails = assignment.expenses.maintenance.records.map(maint => 
            `Type: ${maint.maintenance_type} | Attendant: ${maint.attendant_name} | Cost: ${maint.cost} | Description: ${maint.description || 'N/A'} | Date: ${new Date(maint.timestamp).toLocaleDateString()}`
          ).join(' || ');
        } else {
          maintenanceDetails = 'No maintenance records';
        }
        csv += `"${maintenanceDetails}",`;
        
        // Detailed Wash Records
        let washDetails = '';
        if (assignment.expenses.wash.records.length > 0) {
          washDetails = assignment.expenses.wash.records.map(wash => 
            `Attendant: ${wash.attendant_name} | Cost: ${wash.cost} | Notes: ${wash.notes || 'N/A'} | Date: ${new Date(wash.timestamp).toLocaleDateString()}`
          ).join(' || ');
        } else {
          washDetails = 'No wash records';
        }
        csv += `"${washDetails}"\n`;
      });
      return csv;
    } else {
      return JSON.stringify({
        bus_info: selectedBus,
        report_period: report.date_range,
        summary: summary,
        assignments: assignments.map(assignment => ({
          ...assignment,
          detailed_expenses: {
            fuel_records: assignment.expenses.fuel.records,
            maintenance_records: assignment.expenses.maintenance.records,
            wash_records: assignment.expenses.wash.records
          }
        }))
      }, null, 2);
    }
  };

  // Calculate additional metrics for single bus
  const calculateBusMetrics = () => {
    if (!assignments.length) return {};

    const completedTrips = assignments.filter(a => a.schedule.status === 'completed').length;
    const totalTrips = assignments.length;
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

    const totalDistance = assignments.reduce((sum, assignment) => {
      // This would need distance data from your backend
      return sum + (assignment.distance || 0);
    }, 0);

    const fuelEfficiency = summary.total_fuel_liters > 0 && totalDistance > 0 
      ? totalDistance / summary.total_fuel_liters 
      : 0;

    const routesUsed = [...new Set(assignments.map(a => a.route_info.name))];
    const driversUsed = [...new Set(assignments.map(a => a.driver_info.name))];

    return {
      completionRate,
      totalDistance,
      fuelEfficiency,
      routesUsed,
      driversUsed,
      completedTrips,
      totalTrips
    };
  };

  const metrics = calculateBusMetrics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-blue-600" />
            Single Bus Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed performance and expense analysis for individual bus
          </p>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="bus_select">Select Bus</Label>
              {busesLoading ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading buses...</span>
                </div>
              ) : (
                <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          <span className="font-medium">{bus.plate_number}</span>
                          <span className="text-muted-foreground">({bus.model})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
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
              <Label className="opacity-0">Action</Label>
              <Button 
                onClick={handleGenerateReport}
                disabled={!selectedBusId || !dateRange.start_date || !dateRange.end_date || reportLoading}
                className="w-full flex items-center gap-2"
              >
                {reportLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Generate Report
              </Button>
            </div>
          </div>
          
          {/* Download buttons */}
          {reportGenerated && !reportLoading && !isError && selectedBus && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Summary Report</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadReport('csv')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Summary CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadReport('json')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Summary JSON
                  </Button>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-16" />
              
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Detailed Report</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadDetailedReport('csv')}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4" />
                    Detailed CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadDetailedReport('json')}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4" />
                    Detailed JSON
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {reportLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating bus report...</p>
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

      {/* Report Results */}
      {reportGenerated && !reportLoading && !isError && selectedBus && report.date_range && (
        <>
          {/* Bus Information Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">{selectedBus.plate_number}</h2>
                  <p className="text-blue-700">{selectedBus.model} • Capacity: {selectedBus.capacity} passengers</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    Status: {selectedBus.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    Report Period: {new Date(report.date_range.start_date).toLocaleDateString()} - {new Date(report.date_range.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    {summary.total_assignments} Total Assignments
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.grand_total)}</p>
                    <p className="text-xs text-muted-foreground">Avg: {formatCurrency(summary.average_cost_per_assignment)}/trip</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trip Completion</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.completionRate?.toFixed(1) || 0}%</p>
                    <p className="text-xs text-muted-foreground">{metrics.completedTrips || 0} of {metrics.totalTrips || 0} trips</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Consumption</p>
                    <p className="text-2xl font-bold text-orange-600">{summary.total_fuel_liters?.toFixed(1) || 0}L</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(summary.total_fuel_cost)} total</p>
                  </div>
                  <Fuel className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Routes Covered</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.routesUsed?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">{metrics.driversUsed?.length || 0} different drivers</p>
                  </div>
                  <Route className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense Breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-orange-600" />
                    Fuel Expenses
                  </h3>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(summary.total_fuel_cost)}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Liters:</span>
                    <span>{summary.total_fuel_liters?.toFixed(1) || 0}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Price:</span>
                    <span>{summary.average_fuel_price > 0 ? formatCurrency(summary.average_fuel_price) + '/L' : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-purple-600" />
                    Maintenance
                  </h3>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(summary.total_maintenance_cost)}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Records:</span>
                    <span>{assignments.reduce((sum, a) => sum + a.expenses.maintenance.records.length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg per Trip:</span>
                    <span>{summary.total_assignments > 0 ? formatCurrency(summary.total_maintenance_cost / summary.total_assignments) : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    Car Wash
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(summary.total_wash_cost)}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Records:</span>
                    <span>{assignments.reduce((sum, a) => sum + a.expenses.wash.records.length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg per Wash:</span>
                    <span>
                      {assignments.reduce((sum, a) => sum + a.expenses.wash.records.length, 0) > 0 
                        ? formatCurrency(summary.total_wash_cost / assignments.reduce((sum, a) => sum + a.expenses.wash.records.length, 0))
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Routes and Drivers Summary */}
          {(metrics.routesUsed?.length > 0 || metrics.driversUsed?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Routes Used ({metrics.routesUsed?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.routesUsed?.map((route, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{route}</span>
                        <Badge variant="outline">
                          {assignments.filter(a => a.route_info.name === route).length} trips
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Drivers Used ({metrics.driversUsed?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.driversUsed?.map((driver, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{driver}</span>
                        <Badge variant="outline">
                          {assignments.filter(a => a.driver_info.name === driver).length} trips
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assignment Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                Assignment Timeline
                {assignments.length === 0 && (
                  <Badge variant="outline" className="text-yellow-700 bg-yellow-100">
                    <Info className="w-3 h-3 mr-1" />
                    No assignments in this period
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No assignments found</p>
                  <p className="text-sm text-muted-foreground">
                    This bus had no assignments during the selected period.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment, index) => (
                    <Card key={assignment.assignment_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        {/* Assignment Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{assignment.route_info.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(assignment.schedule.departure_time).toLocaleDateString()} • 
                                Driver: {assignment.driver_info.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                              assignment.schedule.status === 'completed' ? 'text-green-700 bg-green-100' :
                              assignment.schedule.status === 'in_progress' ? 'text-orange-700 bg-orange-100' :
                              assignment.schedule.status === 'assigned' ? 'text-blue-700 bg-blue-100' :
                              'text-gray-700 bg-gray-100'
                            }>
                              {assignment.schedule.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {assignment.schedule.status === 'in_progress' && <Navigation className="w-3 h-3 mr-1" />}
                              {assignment.schedule.status === 'assigned' && <Clock className="w-3 h-3 mr-1" />}
                              {assignment.schedule.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="font-bold text-lg text-red-600">
                              {formatCurrency(assignment.total_cost)}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          {/* Left: Trip Details */}
                          <div className="space-y-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h5 className="font-medium mb-2 flex items-center gap-2">
                                <Route className="w-4 h-4" />
                                Trip Details
                              </h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Conductor:</span>
                                  <span>{assignment.conductor_info.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Departure:</span>
                                  <span>{new Date(assignment.schedule.departure_time).toLocaleString()}</span>
                                </div>
                                {assignment.schedule.return_time && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Return:</span>
                                    <span>{new Date(assignment.schedule.return_time).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expense Breakdown */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h5 className="font-medium mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Expenses
                              </h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center gap-1">
                                    <Fuel className="w-3 h-3 text-orange-600" />
                                    Fuel {assignment.expenses.fuel.total_liters > 0 && `(${assignment.expenses.fuel.total_liters}L)`}
                                  </span>
                                  <span className="font-medium text-orange-600">
                                    {formatCurrency(assignment.expenses.fuel.total_cost)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center gap-1">
                                    <Wrench className="w-3 h-3 text-purple-600" />
                                    Maintenance ({assignment.expenses.maintenance.records.length})
                                  </span>
                                  <span className="font-medium text-purple-600">
                                    {formatCurrency(assignment.expenses.maintenance.total_cost)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center gap-1">
                                    <Droplets className="w-3 h-3 text-blue-600" />
                                    Car Wash ({assignment.expenses.wash.records.length})
                                  </span>
                                  <span className="font-medium text-blue-600">
                                    {formatCurrency(assignment.expenses.wash.total_cost)}
                                  </span>
                                </div>
                                <Separator className="my-1" />
                                <div className="flex justify-between items-center font-bold">
                                  <span>Total:</span>
                                  <span className="text-red-600">{formatCurrency(assignment.total_cost)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Bus Park Tracking */}
                          <div className="bg-gradient-to-br from-blue-50 to-green-50 p-3 rounded-lg">
                            <h5 className="font-medium mb-3 flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Bus Park Tracking
                            </h5>
                            <BusParkStatus assignment={assignment} />
                          </div>
                        </div>

                        {/* Detailed Records (Expandable) */}
                        {(assignment.expenses.fuel.records.length > 0 || 
                          assignment.expenses.maintenance.records.length > 0 || 
                          assignment.expenses.wash.records.length > 0) && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 p-2 rounded bg-blue-50">
                              <Eye className="w-4 h-4" />
                              View Detailed Records ({
                                assignment.expenses.fuel.records.length + 
                                assignment.expenses.maintenance.records.length + 
                                assignment.expenses.wash.records.length
                              } total)
                            </summary>
                            <div className="mt-3 space-y-3">
                              {/* Fuel Records */}
                              {assignment.expenses.fuel.records.length > 0 && (
                                <div>
                                  <h6 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                                    <Fuel className="w-4 h-4" />
                                    Fuel Records ({assignment.expenses.fuel.records.length})
                                  </h6>
                                  <div className="space-y-2">
                                    {assignment.expenses.fuel.records.map((fuel, fuelIndex) => (
                                      <div key={fuelIndex} className="bg-orange-50 p-3 rounded border-orange-200">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Attendant</span>
                                            <span className="font-medium">{fuel.attendant_name}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Quantity</span>
                                            <span className="font-medium">{fuel.liters}L</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Price/L</span>
                                            <span className="font-medium">{formatCurrency(fuel.price_per_liter)}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Total</span>
                                            <span className="font-medium text-orange-600">{formatCurrency(fuel.amount)}</span>
                                          </div>
                                        </div>
                                        {fuel.receipt_number && fuel.receipt_number !== 'N/A' && (
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            Receipt: {fuel.receipt_number}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Maintenance Records */}
                              {assignment.expenses.maintenance.records.length > 0 && (
                                <div>
                                  <h6 className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" />
                                    Maintenance Records ({assignment.expenses.maintenance.records.length})
                                  </h6>
                                  <div className="space-y-2">
                                    {assignment.expenses.maintenance.records.map((maintenance, maintIndex) => (
                                      <div key={maintIndex} className="bg-purple-50 p-3 rounded border-purple-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Type</span>
                                            <span className="font-medium">{maintenance.maintenance_type}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Attendant</span>
                                            <span className="font-medium">{maintenance.attendant_name}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Cost</span>
                                            <span className="font-medium text-purple-600">{formatCurrency(maintenance.cost)}</span>
                                          </div>
                                        </div>
                                        {maintenance.description && (
                                          <div className="mt-1">
                                            <span className="text-muted-foreground block text-xs">Description</span>
                                            <span className="text-sm">{maintenance.description}</span>
                                          </div>
                                        )}
                                        <div className="mt-1 text-xs text-muted-foreground">
                                          {new Date(maintenance.timestamp).toLocaleString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Wash Records */}
                              {assignment.expenses.wash.records.length > 0 && (
                                <div>
                                  <h6 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                                    <Droplets className="w-4 h-4" />
                                    Car Wash Records ({assignment.expenses.wash.records.length})
                                  </h6>
                                  <div className="space-y-2">
                                    {assignment.expenses.wash.records.map((wash, washIndex) => (
                                      <div key={washIndex} className="bg-blue-50 p-3 rounded border-blue-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Attendant</span>
                                            <span className="font-medium">{wash.attendant_name}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Cost</span>
                                            <span className="font-medium text-blue-600">{formatCurrency(wash.cost)}</span>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground block text-xs">Date</span>
                                            <span className="font-medium">{new Date(wash.timestamp).toLocaleString()}</span>
                                          </div>
                                        </div>
                                        {wash.notes && wash.notes !== 'N/A' && (
                                          <div className="mt-1">
                                            <span className="text-muted-foreground block text-xs">Notes</span>
                                            <span className="text-sm">{wash.notes}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        )}

                        {/* Assignment Notes */}
                        {assignment.notes && assignment.notes !== 'N/A' && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <h6 className="font-medium text-gray-700 mb-1">Notes</h6>
                            <p className="text-sm text-gray-600">{assignment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Footer */}
          <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Report Summary</h3>
                <p className="text-muted-foreground mb-4">
                  Bus {selectedBus.plate_number} completed {metrics.completedTrips || 0} out of {metrics.totalTrips || 0} assignments 
                  with a total expense of {formatCurrency(summary.grand_total)} during the selected period.
                </p>
                
                {summary.grand_total > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-muted-foreground">Most Expensive Category</p>
                      <p className="font-bold text-lg">
                        {summary.total_fuel_cost >= summary.total_maintenance_cost && summary.total_fuel_cost >= summary.total_wash_cost 
                          ? 'Fuel' 
                          : summary.total_maintenance_cost >= summary.total_wash_cost 
                            ? 'Maintenance' 
                            : 'Car Wash'
                        }
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-muted-foreground">Average per Assignment</p>
                      <p className="font-bold text-lg">{formatCurrency(summary.average_cost_per_assignment)}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-muted-foreground">Performance Rating</p>
                      <p className="font-bold text-lg">
                        {metrics.completionRate >= 90 ? '🟢 Excellent' : 
                         metrics.completionRate >= 75 ? '🟡 Good' : 
                         metrics.completionRate >= 50 ? '🟠 Fair' : '🔴 Poor'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}