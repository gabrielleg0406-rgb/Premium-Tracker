import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar as CalendarIcon, Factory, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import { useGetProductionReport, useGetFinancialReport, useGetQualityReport, useGetDiscardReport } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const { data: productionReport, isLoading: isLoadingProd } = useGetProductionReport();
  const { data: financialReport, isLoading: isLoadingFin } = useGetFinancialReport();
  const { data: qualityReport, isLoading: isLoadingQual } = useGetQualityReport();
  const { data: discardReport, isLoading: isLoadingDisc } = useGetDiscardReport();

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Relatórios" 
        description="Análises completas e exportações para todos os departamentos."
        actions={
          <Button variant="outline" className="gap-2 bg-background">
            <CalendarIcon className="w-4 h-4" />
            Últimos 30 Dias
          </Button>
        }
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Production Report */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Factory className="w-5 h-5 text-primary" />
                  Visão Geral de Produção
                </CardTitle>
                <CardDescription className="mt-1">Métricas de rendimento e eficiência</CardDescription>
              </div>
              <Button variant="ghost" size="icon" title="Exportar PDF"><Download className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              {isLoadingProd ? (
                <div className="space-y-4 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : productionReport ? (
                <div className="mt-4 space-y-6">
                  <div className="flex items-end justify-between border-b border-border/50 pb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Produzido</p>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">{productionReport.totalProduced.toLocaleString('pt-BR')} kg</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Total de Lotes</p>
                      <p className="text-xl font-semibold mt-1">{productionReport.totalLots}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Brix Médio</p>
                      <p className="text-xl font-semibold mt-1">{Number(productionReport.averageBrix).toFixed(1)}°Bx</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Financial Report */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Resumo Financeiro
                </CardTitle>
                <CardDescription className="mt-1">Receita e desempenho de vendas</CardDescription>
              </div>
              <Button variant="ghost" size="icon" title="Exportar PDF"><Download className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              {isLoadingFin ? (
                <div className="space-y-4 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : financialReport ? (
                <div className="mt-4 space-y-6">
                  <div className="flex items-end justify-between border-b border-border/50 pb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialReport.totalRevenue)}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10">
                      <p className="text-sm font-medium text-emerald-600">Total de Pedidos</p>
                      <p className="text-xl font-semibold mt-1">{financialReport.totalOrders}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10">
                      <p className="text-sm font-medium text-emerald-600">Ticket Médio</p>
                      <p className="text-xl font-semibold mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialReport.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Quality Report */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Controle de Qualidade
                </CardTitle>
                <CardDescription className="mt-1">Resultados de testes e aprovações</CardDescription>
              </div>
              <Button variant="ghost" size="icon" title="Exportar PDF"><Download className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              {isLoadingQual ? (
                <div className="space-y-4 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : qualityReport ? (
                <div className="mt-4 space-y-6">
                  <div className="flex items-end justify-between border-b border-border/50 pb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</p>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {(qualityReport.approvalRate * 100).toFixed(1)}%
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                      <p className="text-sm font-medium text-blue-600">Lotes Aprovados</p>
                      <p className="text-xl font-semibold mt-1">{qualityReport.approvedLots}</p>
                    </div>
                    <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                      <p className="text-sm font-medium text-red-600">Lotes Reprovados</p>
                      <p className="text-xl font-semibold mt-1">{qualityReport.rejectedLots}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Discard Report */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Perdas e Descartes
                </CardTitle>
                <CardDescription className="mt-1">Rastreamento de desperdício e motivos</CardDescription>
              </div>
              <Button variant="ghost" size="icon" title="Exportar PDF"><Download className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent>
              {isLoadingDisc ? (
                <div className="space-y-4 mt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : discardReport ? (
                <div className="mt-4 space-y-6">
                  <div className="flex items-end justify-between border-b border-border/50 pb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volume Total Descartado</p>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {discardReport.totalDiscardedKg.toLocaleString('pt-BR')} kg
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Principais Motivos</p>
                    {discardReport.byReason.slice(0, 3).map((reason, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{reason.reason.replace('_', ' ')}</span>
                        <span className="font-medium">{reason.quantityKg.toLocaleString('pt-BR')} kg</span>
                      </div>
                    ))}
                    {discardReport.byReason.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">Nenhum descarte registrado no período.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
