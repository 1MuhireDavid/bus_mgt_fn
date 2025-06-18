"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { busAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bus, Plus, Search, MoreVertical, Edit } from "lucide-react";
import BusFormModal from "@/components/ui/BusFormModal";

export default function FleetManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const { data: buses, isLoading } = useQuery({
    queryKey: ["buses"],
    queryFn: () => busAPI.getAll(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      busAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const busData = buses?.data || [];
  const filteredBuses = busData.filter((bus: any) => {
    const matchesSearch =
      bus.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      available: "success",
      in_use: "default",
      maintenance: "warning",
      out_of_service: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const handleStatusChange = (busId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: busId, status: newStatus });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bus Management</h1>
        <Button
          onClick={() => {
            setSelectedBus(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Bus
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by plate number or model..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="under_maintenance">under_maintenance</option>
              <option value="decomissioned">Decomissioned</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bus Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Buses</p>
                <p className="text-2xl font-bold">{busData.length}</p>
              </div>
              <Bus className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {busData.filter((b: any) => b.status === "active").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    busData.filter((b: any) => b.status === "under_maintenance")
                      .length
                  }
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-orange-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bus List */}
      <Card>
        <CardHeader>
          <CardTitle>Bus Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBuses.map((bus: any) => (
              <div
                key={bus.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{bus.plate_number}</h3>
                    <p className="text-sm text-muted-foreground">{bus.model}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {getStatusBadge(bus.status)}

                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={bus.status}
                    onChange={(e) => handleStatusChange(bus.id, e.target.value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="active">active</option>
                    <option value="under_maintenance">under_maintenance</option>
                    <option value="decomissioned">decomissioned</option>
                    <option value="assigned">assigned</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBus(bus);
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <BusFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        refetch={() => queryClient.invalidateQueries(["buses"])}
        bus={selectedBus}
      />
    </div>
  );
}
