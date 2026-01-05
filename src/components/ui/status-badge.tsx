import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Inventory statuses
  Draft: "bg-warning/10 text-warning border-warning/20",
  Listed: "bg-success/10 text-success border-success/20",
  Sold: "bg-primary/10 text-primary border-primary/20",
  Returned: "bg-destructive/10 text-destructive border-destructive/20",
  Archived: "bg-muted text-muted-foreground border-muted",

  // Payout statuses
  Pending: "bg-warning/10 text-warning border-warning/20",
  Processing: "bg-info/10 text-info border-info/20",
  Paid: "bg-success/10 text-success border-success/20",
  "On Hold": "bg-destructive/10 text-destructive border-destructive/20",

  // Shipment statuses
  "Pending Label": "bg-warning/10 text-warning border-warning/20",
  "Label Created": "bg-info/10 text-info border-info/20",
  Shipped: "bg-primary/10 text-primary border-primary/20",
  "In Transit": "bg-info/10 text-info border-info/20",
  Delivered: "bg-success/10 text-success border-success/20",
  Problem: "bg-destructive/10 text-destructive border-destructive/20",

  // Return statuses
  Opened: "bg-warning/10 text-warning border-warning/20",
  "In Progress": "bg-info/10 text-info border-info/20",
  Resolved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",

  // Task statuses
  Todo: "bg-muted text-muted-foreground border-muted",
  Done: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-muted text-muted-foreground border-muted",

  // Priority levels
  Low: "bg-muted text-muted-foreground border-muted",
  Medium: "bg-info/10 text-info border-info/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground border-muted";
  
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium border", style, className)}
    >
      {status}
    </Badge>
  );
}
