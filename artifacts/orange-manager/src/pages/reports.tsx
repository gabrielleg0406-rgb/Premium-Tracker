import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Calendar as CalendarIcon,
  Factory,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Package,
  Inbox,
  FileSpreadsheet,
} from "lucide-react";
import {
  useGetProductionReport,
  useGetFinancialReport,
  useGetQualityReport,
  useGetDiscardReport,
  useGetExpeditionReport,
  useGetProductionControlReport,
  useGetRawMaterialReceiptReport,
} from "@workspace/api-client-react";
import type {
  ExpeditionReportRowsItem,
  ProductionControlReportRowsItem,
  RawMaterialReceiptReportRowsItem,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

// ----- helpers -----
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtNumber = (n: number, frac = 0) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);

const formatDocument = (doc: string) => {
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return doc;
};

const shiftLabel: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

const statusOrderColor: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  in_production:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  ready:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  delivered:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  finished:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  quality_approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  quality_rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  received:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_production: "Em produção",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
  finished: "Finalizado",
  quality_approved: "Aprovado",
  quality_rejected: "Reprovado",
  received: "Recebido",
  rejected: "Rejeitado",
};

const qualityColor: Record<string, string> = {
  premium:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
  standard:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  economy:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    statusOrderColor[status] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`${cls} font-medium`}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}

