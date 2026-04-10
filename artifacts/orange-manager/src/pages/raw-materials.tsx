import { PageHeader } from "@/components/layout/PageHeader";
import { useListRawMaterials } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const qualityLabel: Record<string, string> = {
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômico',
};

export default function RawMaterials() {
  const { data: materials, isLoading } = useListRawMaterials();

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
          <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por lote ou fornecedor..." className="pl-9 bg-background" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Material</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Brix</TableHead>
                <TableHead>Data de Entrada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : materials?.length ? (
                materials.map((material) => (
                  <TableRow key={material.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.supplier}</TableCell>
                    <TableCell>{material.quantityKg.toLocaleString('pt-BR')} kg</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getQualityColor(material.quality)}>
                        {qualityLabel[material.quality] || material.quality}
                      </Badge>
                    </TableCell>
                    <TableCell>{material.brixLevel ? `${Number(material.brixLevel).toFixed(1)}°Bx` : '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(material.entryDate), "d MMM yyyy", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhuma entrada de matéria-prima encontrada.
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
