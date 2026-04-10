import { PageHeader } from "@/components/layout/PageHeader";
import { useListInventory, useGetInventorySummary, InventoryItemStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const statusLabel: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  depleted: 'Esgotado',
  discarded: 'Descartado',
};

export default function Inventory() {
  const { data: inventory, isLoading } = useListInventory();
  const { data: summary, isLoading: isLoadingSummary } = useGetInventorySummary();

  const getStatusColor = (status: InventoryItemStatus) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'depleted': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'discarded': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Estoque" 
        description="Controle de estoque em tempo real e movimentações."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              Saída
            </Button>
            <Button className="gap-2">
              <ArrowUpFromLine className="w-4 h-4" />
              Entrada
            </Button>
          </div>
        }
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoadingSummary ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="shadow-sm border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-24 mb-4" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : summary?.length ? (
            summary.map((item) => (
              <Card key={item.productId} className="shadow-sm border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{item.productName}</p>
                    <div className="p-2 bg-muted/50 rounded-md"><PackageSearch className="w-4 h-4 text-muted-foreground" /></div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                      {item.totalQuantity.toLocaleString('pt-BR')}
                    </h3>
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Disponível: {item.availableQuantity.toLocaleString('pt-BR')}</span>
                    <span>Reservado: {item.reservedQuantity.toLocaleString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-6 text-center text-muted-foreground border rounded-lg bg-muted/30">
              Nenhum resumo de estoque disponível.
            </div>
          )}
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="p-4 border-b bg-muted/20">
            <CardTitle className="text-base font-medium">Itens Detalhados do Estoque</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Código do Lote</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead>Validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : inventory?.length ? (
                inventory.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">{item.lotCode}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {statusLabel[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(item.entryDate), "d MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.expiryDate ? format(new Date(item.expiryDate), "d MMM yyyy", { locale: ptBR }) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum item no estoque encontrado.
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
