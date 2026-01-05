import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "info" | "default";
  className?: string;
}

const variantStyles = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  default: "text-muted-foreground",
};

export function KPICard({ title, value, subtitle, icon: Icon, variant = "primary", className }: KPICardProps) {
  return (
    <div className={cn("stat-card animate-fade-in", className)}>
      <div className="flex flex-col items-center text-center">
        <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted", variantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className={cn("kpi-value mt-1", variantStyles[variant])}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
