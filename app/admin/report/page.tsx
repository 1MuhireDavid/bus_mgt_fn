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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { busAPI, enhancedDashboardAPI } from '@/lib/api';

// Mock API functions - replace with your actual API
const mockAPI = {
  getBusExpenseReport: async (startDate, endDate, busId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response structure
    return {
      data: {
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        summary: {
          total_assignments: 2,
          total_fuel_cost: 103920.00,
          total_fuel_liters: 60.00,
          average_fuel_price: 1732.00,
          total_maintenance_cost: 0,
          total_wash_cost: 10000.00,
          grand_total: 113920.00,
          average_cost_per_assignment: 56960.00
        },
        assignments: [
          {
            assignment_id: "1cfcbcab-fb0d-44b7-9a47-5b10dc0b8987",
            bus_info: {
              id: "bus-1",
              plate_number: "RAB201B",
              model: "Toyota Hiace",
              capacity: 14
            },
            driver_info: {
              id: "driver-1",
              name: "Karekezi",
              license_number: "LIC001"
            },
            conductor_info: {
              id: "conductor-1",
              name: "John Doe"
            },
            route_info: {
              name: "Nyabugogo - Kimisagara",
              start_location: "Nyabugogo",
              end_location: "Kimisagara"
            },
            departure_park_info: {
              id: "park-1",
              name: "Nyabugogo Bus Park",
              location: "Nyabugogo, Kigali",
              contact: "+250788123456"
            },
            return_park_info: {
              id: "park-1",
              name: "Nyabugogo Bus Park",
              location: "Nyabugogo, Kigali",
              contact: "+250788123456"
            },
            schedule: {
              departure_time: "2025-06-11T08:00:00Z",
              return_time: "2025-06-11T18:00:00Z",
              actual_departure_time: "2025-06-11T08:05:00Z",
              status: "completed"
            },
            expenses: {
              fuel: {
                total_cost: 103920.00,
                total_liters: 60.00,
                records: [
                  {
                    id: "fuel-1",
                    attendant_name: "omar kagarama",
                    liters: 30.00,
                    price_per_liter: 1732.00,
                    amount: 51960.00,
                    timestamp: "2025-06-11T08:00:46Z",
                    receipt_number: "xxx",
                    fuel_station_name: "Sp Nyabugogo",
                    fuel_station_location: "Nyabugogo"
                  },
                  {
                    id: "fuel-2",
                    attendant_name: "omar kagarama",
                    liters: 30.00,
                    price_per_liter: 1732.00,
                    amount: 51960.00,
                    timestamp: "2025-06-11T09:25:27Z",
                    receipt_number: "xxx",
                    fuel_station_name: "Sp Nyabugogo",
                    fuel_station_location: "Nyabugogo"
                  }
                ]
              },
              maintenance: {
                total_cost: 0,
                records: []
              },
              wash: {
                total_cost: 0,
                records: []
              }
            },
            total_cost: 103920.00,
            notes: "Regular fuel for daily operations"
          },
          {
            assignment_id: "511a3d6a-aac5-45db-b8d1-57677cc887b0",
            bus_info: {
              id: "bus-1",
              plate_number: "RAB201B",
              model: "Toyota Hiace",
              capacity: 14
            },
            driver_info: {
              id: "driver-2",
              name: "Karake",
              license_number: "LIC002"
            },
            conductor_info: {
              id: "conductor-2",
              name: "Jane Smith"
            },
            route_info: {
              name: "Kimisagara - Nyabugogo",
              start_location: "Kimisagara",
              end_location: "Nyabugogo"
            },
            departure_park_info: {
              id: "park-2",
              name: "Kimisagara Park",
              location: "Kimisagara, Kigali",
              contact: "+250788654321"
            },
            return_park_info: {
              id: "park-1",
              name: "Nyabugogo Bus Park",
              location: "Nyabugogo, Kigali",
              contact: "+250788123456"
            },
            schedule: {
              departure_time: "2025-06-11T14:00:00Z",
              return_time: "2025-06-11T20:00:00Z",
              actual_departure_time: "2025-06-11T14:10:00Z",
              status: "completed"
            },
            expenses: {
              fuel: {
                total_cost: 0,
                total_liters: 0,
                records: []
              },
              maintenance: {
                total_cost: 0,
                records: []
              },
              wash: {
                total_cost: 10000.00,
                records: [
                  {
                    id: "wash-1",
                    attendant_name: "emma ntore",
                    cost: 10000.00,
                    timestamp: "2025-06-11T09:04:19Z",
                    car_wash_station_name: "Car wash",
                    car_wash_station_location: "Nyabugogo",
                    service_type: "interior_only",
                    service_type_display: "Interior Only",
                    notes: ""
                  }
                ]
              }
            },
            total_cost: 10000.00,
            notes: "N/A"
          }
        ]
      }
    };
  },
  getBuses: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: [
        {
          id: "bus-1",
          plate_number: "RAB201B",
          model: "Toyota Hiace",
          capacity: 14,
          status: "active"
        },
        {
          id: "bus-2",
          plate_number: "RAB202C",
          model: "Toyota Coaster",
          capacity: 29,
          status: "active"
        },
        {
          id: "bus-3",
          plate_number: "RAB203D",
          model: "Mitsubishi Rosa",
          capacity: 22,
          status: "maintenance"
        }
      ]
    };
  }
};

