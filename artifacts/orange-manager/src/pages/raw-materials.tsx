import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useListRawMaterials } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Sprout } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const qualityLabel: Record<string, string> = {
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômico',
};

const ALL = "__all__";

export default function RawMaterials() {
  const { data: materials, isLoading } = useListRawMaterials();
  const [search, setSearch] = useState("");
  const [qualityFilter, setQualityFilter] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (materials ?? []).filter(m => {
      if (qualityFilter !== ALL && m.quality !== qualityFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q) ||
        (m.invoiceNumber ?? "").toLowerCase().includes(q) ||
        (m.origin ?? "").toLowerCase().includes(q)
      );
    });
  }, [materials, search, qualityFilter]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'premium': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'economy': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="Matéria-Prima"
        description="Registre entradas de laranjas e matérias-primas."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar Entrada
          </Button>
        }
      />

      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <Card className="shadow-sm border-border/50">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Sprout className="w-3.5 h-3.5" />
              </div>
              Recebimentos
            </div>
            <div className="flex flex-1 items-center gap-3 sm:justify-end">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por fornecedor, NF ou origem..."
                  className="pl-9 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Qualidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas qualidades</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="standard">Padrão</SelectItem>
                  <SelectItem value="economy">Econômico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Brix</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length ? (
                filtered.map((material) => (
                  <TableRow key={material.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-primary">{material.invoiceNumber || '-'}</TableCell>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{material.supplier}</span>
                        {material.origin && <span className="text-xs text-muted-foreground">{material.origin}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{material.quantityKg.toLocaleString('pt-BR')} kg</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getQualityColor(material.quality)}>
                        {qualityLabel[material.quality] || material.quality}
                      </Badge>
                    </TableCell>
                    <TableCell>{material.brixLevel ? `${Number(material.brixLevel).toFixed(1)}°Bx` : '-'}</TableCell>
                    <TableCell className="text-sm">{material.responsible || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(material.entryDate), "d MMM yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Nenhum recebimento encontrado.
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
