import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Factory, 
  PackageSearch, 
  Map, 
  Truck, 
  BarChart3, 
  Citrus, 
  Boxes,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/raw-materials", label: "Raw Materials", icon: Citrus },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/traceability", label: "Traceability", icon: Map },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-[#1A1A1A] text-white border-r border-[#2C2C2C] shrink-0 fixed inset-y-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-[#2C2C2C]">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Citrus className="w-6 h-6 text-primary fill-primary/20" />
          <span>OrangeTrack</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 custom-scrollbar">
        <div className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
          Main Menu
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-white/50 group-hover:text-white")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#2C2C2C]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all cursor-pointer group">
          <Settings className="w-4 h-4 text-white/50 group-hover:text-white" />
          Settings
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all cursor-pointer group mt-1">
          <LogOut className="w-4 h-4 text-white/50 group-hover:text-white" />
          Sign Out
        </div>
      </div>
    </aside>
  );
}