// Enhanced Bus Park Status Component
const BusParkStatus = ({ assignment }) => {
  const hasReturned = assignment.return_park_info && assignment.schedule.return_time;
  const isInProgress = assignment.schedule.status === 'in_progress' || assignment.schedule.status === 'departed';
  const isCompleted = assignment.schedule.status === 'completed';
  const hasDepartureInfo = assignment.departure_park_info;
  
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
        hasReturned 
          ? 'bg-blue-50 border-blue-200' 
          : isInProgress 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            hasReturned 
              ? 'bg-blue-100' 
              : isInProgress 
                ? 'bg-orange-100' 
                : 'bg-gray-100'
          }`}>
            {hasReturned ? (
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
              hasReturned 
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
          
          {hasReturned ? (
            assignment.return_park_info ? (
              <>
                <p className="font-medium text-blue-700">{assignment.return_park_info.name}</p>
                <p className="text-sm text-blue-600">{assignment.return_park_info.location}</p>
                {assignment.return_park_info.contact && (
                  <p className="text-xs text-blue-500 mt-1">📞 {assignment.return_park_info.contact}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-medium text-blue-700">To: {assignment.route_info.end_location}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Return park details not available
                </p>
              </>
            )
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
        
        {hasReturned ? (
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

// Trip Status Badge Component
const TripStatusBadge = ({ assignment }) => {
  const status = assignment.schedule.status;
  const hasReturned = assignment.return_park_info && assignment.schedule.return_time;
  
  const statusConfig = {
    completed: { 
      color: 'text-green-700 bg-green-100 border-green-300',
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Completed'
    },
    in_progress: { 
      color: 'text-orange-700 bg-orange-100 border-orange-300',
      icon: <Navigation className="w-3 h-3" />,
      text: 'In Progress'
    },
    departed: { 
      color: 'text-blue-700 bg-blue-100 border-blue-300',
      icon: <ArrowRight className="w-3 h-3" />,
      text: 'Departed'
    },
    assigned: { 
      color: 'text-purple-700 bg-purple-100 border-purple-300',
      icon: <Clock className="w-3 h-3" />,
      text: 'Assigned'
    },
    cancelled: { 
      color: 'text-red-700 bg-red-100 border-red-300',
      icon: <XCircle className="w-3 h-3" />,
      text: 'Cancelled'
    }
  };
  
  const config = statusConfig[status] || statusConfig.assigned;
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Badge>
      {hasReturned && (
        <Badge variant="outline" className="text-green-700 bg-green-100 border-0">
          <MapPin className="w-3 h-3 mr-1" />
          Returned
        </Badge>
      )}
    </div>
  );
};

export default function UnifiedBusExpenseReport() {
  const [dateRange, setDateRange] = useState({
    start_date: '2025-06-11',
    end_date: '2025-06-11'
  });
  const [selectedBusId, setSelectedBusId] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState('all-buses');

  // Query for buses
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busAPI.getAll(),
  });

  // Query for expense report
  const { 
    data: reportData, 
    isLoading: reportLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['bus-expense-report', dateRange.start_date, dateRange.end_date, selectedBusId],
    queryFn: () => enhancedDashboardAPI.getBusExpenseReport(dateRange.start_date, dateRange.end_date, selectedBusId),
    enabled: reportGenerated && !!dateRange.start_date && !!dateRange.end_date,
  });

  const buses = busesData?.data || [];
  const report = reportData?.data || {};
  const summary = report.summary || {};
  const assignments = report.assignments || [];
  const selectedBus = buses.find(bus => bus.id === selectedBusId);

  const handleGenerateReport = () => {
    if (dateRange.start_date && dateRange.end_date) {
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

  const downloadReport = (format, detailed = false) => {
    const reportContent = detailed ? generateDetailedReportContent(format) : generateReportContent(format);
    const filename = detailed ? 'detailed-bus-expense-report' : 'bus-expense-report';
    const busInfo = selectedBusId ? `-${selectedBus?.plate_number || selectedBusId}` : '';
    
    const blob = new Blob([reportContent], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}${busInfo}-${dateRange.start_date}-to-${dateRange.end_date}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportContent = (format) => {
    if (format === 'csv') {
      let csv = 'Assignment ID,Bus,Driver,Conductor,Route,Departure Date,Return Date,Status,Fuel Cost,Maintenance Cost,Wash Cost,Total Cost,Notes\n';
      assignments.forEach(assignment => {
        csv += `${assignment.assignment_id},`;
        csv += `${assignment.bus_info.plate_number},`;
        csv += `${assignment.driver_info.name},`;
        csv += `${assignment.conductor_info.name},`;
        csv += `${assignment.route_info.name},`;
        csv += `${new Date(assignment.schedule.departure_time).toLocaleDateString()},`;
        csv += `${assignment.schedule.return_time ? new Date(assignment.schedule.return_time).toLocaleDateString() : 'N/A'},`;
        csv += `${assignment.schedule.status},`;
        csv += `${assignment.expenses.fuel.total_cost},`;
        csv += `${assignment.expenses.maintenance.total_cost},`;
        csv += `${assignment.expenses.wash.total_cost},`;
        csv += `${assignment.total_cost},`;
        csv += `"${assignment.notes}"\n`;
      });
      return csv;
    } else {
      return JSON.stringify(report, null, 2);
    }
  };

  const generateDetailedReportContent = (format) => {
    if (format === 'csv') {
      let csv = 'Assignment ID,Bus,Driver,Route,Record Type,Record ID,Attendant,Details,Cost,Timestamp,Additional Info\n';
      
      assignments.forEach(assignment => {
        const baseInfo = [
          assignment.assignment_id,
          assignment.bus_info.plate_number,
          assignment.driver_info.name,
          assignment.route_info.name
        ];

        // Add fuel records
        assignment.expenses.fuel.records.forEach(fuel => {
          csv += baseInfo.join(',') + ',';
          csv += `FUEL,${fuel.id},"${fuel.attendant_name}","${fuel.liters}L @ ${formatCurrency(fuel.price_per_liter)}/L",${fuel.amount},${fuel.timestamp},"Station: ${fuel.fuel_station_name}"\n`;
        });

        // Add maintenance records
        assignment.expenses.maintenance.records.forEach(maint => {
          csv += baseInfo.join(',') + ',';
          csv += `MAINTENANCE,${maint.id},"${maint.attendant_name}","${maint.maintenance_type}",${maint.cost},${maint.timestamp},"${maint.description || 'N/A'}"\n`;
        });

        // Add wash records
        assignment.expenses.wash.records.forEach(wash => {
          csv += baseInfo.join(',') + ',';
          csv += `WASH,${wash.id},"${wash.attendant_name}","${wash.service_type_display || 'Car Wash'}",${wash.cost},${wash.timestamp},"Station: ${wash.car_wash_station_name}"\n`;
        });

        // If no records, add summary
        if (!assignment.expenses.fuel.records.length && 
            !assignment.expenses.maintenance.records.length && 
            !assignment.expenses.wash.records.length) {
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
        detailed_records: assignments
      }, null, 2);
    }
  };

  // Calculate metrics
  const calculateMetrics = () => {
    if (!assignments.length) return {};

    const completedTrips = assignments.filter(a => a.schedule.status === 'completed').length;
    const totalTrips = assignments.length;
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

    const routesUsed = [...new Set(assignments.map(a => a.route_info.name))];
    const driversUsed = [...new Set(assignments.map(a => a.driver_info.name))];

    return {
      completionRate,
      routesUsed,
      driversUsed,
      completedTrips,
      totalTrips
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Bus Expense Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive expense reporting with route and location tracking
          </p>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-buses" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            All Buses Report
          </TabsTrigger>
          <TabsTrigger value="single-bus" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Single Bus Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-buses" className="space-y-6">
          {/* All Buses Report Content */}
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
                  <Label className="opacity-0">Action</Label>
                  <Button 
                    onClick={() => {
                      setSelectedBusId('');
                      handleGenerateReport();
                    }}
                    disabled={!dateRange.start_date || !dateRange.end_date || reportLoading}
                    className="w-full flex items-center gap-2"
                  >
                    {reportLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single-bus" className="space-y-6">
          {/* Single Bus Report Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Single Bus Report Parameters
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
                  <Label htmlFor="start_date_single">Start Date</Label>
                  <Input
                    id="start_date_single"
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange(prev => ({...prev, start_date: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date_single">End Date</Label>
                  <Input
                    id="end_date_single"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Download Options */}
      {reportGenerated && !reportLoading && !isError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
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
                    onClick={() => downloadReport('csv', true)}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4" />
                    Detailed CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadReport('json', true)}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4" />
                    Detailed JSON
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {reportLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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

      {/* Report Results */}
      {reportGenerated && !reportLoading && !isError && report.date_range && (
        <>
          {/* Bus Information Header (for single bus reports) */}
          {selectedBus && activeTab === 'single-bus' && (
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
            </Card>
          )}

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
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{new Date(report.date_range.end_date).toLocaleDateString()}</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Assignments</p>
                  <p className="font-medium text-2xl">{summary.total_assignments || 0}</p>
                </div>
                {selectedBus && (
                  <>
                    <Separator orientation="vertical" className="h-10" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bus</p>
                      <p className="font-medium text-lg">{selectedBus.plate_number}</p>
                    </div>
                  </>
                )}
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
                    <p className="text-sm text-muted-foreground">Fuel Costs</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_fuel_cost)}</p>
                    {summary.total_fuel_liters > 0 && (
                      <p className="text-xs text-muted-foreground">{summary.total_fuel_liters}L total</p>
                    )}
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

          {/* Performance Metrics (for single bus) */}
          {selectedBus && activeTab === 'single-bus' && (
            <div className="grid gap-4 md:grid-cols-3">
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
                      <p className="text-sm text-muted-foreground">Routes Covered</p>
                      <p className="text-2xl font-bold text-purple-600">{metrics.routesUsed?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">{metrics.driversUsed?.length || 0} different drivers</p>
                    </div>
                    <Route className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Fuel Price</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {summary.average_fuel_price > 0 ? formatCurrency(summary.average_fuel_price) : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">per liter</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Routes and Drivers Summary (for single bus) */}
          {selectedBus && activeTab === 'single-bus' && (metrics.routesUsed?.length > 0 || metrics.driversUsed?.length > 0) && (
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

          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                Assignment Details
                {summary.total_fuel_cost === 0 && (
                  <Badge variant="outline" className="text-yellow-700 bg-yellow-100">
                    <Info className="w-3 h-3 mr-1" />
                    No fuel records in this period
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No assignments found</p>
                  <p className="text-sm text-muted-foreground">
                    No bus assignments found for the selected date range{selectedBus ? ` for ${selectedBus.plate_number}` : ''}.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignments.map((assignment, index) => (
                    <Card key={assignment.assignment_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        {/* Header with Bus and Status */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">{assignment.bus_info.plate_number}</h3>
                              <p className="text-sm text-muted-foreground">
                                {assignment.bus_info.model} • Capacity: {assignment.bus_info.capacity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <TripStatusBadge assignment={assignment} />
                            <span className="font-bold text-lg text-red-600">
                              {formatCurrency(assignment.total_cost)}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* Left Column: Trip Information */}
                          <div className="space-y-4">
                            {/* Route Information */}
                            <Card className="bg-gray-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Route className="w-5 h-5" />
                                  Route & Crew
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">Route</p>
                                  <p className="font-medium">{assignment.route_info.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.route_info.start_location} → {assignment.route_info.end_location}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Driver</p>
                                    <p className="font-medium">{assignment.driver_info.name}</p>
                                    <p className="text-xs text-muted-foreground">License: {assignment.driver_info.license_number}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Conductor</p>
                                    <p className="font-medium">{assignment.conductor_info.name}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Expense Summary */}
                            <Card className="bg-gray-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <DollarSign className="w-5 h-5" />
                                  Expense Summary
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm">
                                      <Fuel className="w-4 h-4 text-orange-600" />
                                      Fuel {assignment.expenses.fuel.total_liters > 0 && `(${assignment.expenses.fuel.total_liters}L)`}
                                    </span>
                                    <span className="font-medium text-orange-600">
                                      {formatCurrency(assignment.expenses.fuel.total_cost)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm">
                                      <Wrench className="w-4 h-4 text-purple-600" />
                                      Maintenance ({assignment.expenses.maintenance.records.length} records)
                                    </span>
                                    <span className="font-medium text-purple-600">
                                      {formatCurrency(assignment.expenses.maintenance.total_cost)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-sm">
                                      <Droplets className="w-4 h-4 text-blue-600" />
                                      Car Wash ({assignment.expenses.wash.records.length} records)
                                    </span>
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(assignment.expenses.wash.total_cost)}
                                    </span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between items-center font-bold">
                                    <span>Total Cost</span>
                                    <span className="text-lg text-red-600">
                                      {formatCurrency(assignment.total_cost)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Right Column: Location Tracking */}
                          <div>
                            <Card className="bg-gradient-to-br from-blue-50 to-green-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Building className="w-5 h-5" />
                                  Location Tracking
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <BusParkStatus assignment={assignment} />
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Detailed Records Section (Expandable) */}
                        {(assignment.expenses.fuel.records.length > 0 || 
                          assignment.expenses.maintenance.records.length > 0 || 
                          assignment.expenses.wash.records.length > 0) && (
                          <details className="mt-6">
                            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 p-2 rounded bg-blue-50">
                              <Eye className="w-4 h-4" />
                              View Detailed Expense Records ({
                                assignment.expenses.fuel.records.length + 
                                assignment.expenses.maintenance.records.length + 
                                assignment.expenses.wash.records.length
                              } total records)
                            </summary>
                            <div className="mt-4 space-y-4">
                              {/* Fuel Records */}
                              {assignment.expenses.fuel.records.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
                                    <Fuel className="w-4 h-4" />
                                    Fuel Records ({assignment.expenses.fuel.records.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {assignment.expenses.fuel.records.map((fuel, fuelIndex) => (
                                      <Card key={fuelIndex} className="bg-orange-50 border-orange-200">
                                        <CardContent className="p-4">
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                              <span className="text-muted-foreground block">Attendant</span>
                                              <span className="font-medium">{fuel.attendant_name}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Quantity</span>
                                              <span className="font-medium">{fuel.liters}L @ {formatCurrency(fuel.price_per_liter)}/L</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Station</span>
                                              <span className="font-medium">{fuel.fuel_station_name}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Total</span>
                                              <span className="font-medium text-orange-600">{formatCurrency(fuel.amount)}</span>
                                            </div>
                                          </div>
                                          {fuel.receipt_number && fuel.receipt_number !== 'N/A' && (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                              Receipt: {fuel.receipt_number}
                                            </div>
                                          )}
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            {new Date(fuel.timestamp).toLocaleString()}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Maintenance Records */}
                              {assignment.expenses.maintenance.records.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-purple-600 mb-3 flex items-center gap-2">
                                    <Wrench className="w-4 h-4" />
                                    Maintenance Records ({assignment.expenses.maintenance.records.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {assignment.expenses.maintenance.records.map((maintenance, maintIndex) => (
                                      <Card key={maintIndex} className="bg-purple-50 border-purple-200">
                                        <CardContent className="p-4">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div>
                                              <span className="text-muted-foreground block">Type</span>
                                              <span className="font-medium">{maintenance.maintenance_type}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Attendant</span>
                                              <span className="font-medium">{maintenance.attendant_name}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Cost</span>
                                              <span className="font-medium text-purple-600">{formatCurrency(maintenance.cost)}</span>
                                            </div>
                                          </div>
                                          {maintenance.description && (
                                            <div className="mt-2">
                                              <span className="text-muted-foreground block text-xs">Description</span>
                                              <span className="text-sm">{maintenance.description}</span>
                                            </div>
                                          )}
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            {new Date(maintenance.timestamp).toLocaleString()}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Wash Records */}
                              {assignment.expenses.wash.records.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-blue-600 mb-3 flex items-center gap-2">
                                    <Droplets className="w-4 h-4" />
                                    Car Wash Records ({assignment.expenses.wash.records.length})
                                  </h5>
                                  <div className="space-y-3">
                                    {assignment.expenses.wash.records.map((wash, washIndex) => (
                                      <Card key={washIndex} className="bg-blue-50 border-blue-200">
                                        <CardContent className="p-4">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div>
                                              <span className="text-muted-foreground block">Attendant</span>
                                              <span className="font-medium">{wash.attendant_name}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Service Type</span>
                                              <span className="font-medium">{wash.service_type_display || 'Car Wash'}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground block">Cost</span>
                                              <span className="font-medium text-blue-600">{formatCurrency(wash.cost)}</span>
                                            </div>
                                          </div>
                                          {wash.car_wash_station_name && (
                                            <div className="mt-2">
                                              <span className="text-muted-foreground block text-xs">Station</span>
                                              <span className="text-sm">{wash.car_wash_station_name}</span>
                                            </div>
                                          )}
                                          {wash.notes && wash.notes !== 'N/A' && (
                                            <div className="mt-2">
                                              <span className="text-muted-foreground block text-xs">Notes</span>
                                              <span className="text-sm">{wash.notes}</span>
                                            </div>
                                          )}
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            {new Date(wash.timestamp).toLocaleString()}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        )}

                        {/* Trip Notes */}
                        {assignment.notes && assignment.notes !== 'N/A' && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-700 mb-1">Trip Notes</h5>
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
                  {selectedBus && activeTab === 'single-bus' 
                    ? `Bus ${selectedBus.plate_number} completed ${metrics.completedTrips || 0} out of ${metrics.totalTrips || 0} assignments with a total expense of ${formatCurrency(summary.grand_total)} during the selected period.`
                    : `Found ${summary.total_assignments || 0} total assignments with a combined expense of ${formatCurrency(summary.grand_total)} during the selected period.`
                  }
                </p>
                
                {summary.grand_total > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-muted-foreground">Most Expensive Category</p>
                      <p className="font-bold text-lg">
                        {summary.total_fuel_cost >= summary.total_maintenance_cost && summary.total_fuel_cost >= summary.total_wash_cost 
                          ? '⛽ Fuel' 
                          : summary.total_maintenance_cost >= summary.total_wash_cost 
                            ? '🔧 Maintenance' 
                            : '🚿 Car Wash'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Math.max(summary.total_fuel_cost, summary.total_maintenance_cost, summary.total_wash_cost))}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-muted-foreground">Average per Assignment</p>
                      <p className="font-bold text-lg">{formatCurrency(summary.average_cost_per_assignment)}</p>
                      <p className="text-xs text-muted-foreground">
                        {summary.total_assignments > 1 ? 'across all trips' : 'single trip'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-muted-foreground">
                        {selectedBus && activeTab === 'single-bus' ? 'Performance Rating' : 'Fuel Efficiency'}
                      </p>
                      <p className="font-bold text-lg">
                        {selectedBus && activeTab === 'single-bus' 
                          ? (metrics.completionRate >= 90 ? '🟢 Excellent' : 
                             metrics.completionRate >= 75 ? '🟡 Good' : 
                             metrics.completionRate >= 50 ? '🟠 Fair' : '🔴 Poor')
                          : (summary.total_fuel_liters > 0 
                             ? `${summary.total_fuel_liters}L total`
                             : 'No fuel data')
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBus && activeTab === 'single-bus' 
                          ? `${metrics.completionRate?.toFixed(1) || 0}% completion rate`
                          : summary.average_fuel_price > 0 
                            ? `Avg ${formatCurrency(summary.average_fuel_price)}/L`
                            : 'N/A'
                        }
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