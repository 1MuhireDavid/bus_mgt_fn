import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bus, 
  MapPin, 
  User, 
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { busAPI } from '@/lib/api';
import BusDetailModal from './BusDetailModal'; // Import the modal component

export default function BusGridComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal state
  const [selectedBusForDetail, setSelectedBusForDetail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query for all buses
  const { 
    data: busesData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['buses-list'],
    queryFn: () => busAPI.getAll(),
  });

  const buses = busesData?.data || [];

  // Filter buses based on search and status
  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bus.model && bus.model.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBusClick = (busId, busPlateNumber) => {
    setSelectedBusForDetail({ busId, busPlateNumber });
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'available': 'secondary',
      'assigned': 'default',
      'in_use': 'default',
      'maintenance': 'destructive',
      'out_of_service': 'destructive',
      'active': 'secondary',
    };
    const colors = {
      'available': 'text-green-600 bg-green-100',
      'assigned': 'text-blue-600 bg-blue-100',
      'in_use': 'text-orange-600 bg-orange-100',
      'maintenance': 'text-red-600 bg-red-100',
      'out_of_service': 'text-red-600 bg-red-100',
      'active': 'text-green-600 bg-green-100',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className={colors[status]}>
        {status?.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStatusCount = (status) => {
    return buses.filter(bus => bus.status === status).length;
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bus className="w-8 h-8 text-blue-600" />
            Fleet Overview
          </h1>
          <p className="text-muted-foreground mt-1">Click on any bus to view detailed information</p>
        </div>
        <Button onClick={refetch} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Buses</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by plate number or model..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <select
                className="w-full p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{buses.length}</p>
              <p className="text-sm text-muted-foreground">Total Buses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{getStatusCount('available')}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{getStatusCount('assigned')}</p>
              <p className="text-sm text-muted-foreground">Assigned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{getStatusCount('in_use')}</p>
              <p className="text-sm text-muted-foreground">In Use</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{getStatusCount('maintenance')}</p>
              <p className="text-sm text-muted-foreground">Maintenance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading buses...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Failed to load buses: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Bus Grid */}
      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBuses.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No buses found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            filteredBuses.map((bus) => (
              <Card 
                key={bus.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500 hover:border-l-blue-600"
                onClick={() => handleBusClick(bus.id, bus.plate_number)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bus className="w-5 h-5 text-blue-600" />
                      {bus.plate_number}
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(bus.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Bus Details */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{bus.model || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="font-medium">{bus.capacity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {bus.current_location?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Current Assignment Info (if any) */}
                    {bus.current_assignment && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Current Assignment:</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <User className="w-3 h-3" />
                            <span>{bus.current_assignment.driver_name || 'N/A'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Route: {bus.current_assignment.route_name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Action */}
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBusClick(bus.id, bus.plate_number);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Bus Detail Modal */}
      <BusDetailModal
        busId={selectedBusForDetail?.busId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}