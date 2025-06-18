'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Package, Wrench, List } from 'lucide-react';
import MaintenanceItemsManagement from '@/components/ui/MaintenanceItemsManagement'


export default function MaintenanceSetupPage() {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            Maintenance Setup
          </h1>
          <p className="text-muted-foreground mt-1">Configure maintenance types, items, and parts</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Types</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Oil Change, Brake Service, etc.</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Items</p>
                <p className="text-2xl font-bold">45</p>
                <p className="text-xs text-muted-foreground">Parts, fluids, filters, etc.</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-xs text-muted-foreground">Items needing restock</p>
              </div>
              <List className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different setup sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Maintenance Items
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance Types
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="mt-6">
          <MaintenanceItemsManagement />
        </TabsContent>
        
        <TabsContent value="types" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Maintenance Types Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Maintenance Types</p>
                <p>This section would contain your maintenance types management component.</p>
                <p className="text-sm mt-2">Create types like "Oil Change", "Brake Service", "Engine Repair", etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Maintenance Types Setup
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Create broad categories like "Oil Change", "Brake Service"</li>
                <li>• Set estimated duration and default costs</li>
                <li>• Define priority levels for different types</li>
                <li>• Associate relevant items with each type</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Maintenance Items Setup
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Add specific parts: "5W-30 Engine Oil", "Brake Fluid DOT 4"</li>
                <li>• Set accurate prices and units</li>
                <li>• Mark items as consumable or reusable</li>
                <li>• Set minimum stock levels for alerts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}