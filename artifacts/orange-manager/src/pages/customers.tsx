import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useListCustomers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function Customers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const { data: customerList, isLoading } = useListCustomers({
    page,
    limit: 10,
    ...(search && { search })
  });

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Clientes" 
        description="Gerencie seus clientes B2B e visualize o histórico de pedidos."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Cliente
          </Button>
        }
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <Card className="shadow-sm border-border/50">
          <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Buscar por nome ou CNPJ..." 
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : customerList?.data?.length ? (
                customerList.data.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.cnpj}</TableCell>
                    <TableCell>
                      {customer.city}, {customer.state}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{customer.email}</span>
                        <span className="text-muted-foreground">{customer.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {customer.totalSpent ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
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
