import { PageHeader } from "@/components/layout/PageHeader";
import { useListProductionLots, ProductionLotStatus, useGetProductionStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Factory, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const lotStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  in_production: 'Em Produção',
  finished: 'Finalizado',
  quality_approved: 'Aprovado',
  quality_rejected: 'Reprovado',
};

const qualityStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Reprovado',
};

export default function Production() {
  const { data: lots, isLoading } = useListProductionLots();
  const { data: stats, isLoading: isLoadingStats } = useGetProductionStats();

  const getStatusColor = (status: ProductionLotStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_production': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finished': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'quality_approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'quality_rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Produção" 
        description="Gerencie lotes de produção e controle de qualidade."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Lote
          </Button>
        }
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Produção Hoje</p>
                <div className="p-2 bg-muted/50 rounded-md"><Factory className="w-4 h-4 text-muted-foreground" /></div>
              </div>
              {isLoadingStats ? <Skeleton className="h-8 w-24" /> : (
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">{stats?.todayProduced ? `${stats.todayProduced.toLocaleString('pt-BR')} kg` : "0 kg"}</h3>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Lotes Ativos</p>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md"><Clock className="w-4 h-4" /></div>
              </div>
              {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">{stats?.lotsInProduction || 0}</h3>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</p>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
              </div>
              {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">{stats?.approvalRate ? `${(stats.approvalRate * 100).toFixed(1)}%` : "0%"}</h3>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Brix Médio</p>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-md"><AlertTriangle className="w-4 h-4" /></div>
              </div>
              {isLoadingStats ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  {stats?.averageBrix ? `${Number(stats.averageBrix).toFixed(1)}°Bx` : "-"}
                </h3>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-border/50">
          <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar lotes..." className="pl-9 bg-background" />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-background">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Código do Lote</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Data</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : lots?.length ? (
                lots.map((lot) => (
                  <TableRow key={lot.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">{lot.lotCode}</TableCell>
                    <TableCell>{lot.productName}</TableCell>
                    <TableCell>{lot.quantityProduced} {lot.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(lot.status)}>
                        {lotStatusLabel[lot.status] || lot.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${
                        lot.qualityStatus === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        lot.qualityStatus === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {qualityStatusLabel[lot.qualityStatus] || lot.qualityStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(lot.createdAt), "d MMM yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum lote de produção encontrado.
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
