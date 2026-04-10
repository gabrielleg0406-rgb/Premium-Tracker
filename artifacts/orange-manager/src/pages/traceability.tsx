import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGetTraceabilityLot } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Map, Package, Truck, Beaker, CheckCircle2, Factory } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const stageLabel: Record<string, string> = {
  raw_material: 'Matéria-Prima',
  production: 'Produção',
  quality_control: 'Controle de Qualidade',
  inventory: 'Estoque',
  delivery: 'Entrega',
};

export default function Traceability() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedLot, setSearchedLot] = useState<string | null>(null);

  const { data: lotData, isLoading: isLoadingLot, isError } = useGetTraceabilityLot(
    searchedLot || "",
    { query: { enabled: !!searchedLot } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchedLot(searchQuery.trim());
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'raw_material': return <Package className="w-5 h-5 text-amber-500" />;
      case 'production': return <Factory className="w-5 h-5 text-blue-500" />;
      case 'quality_control': return <Beaker className="w-5 h-5 text-purple-500" />;
      case 'inventory': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'delivery': return <Truck className="w-5 h-5 text-primary" />;
      default: return <Map className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Rastreabilidade" 
        description="Acompanhe o ciclo de vida do produto do campo ao copo."
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
        <Card className="shadow-sm border-border/50 max-w-3xl mx-auto">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Digite o Código do Lote (ex: LOT-12345)..." 
                  className="pl-10 h-12 text-lg bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="px-8" disabled={!searchQuery.trim()}>
                Rastrear
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoadingLot && (
          <div className="max-w-4xl mx-auto space-y-8 mt-8">
            <Skeleton className="h-24 w-full" />
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="max-w-3xl mx-auto mt-12 py-12 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/30">
            <Map className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground mb-1">Lote não encontrado</p>
            <p>Nenhum registro de rastreabilidade encontrado para "{searchedLot}".</p>
          </div>
        )}

        {lotData && (
          <div className="max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="shadow-sm border-border/50 mb-8 bg-primary/5 border-primary/20">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Relatório de Rastreabilidade</p>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{lotData.lotCode}</h2>
                  <p className="text-muted-foreground mt-1">{lotData.productName}</p>
                </div>
                <Badge variant="outline" className="text-base px-4 py-1 bg-background border-primary/20 text-primary uppercase tracking-wider">
                  {stageLabel[lotData.currentStatus] || lotData.currentStatus.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>

            <div className="relative border-l-2 border-muted-foreground/20 ml-5 space-y-8 pb-8">
              {lotData.timeline.map((event) => (
                <div key={event.id} className="relative pl-8">
                  <div className="absolute -left-[21px] top-1 bg-background p-1 rounded-full border-2 border-muted-foreground/20">
                    {getStageIcon(event.stage)}
                  </div>
                  <Card className="shadow-sm border-border/50">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-lg text-foreground">{event.event}</h4>
                        <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md whitespace-nowrap">
                          {format(new Date(event.timestamp), "d 'de' MMMM yyyy • HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      
                      {event.actor && (
                        <p className="text-sm font-medium text-foreground mb-3">Por: {event.actor}</p>
                      )}

                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {Object.entries(event.metadata).map(([key, val]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="font-medium text-foreground">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
