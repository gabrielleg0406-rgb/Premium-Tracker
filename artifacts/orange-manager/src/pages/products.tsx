import { PageHeader } from "@/components/layout/PageHeader";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Citrus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const typeLabel: Record<string, string> = {
  juice: 'Suco',
  fruit: 'Fruta',
  byproduct: 'Subproduto',
};

export default function Products() {
  const { data: products, isLoading } = useListProducts();

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Catálogo de Produtos" 
        description="Gerencie o portfólio de produtos que você comercializa."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        }
      />
      
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i} className="shadow-sm border-border/50">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-20 rounded-full mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : products?.length ? (
            products.map((product) => (
              <Card key={product.id} className="shadow-sm border-border/50 hover:shadow-md transition-shadow group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      {product.type === 'juice' ? <Package className="w-5 h-5" /> : <Citrus className="w-5 h-5" />}
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {typeLabel[product.type] || product.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-4">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] text-sm">
                    {product.description || "Nenhuma descrição fornecida."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Preço</span>
                      <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.pricePerUnit)}
                        <span className="text-muted-foreground text-xs font-normal"> / {product.unit}</span>
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Editar</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/30">
              <Package className="w-8 h-8 mb-3 text-muted-foreground/50" />
              <p>Nenhum produto encontrado. Crie seu primeiro produto para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
