import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useListDeliveries, DeliveryStatus } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function Deliveries() {
  const { data: deliveries, isLoading } = useListDeliveries();

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500';
      case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Deliveries" 
        description="Manage logistics and delivery assignments."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Assign Delivery
          </Button>
        }
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <Card className="shadow-sm border-border/50">
          <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by order or driver..." className="pl-9 bg-background" />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-background">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Delivered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : deliveries?.length ? (
                deliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">{delivery.orderNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{delivery.customerName}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{delivery.deliveryAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>{delivery.delivererName || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${getStatusColor(delivery.status)}`}>
                        {delivery.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {delivery.scheduledAt ? format(new Date(delivery.scheduledAt), "MMM d, h:mm a") : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {delivery.deliveredAt ? format(new Date(delivery.deliveredAt), "MMM d, h:mm a") : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No deliveries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
