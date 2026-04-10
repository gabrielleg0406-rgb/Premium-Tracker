import { PageHeader } from "@/components/layout/PageHeader";
import { 
  useGetDashboardSummary, 
  useGetDashboardProductionChart, 
  useGetDashboardOrderStatusBreakdown,
  useGetDashboardQualityAlerts 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Package, ShoppingCart, Truck, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReactNode } from "react";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: chartData, isLoading: isLoadingChart } = useGetDashboardProductionChart();
  const { data: orderBreakdown, isLoading: isLoadingBreakdown } = useGetDashboardOrderStatusBreakdown();
  const { data: qualityAlerts, isLoading: isLoadingAlerts } = useGetDashboardQualityAlerts();

  const pieData = orderBreakdown ? [
    { name: 'Pendente', value: orderBreakdown.pending, color: '#f59e0b' },
    { name: 'Em Produção', value: orderBreakdown.inProduction, color: '#3b82f6' },
    { name: 'Pronto', value: orderBreakdown.ready, color: '#8b5cf6' },
    { name: 'Entregue', value: orderBreakdown.delivered, color: '#10b981' },
    { name: 'Cancelado', value: orderBreakdown.cancelled, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Dashboard" 
        description="Visão geral de produção, pedidos e métricas de qualidade." 
      />
      
      <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <KpiCard 
            title="Produção Diária" 
            value={summary?.dailyProduction ? `${summary.dailyProduction} kg` : "0 kg"}
            icon={<FactoryIcon className="w-4 h-4 text-muted-foreground" />}
            isLoading={isLoadingSummary}
            trend="+12%"
            trendUp
          />
          <KpiCard 
            title="Pedidos Pendentes" 
            value={summary?.pendingOrders?.toString() || "0"}
            icon={<ShoppingCart className="w-4 h-4 text-muted-foreground" />}
            isLoading={isLoadingSummary}
          />
          <KpiCard 
            title="Entregas Pendentes" 
            value={summary?.pendingDeliveries?.toString() || "0"}
            icon={<Truck className="w-4 h-4 text-muted-foreground" />}
            isLoading={isLoadingSummary}
          />
          <KpiCard 
            title="Aprovação de Qualidade" 
            value={summary?.qualityApprovalRate ? `${(summary.qualityApprovalRate * 100).toFixed(1)}%` : "0%"}
            icon={<CheckCircle2 className="w-4 h-4 text-muted-foreground" />}
            isLoading={isLoadingSummary}
            trend="+0,5%"
            trendUp
          />
          <KpiCard 
            title="Estoque Atual" 
            value={summary?.currentStockKg ? `${summary.currentStockKg.toLocaleString('pt-BR')} kg` : "0 kg"}
            icon={<Package className="w-4 h-4 text-muted-foreground" />}
            isLoading={isLoadingSummary}
            className="sm:col-span-2 lg:col-span-4 xl:col-span-1"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Production Chart */}
          <Card className="lg:col-span-2 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">Volume de Produção (Últimos 30 Dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingChart ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData && chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorJuice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(new Date(val), "d MMM", { locale: ptBR })}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(val) => format(new Date(val), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="juiceKg" 
                        name="Suco (kg)" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorJuice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/30">
                  Nenhum dado de produção disponível.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBreakdown ? (
                <Skeleton className="h-[300px] w-full" />
              ) : pieData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/30">
                  Nenhum pedido para exibir.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Alerts */}
          <Card className="lg:col-span-3 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Alertas de Qualidade Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : qualityAlerts && qualityAlerts.length > 0 ? (
                <div className="space-y-3">
                  {qualityAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors">
                      <div className={`p-2 rounded-full shrink-0 ${
                        alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                        alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate text-foreground">{alert.message}</p>
                          <Badge variant="outline" className="shrink-0">{alert.lotCode}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{format(new Date(alert.createdAt), "d MMM, HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/30">
                  <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
                  <p>Tudo certo! Nenhum alerta de qualidade ativo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, isLoading, trend, trendUp, className }: { 
  title: string; value: string; icon: ReactNode; isLoading?: boolean; trend?: string; trendUp?: boolean; className?: string 
}) {
  return (
    <Card className={`shadow-sm border-border/50 overflow-hidden ${className || ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          <div className="p-2 bg-muted/50 rounded-md">
            {icon}
          </div>
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">{value}</h3>
              {trend && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${trendUp ? 'text-secondary' : 'text-destructive'}`}>
                  {trendUp ? <TrendingUp className="w-3 h-3" /> : null}
                  {trend}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FactoryIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1" />
      <path d="M12 18h1" />
      <path d="M7 18h1" />
    </svg>
  );
}