// CSV export utility
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((r) => r.map(escape).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ----- KPI Tile -----
function KpiTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warning" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-muted/40 border-border/60",
    primary:
      "bg-primary/5 border-primary/15 dark:bg-primary/10 dark:border-primary/20",
    success:
      "bg-emerald-500/5 border-emerald-500/15 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    warning:
      "bg-amber-500/5 border-amber-500/15 dark:bg-amber-500/10 dark:border-amber-500/20",
    info: "bg-blue-500/5 border-blue-500/15 dark:bg-blue-500/10 dark:border-blue-500/20",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-semibold tracking-tight mt-1.5 text-foreground">
        {value}
      </p>
      {hint && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}

// ----- Empty state -----
function EmptyState({ icon: Icon, title, description }: { icon: typeof Inbox; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {description}
      </p>
    </div>
  );
}

// ----- Report Card Wrapper -----
function ReportShell({
  icon: Icon,
  title,
  description,
  accent,
  onExport,
  children,
}: {
  icon: typeof Truck;
  title: string;
  description: string;
  accent: "primary" | "info" | "success";
  onExport?: () => void;
  children: React.ReactNode;
}) {
  const accentColors: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    info: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
    success:
      "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
  };
  return (
    <Card className="shadow-sm border-border/60 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b border-border/60 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${accentColors[accent]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {description}
            </CardDescription>
          </div>
        </div>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-1.5 h-8"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="text-xs">CSV</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

// ===== Tabs =====
export default function Reports() {
  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Relatórios"
        description="Painéis e relatórios operacionais de expedição, produção e recebimento."
        actions={
          <Button variant="outline" className="gap-2 bg-background">
            <CalendarIcon className="w-4 h-4" />
            Últimos 30 Dias
          </Button>
        }
      />

      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-3xl">
            <TabsTrigger value="overview" className="gap-2">
              <Factory className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="expedition" className="gap-2">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Expedição</span>
              <span className="sm:hidden">Exped.</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2">
              <Package className="w-4 h-4" />
              Produção
            </TabsTrigger>
            <TabsTrigger value="receipt" className="gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Matéria-prima</span>
              <span className="sm:hidden">Recebim.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="m-0">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="expedition" className="m-0">
            <ExpeditionTab />
          </TabsContent>
          <TabsContent value="production" className="m-0">
            <ProductionControlTab />
          </TabsContent>
          <TabsContent value="receipt" className="m-0">
            <RawMaterialReceiptTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===== Overview =====
function OverviewTab() {
  const { data: productionReport, isLoading: isLoadingProd } =
    useGetProductionReport();
  const { data: financialReport, isLoading: isLoadingFin } =
    useGetFinancialReport();
  const { data: qualityReport, isLoading: isLoadingQual } =
    useGetQualityReport();
  const { data: discardReport, isLoading: isLoadingDisc } =
    useGetDiscardReport();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="w-5 h-5 text-primary" />
              Visão Geral de Produção
            </CardTitle>
            <CardDescription className="mt-1">
              Métricas de rendimento e eficiência
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" title="Exportar PDF">
            <Download className="w-4 h-4" />
          </Button>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Produzido
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {fmtNumber(productionReport.totalProduced)} kg
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <KpiTile
                  label="Total de Lotes"
                  value={String(productionReport.totalLots)}
                />
                <KpiTile
                  label="Brix Médio"
                  value={`${Number(productionReport.averageBrix).toFixed(1)}°Bx`}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription className="mt-1">
              Receita e desempenho de vendas
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" title="Exportar PDF">
            <Download className="w-4 h-4" />
          </Button>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Receita Total
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {fmtCurrency(financialReport.totalRevenue)}
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <KpiTile
                  label="Total de Pedidos"
                  value={String(financialReport.totalOrders)}
                  tone="success"
                />
                <KpiTile
                  label="Ticket Médio"
                  value={fmtCurrency(financialReport.averageOrderValue)}
                  tone="success"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              Controle de Qualidade
            </CardTitle>
            <CardDescription className="mt-1">
              Resultados de testes e aprovações
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" title="Exportar PDF">
            <Download className="w-4 h-4" />
          </Button>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Taxa de Aprovação
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {(qualityReport.approvalRate * 100).toFixed(1)}%
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <KpiTile
                  label="Lotes Aprovados"
                  value={String(qualityReport.approvedLots)}
                  tone="info"
                />
                <KpiTile
                  label="Lotes Reprovados"
                  value={String(qualityReport.rejectedLots)}
                  tone="warning"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Perdas e Descartes
            </CardTitle>
            <CardDescription className="mt-1">
              Rastreamento de desperdício e motivos
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" title="Exportar PDF">
            <Download className="w-4 h-4" />
          </Button>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Volume Total Descartado
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {fmtNumber(discardReport.totalDiscardedKg)} kg
                  </h3>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Principais Motivos
                </p>
                {discardReport.byReason.slice(0, 3).map((reason, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">
                      {reason.reason.replace("_", " ")}
                    </span>
                    <span className="font-medium">
                      {fmtNumber(reason.quantityKg)} kg
                    </span>
                  </div>
                ))}
                {discardReport.byReason.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum descarte registrado no período.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Expedition =====
function ExpeditionTab() {
  const { data, isLoading } = useGetExpeditionReport();
  const rows = data?.rows ?? [];

  const totals = useMemo(() => {
    const totalLiters = rows
      .filter((r: ExpeditionReportRowsItem) => r.unit === "liter")
      .reduce(
        (acc: number, r: ExpeditionReportRowsItem) => acc + r.quantity,
        0,
      );
    const uniqueBuyers = new Set(
      rows.map((r: ExpeditionReportRowsItem) => r.buyerDocument),
    ).size;
    const delivered = rows.filter(
      (r: ExpeditionReportRowsItem) =>
        r.status === "delivered" || r.status === "ready",
    ).length;
    return { totalLiters, uniqueBuyers, delivered };
  }, [rows]);

  const handleExport = () => {
    downloadCSV(
      `relatorio-expedicao-${new Date().toISOString().split("T")[0]}.csv`,
      [
        "Data da venda",
        "Comprador",
        "CPF/CNPJ",
        "Produto",
        "Quantidade",
        "Unidade",
        "Lote/Fabricação",
        "Validade",
        "Responsável",
        "Status",
      ],
      rows.map((r: ExpeditionReportRowsItem) => [
        fmtDateTime(r.saleDate),
        r.buyerName,
        formatDocument(r.buyerDocument),
        r.productName,
        fmtNumber(r.quantity, r.unit === "liter" ? 2 : 0),
        r.unit,
        r.lotCode,
        r.expiresAt ? fmtDate(r.expiresAt) : "—",
        r.responsible,
        statusLabel[r.status] ?? r.status,
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile
          label="Vendas no período"
          value={fmtNumber(rows.length)}
          hint="registros expedidos"
          tone="primary"
        />
        <KpiTile
          label="Volume em litros"
          value={`${fmtNumber(totals.totalLiters, 2)} L`}
          hint="produtos líquidos vendidos"
          tone="info"
        />
        <KpiTile
          label="Compradores únicos"
          value={fmtNumber(totals.uniqueBuyers)}
          hint={`${totals.delivered} pedidos prontos/entregues`}
          tone="success"
        />
      </div>

      <ReportShell
        icon={Truck}
        accent="primary"
        title="Relatório de Controle de Expedição"
        description="Vendas com lote, validade e responsável pela expedição"
        onExport={handleExport}
      >
        {isLoading ? (
          <TableSkeleton cols={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhuma expedição no período"
            description="Quando vendas forem registradas, elas aparecerão aqui com lote e responsável."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
                  <TableHead className="font-semibold text-foreground">
                    Data venda
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Comprador
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    CPF / CNPJ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Produto
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right">
                    Quantidade
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Lote / Fabricação
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Validade
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Responsável
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: ExpeditionReportRowsItem) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm whitespace-nowrap">
                      {fmtDateTime(r.saleDate)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {r.buyerName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDocument(r.buyerDocument)}
                    </TableCell>
                    <TableCell>{r.productName}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {fmtNumber(r.quantity, r.unit === "liter" ? 2 : 0)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {r.unit === "liter"
                          ? "L"
                          : r.unit === "kg"
                            ? "kg"
                            : r.unit === "box"
                              ? "cx"
                              : "un"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.lotCode}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.expiresAt ? (
                        fmtDate(r.expiresAt)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{r.responsible}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ReportShell>
    </div>
  );
}

// ===== Production Control =====
function ProductionControlTab() {
  const { data, isLoading } = useGetProductionControlReport();
  const rows = data?.rows ?? [];

  const totals = useMemo(() => {
    const totalLiters = rows
      .filter((r: ProductionControlReportRowsItem) => r.unit === "liter")
      .reduce(
        (acc: number, r: ProductionControlReportRowsItem) =>
          acc + r.quantityProduced,
        0,
      );
    const finished = rows.filter((r: ProductionControlReportRowsItem) =>
      ["finished", "quality_approved"].includes(r.status),
    ).length;
    const inProd = rows.filter(
      (r: ProductionControlReportRowsItem) => r.status === "in_production",
    ).length;
    return { totalLiters, finished, inProd };
  }, [rows]);

  const handleExport = () => {
    downloadCSV(
      `relatorio-producao-${new Date().toISOString().split("T")[0]}.csv`,
      [
        "Data produção",
        "Turno",
        "Produto",
        "Quantidade",
        "Unidade",
        "Lote/Fabricação",
        "Status",
        "Qualidade",
        "Responsável",
      ],
      rows.map((r: ProductionControlReportRowsItem) => [
        fmtDateTime(r.productionDate),
        r.shift ? shiftLabel[r.shift] : "—",
        r.productName,
        fmtNumber(r.quantityProduced, r.unit === "liter" ? 2 : 0),
        r.unit,
        r.lotCode,
        statusLabel[r.status] ?? r.status,
        statusLabel[r.qualityStatus] ?? r.qualityStatus,
        r.responsible,
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile
          label="Lotes no período"
          value={fmtNumber(rows.length)}
          hint={`${totals.inProd} em produção`}
          tone="info"
        />
        <KpiTile
          label="Volume produzido (L)"
          value={`${fmtNumber(totals.totalLiters, 2)} L`}
          hint="apenas itens em litros"
          tone="primary"
        />
        <KpiTile
          label="Lotes finalizados"
          value={fmtNumber(totals.finished)}
          hint="prontos ou aprovados"
          tone="success"
        />
      </div>

      <ReportShell
        icon={Package}
        accent="info"
        title="Relatório de Controle de Produção"
        description="Lotes produzidos com turno, status e responsável"
        onExport={handleExport}
      >
        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum lote no período"
            description="Lotes de produção aparecerão aqui assim que forem cadastrados."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
                  <TableHead className="font-semibold text-foreground">
                    Data produção
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Turno
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Produto
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right">
                    Quantidade
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Lote / Fabricação
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Qualidade
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Responsável
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: ProductionControlReportRowsItem) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm whitespace-nowrap">
                      {fmtDateTime(r.productionDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.shift ? (
                        <Badge
                          variant="outline"
                          className="bg-muted/40 text-foreground border-border/60 font-medium"
                        >
                          {shiftLabel[r.shift]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {r.productName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {fmtNumber(r.quantityProduced, r.unit === "liter" ? 2 : 0)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {r.unit === "liter"
                          ? "L"
                          : r.unit === "kg"
                            ? "kg"
                            : r.unit === "box"
                              ? "cx"
                              : "un"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.lotCode}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.qualityStatus} />
                    </TableCell>
                    <TableCell className="text-sm">{r.responsible}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ReportShell>
    </div>
  );
}

// ===== Raw Material Receipt =====
function RawMaterialReceiptTab() {
  const { data, isLoading } = useGetRawMaterialReceiptReport();
  const rows = data?.rows ?? [];

  const totals = useMemo(() => {
    const totalKg = rows.reduce(
      (acc: number, r: RawMaterialReceiptReportRowsItem) => acc + r.quantityKg,
      0,
    );
    const received = rows.filter(
      (r: RawMaterialReceiptReportRowsItem) => r.status === "received",
    ).length;
    const pending = rows.filter(
      (r: RawMaterialReceiptReportRowsItem) => r.status === "pending",
    ).length;
    return { totalKg, received, pending };
  }, [rows]);

  const handleExport = () => {
    downloadCSV(
      `relatorio-recebimento-${new Date().toISOString().split("T")[0]}.csv`,
      [
        "Data",
        "Nº Nota Fiscal",
        "Produto",
        "Fornecedor",
        "Quantidade (kg)",
        "Qualidade",
        "Responsável",
        "Status",
      ],
      rows.map((r: RawMaterialReceiptReportRowsItem) => [
        fmtDateTime(r.entryDate),
        r.invoiceNumber,
        r.productName,
        r.supplier,
        fmtNumber(r.quantityKg, 2),
        r.quality,
        r.responsible,
        statusLabel[r.status] ?? r.status,
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile
          label="Recebimentos no período"
          value={fmtNumber(rows.length)}
          hint={`${totals.pending} pendentes de conferência`}
          tone="info"
        />
        <KpiTile
          label="Volume recebido"
          value={`${fmtNumber(totals.totalKg, 2)} kg`}
          hint="matéria-prima total"
          tone="primary"
        />
        <KpiTile
          label="Cargas confirmadas"
          value={fmtNumber(totals.received)}
          hint="aprovadas no recebimento"
          tone="success"
        />
      </div>

      <ReportShell
        icon={Inbox}
        accent="success"
        title="Controle de Recebimento de Matéria-prima"
        description="Notas fiscais, fornecedores e status de cada entrada"
        onExport={handleExport}
      >
        {isLoading ? (
          <TableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nenhum recebimento no período"
            description="Entradas de matéria-prima aparecerão aqui com nota fiscal e responsável."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
                  <TableHead className="font-semibold text-foreground">
                    Data
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Nº Nota Fiscal
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Produto
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Fornecedor
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right">
                    Quantidade
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Qualidade
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Responsável
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: RawMaterialReceiptReportRowsItem) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm whitespace-nowrap">
                      {fmtDateTime(r.entryDate)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {r.productName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.supplier}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {fmtNumber(r.quantityKg, 2)}{" "}
                      <span className="text-xs text-muted-foreground">kg</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${qualityColor[r.quality] ?? ""} font-medium capitalize`}
                      >
                        {r.quality}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.responsible}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ReportShell>
    </div>
  );
}

// ===== Skeleton =====
function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Carregando {cols} colunas…
      </p>
    </div>
  );
}
