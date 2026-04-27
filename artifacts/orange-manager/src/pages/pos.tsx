import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useListCustomers,
  useCreateCustomer,
  useListProducts,
  useGetInventorySummary,
  useCreatePosOrder,
  useGetCashRegisterSummary,
  getGetCashRegisterSummaryQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Banknote,
  CreditCard,
  Smartphone,
  FileSignature,
  Package,
  Factory,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  Wallet,
  Receipt,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

type PaymentType = "cash" | "card" | "pix" | "promissory";
type FulfillmentSource = "stock" | "production";
type DeliveryType = "delivery" | "pickup";

const paymentOptions: {
  value: PaymentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "card", label: "Cartão", icon: CreditCard },
  { value: "pix", label: "Pix", icon: Smartphone },
  { value: "promissory", label: "Promissória", icon: FileSignature },
];

const paymentMethodLabel: Record<PaymentType, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "Pix",
  promissory: "Promissória",
};

const orderStatusLabel: Record<string, string> = {
  pending: "Pendente",
  in_production: "Em Produção",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const paymentStatusLabel: Record<string, string> = {
  pending: "Em Aberto",
  partial: "Parcial",
  paid: "Pago",
};

export default function POS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  // Product
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [quantity, setQuantity] = useState<string>("1");
  const [fulfillmentSource, setFulfillmentSource] =
    useState<FulfillmentSource>("stock");

  // Payment
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");

  // Delivery
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  // Data
  const { data: customerList, isLoading: loadingCustomers } = useListCustomers({
    limit: 50,
    ...(customerSearch && { search: customerSearch }),
  });
  const { data: productList } = useListProducts();
  const { data: inventorySummary } = useGetInventorySummary();
  const { data: cashSummary } = useGetCashRegisterSummary(undefined, {
    query: { refetchInterval: 15000 } as any,
  });

  const selectedCustomer = useMemo(
    () => customerList?.data?.find((c) => c.id === selectedCustomerId),
    [customerList, selectedCustomerId],
  );

  const selectedProduct = useMemo(
    () => productList?.find((p) => p.id === selectedProductId),
    [productList, selectedProductId],
  );

  const stockForProduct = useMemo(
    () =>
      inventorySummary?.find((i) => i.productId === selectedProductId)
        ?.availableQuantity ?? 0,
    [inventorySummary, selectedProductId],
  );

  const qtyNum = Number(quantity) || 0;
  const totalPrice = (selectedProduct?.pricePerUnit ?? 0) * qtyNum;
  const amountPaidNum = Number(amountPaid) || 0;
  const change = amountPaidNum - totalPrice;

  const insufficientStock =
    fulfillmentSource === "stock" && qtyNum > stockForProduct;

  const createCustomer = useCreateCustomer();
  const createOrder = useCreatePosOrder();

  const resetForm = () => {
    setSelectedCustomerId(null);
    setCustomerSearch("");
    setSelectedProductId(null);
    setQuantity("1");
    setFulfillmentSource("stock");
    setPaymentType("cash");
    setAmountPaid("");
    setDeliveryType("pickup");
    setDeliveryAddress("");
    setScheduledAt("");
    setNotes("");
  };

  const canSubmit =
    selectedCustomerId &&
    selectedProductId &&
    qtyNum > 0 &&
    !insufficientStock &&
    (deliveryType === "pickup" ||
      (deliveryAddress.trim().length > 0 && scheduledAt.length > 0));

  const handleSubmit = async () => {
    if (!canSubmit || !selectedCustomerId || !selectedProductId) return;
    try {
      await createOrder.mutateAsync({
        data: {
          customerId: selectedCustomerId,
          productId: selectedProductId,
          quantity: qtyNum,
          paymentType,
          amountPaid: amountPaidNum,
          fulfillmentSource,
          deliveryType,
          ...(deliveryType === "delivery" && {
            deliveryAddress,
            scheduledAt: new Date(scheduledAt).toISOString(),
          }),
          ...(notes && { notes }),
        },
      });
      toast({
        title: "Pedido registrado",
        description: `Total ${BRL(totalPrice)} • ${paymentMethodLabel[paymentType]}`,
      });
      queryClient.invalidateQueries({
        queryKey: getGetCashRegisterSummaryQueryKey(),
      });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      resetForm();
    } catch (e: any) {
      toast({
        title: "Erro ao registrar pedido",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Caixa"
        description="Frente de caixa: cadastro de pedidos, pagamentos e entregas."
      />

      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: form */}
          <div className="xl:col-span-2 space-y-6">
            {/* CUSTOMER */}
            <Card className="p-5 shadow-sm border-border/50">
              <SectionHeader
                step={1}
                title="Cliente"
                action={
                  <NewCustomerDialog
                    open={newCustomerOpen}
                    onOpenChange={setNewCustomerOpen}
                    onCreated={(id) => {
                      setSelectedCustomerId(id);
                      setCustomerSearch("");
                      setNewCustomerOpen(false);
                    }}
                    createCustomer={createCustomer}
                    toast={toast}
                  />
                }
              />

              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-lg border bg-primary/5 px-4 py-3">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedCustomer.cnpj} • {selectedCustomer.phone}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId(null)}
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CNPJ ou e-mail..."
                      className="pl-9"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                    {loadingCustomers ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3">
                          <Skeleton className="h-4 w-40" />
                        </div>
                      ))
                    ) : customerList?.data?.length ? (
                      customerList.data.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="w-full text-left p-3 hover:bg-muted/50 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.cnpj}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {c.totalOrders} pedidos
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Nenhum cliente encontrado.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* PRODUCT */}
            <Card className="p-5 shadow-sm border-border/50">
              <SectionHeader step={2} title="Pedido" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Produto</Label>
                  <Select
                    value={selectedProductId?.toString() ?? ""}
                    onValueChange={(v) => setSelectedProductId(Number(v))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productList?.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} — {BRL(p.pricePerUnit)}/{p.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">
                    Quantidade {selectedProduct ? `(${selectedProduct.unit})` : ""}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="mt-4">
                  <Label className="text-xs">Origem</Label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <SourceCard
                      active={fulfillmentSource === "stock"}
                      onClick={() => setFulfillmentSource("stock")}
                      icon={Package}
                      title="Pegar do estoque"
                      caption={`${stockForProduct.toFixed(2)} ${selectedProduct.unit} disponível`}
                      warning={insufficientStock ? "Estoque insuficiente" : undefined}
                    />
                    <SourceCard
                      active={fulfillmentSource === "production"}
                      onClick={() => setFulfillmentSource("production")}
                      icon={Factory}
                      title="Mandar produzir"
                      caption="Cria um lote de produção"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* PAYMENT */}
            <Card className="p-5 shadow-sm border-border/50">
              <SectionHeader step={3} title="Pagamento" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = paymentType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentType(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border px-4 py-4 transition",
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {BRL(totalPrice)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Valor recebido</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={paymentType === "promissory" ? "0,00" : "0,00"}
                    className="mt-1"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {change >= 0 ? "Troco" : "Restante"}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold mt-1",
                      change < 0 ? "text-amber-700" : "text-emerald-700",
                    )}
                  >
                    {BRL(Math.abs(change))}
                  </div>
                </div>
              </div>
            </Card>

            {/* DELIVERY */}
            <Card className="p-5 shadow-sm border-border/50">
              <SectionHeader step={4} title="Entrega" />
              <div className="grid grid-cols-2 gap-3">
                <SourceCard
                  active={deliveryType === "pickup"}
                  onClick={() => setDeliveryType("pickup")}
                  icon={Store}
                  title="Retirada no balcão"
                  caption="Cliente busca o pedido"
                />
                <SourceCard
                  active={deliveryType === "delivery"}
                  onClick={() => setDeliveryType("delivery")}
                  icon={Truck}
                  title="Entrega"
                  caption="Endereço + horário"
                />
              </div>

              {deliveryType === "delivery" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Endereço de entrega</Label>
                    <Input
                      className="mt-1"
                      placeholder="Rua, número, bairro, cidade"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                    {selectedCustomer?.address && (
                      <button
                        type="button"
                        className="text-[11px] text-primary mt-1 hover:underline"
                        onClick={() =>
                          setDeliveryAddress(
                            `${selectedCustomer.address}, ${selectedCustomer.city} - ${selectedCustomer.state}`,
                          )
                        }
                      >
                        Usar endereço do cadastro
                      </button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Data e hora</Label>
                    <Input
                      type="datetime-local"
                      className="mt-1"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder="Opcional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </Card>

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={createOrder.isPending}
              >
                Limpar
              </Button>
              <Button
                size="lg"
                className="gap-2 min-w-44"
                disabled={!canSubmit || createOrder.isPending}
                onClick={handleSubmit}
              >
                {createOrder.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Finalizar pedido
              </Button>
            </div>
          </div>

          {/* RIGHT: cash register summary */}
          <div className="space-y-4">
            <Card className="p-5 shadow-sm border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Caixa de hoje</h3>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(), "d MMM yyyy", { locale: ptBR })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SummaryStat
                  icon={Wallet}
                  label="Recebido"
                  value={BRL(cashSummary?.totalReceived ?? 0)}
                  tone="emerald"
                />
                <SummaryStat
                  icon={Receipt}
                  label="Em aberto"
                  value={BRL(cashSummary?.totalPending ?? 0)}
                  tone="amber"
                />
                <SummaryStat
                  icon={Clock}
                  label="Em aberto"
                  value={`${cashSummary?.ordersOpen ?? 0} pedidos`}
                  tone="slate"
                />
                <SummaryStat
                  icon={CheckCircle2}
                  label="Concluídos"
                  value={`${cashSummary?.ordersCompleted ?? 0} pedidos`}
                  tone="slate"
                />
              </div>

              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                  Recebido por método
                </div>
                <div className="space-y-1.5">
                  {paymentOptions.map((opt) => {
                    const Icon = opt.icon;
                    const v =
                      cashSummary?.receivedByMethod?.[opt.value] ?? 0;
                    return (
                      <div
                        key={opt.value}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </span>
                        <span className="font-medium tabular-nums">
                          {BRL(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-5 shadow-sm border-border/50">
              <h3 className="text-sm font-semibold mb-3">Últimos pedidos</h3>
              {cashSummary?.recentOrders?.length ? (
                <div className="space-y-2">
                  {cashSummary.recentOrders.slice(0, 8).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">
                          {o.orderNumber}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {o.customerName} • {o.productName}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                        <span className="text-xs font-semibold tabular-nums">
                          {BRL(o.totalPrice)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] py-0 px-1.5",
                            o.paymentStatus === "paid" &&
                              "bg-emerald-50 text-emerald-700 border-emerald-200",
                            o.paymentStatus === "partial" &&
                              "bg-blue-50 text-blue-700 border-blue-200",
                            o.paymentStatus === "pending" &&
                              "bg-amber-50 text-amber-700 border-amber-200",
                          )}
                        >
                          {paymentStatusLabel[o.paymentStatus]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Nenhum pedido hoje.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  step,
  title,
  action,
}: {
  step: number;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
          {step}
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function SourceCard({
  active,
  onClick,
  icon: Icon,
  title,
  caption,
  warning,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  caption: string;
  warning?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border px-4 py-3 transition",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/40",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", active && "text-primary")} />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{caption}</div>
      {warning && (
        <div className="text-[11px] text-red-600 mt-1">{warning}</div>
      )}
    </button>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "slate";
}) {
  const tones = {
    emerald: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    slate: "text-slate-700 bg-slate-50",
  } as const;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center",
            tones[tone],
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-base font-semibold mt-2 tabular-nums">{value}</div>
    </div>
  );
}

function NewCustomerDialog({
  open,
  onOpenChange,
  onCreated,
  createCustomer,
  toast,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: number) => void;
  createCustomer: ReturnType<typeof useCreateCustomer>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.cnpj || !form.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, CNPJ e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    try {
      const created = await createCustomer.mutateAsync({
        data: {
          name: form.name,
          cnpj: form.cnpj,
          phone: form.phone,
          email: form.email || `${form.cnpj}@sem-email.local`,
          address: form.address || "—",
          city: form.city || "—",
          state: form.state || "—",
        },
      });
      toast({ title: "Cliente cadastrado" });
      onCreated(created.id);
      setForm({
        name: "",
        cnpj: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
      });
    } catch (e: any) {
      toast({
        title: "Erro ao cadastrar",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos para incluir no caixa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Nome *</Label>
            <Input className="mt-1" value={form.name} onChange={set("name")} />
          </div>
          <div>
            <Label className="text-xs">CNPJ / CPF *</Label>
            <Input className="mt-1" value={form.cnpj} onChange={set("cnpj")} />
          </div>
          <div>
            <Label className="text-xs">Telefone *</Label>
            <Input
              className="mt-1"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">E-mail</Label>
            <Input
              type="email"
              className="mt-1"
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Endereço</Label>
            <Input
              className="mt-1"
              value={form.address}
              onChange={set("address")}
            />
          </div>
          <div>
            <Label className="text-xs">Cidade</Label>
            <Input className="mt-1" value={form.city} onChange={set("city")} />
          </div>
          <div>
            <Label className="text-xs">UF</Label>
            <Input
              className="mt-1"
              value={form.state}
              onChange={set("state")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createCustomer.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={createCustomer.isPending}>
            {createCustomer.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
