
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  className 
}: StatCardProps) => (
  <Card className={cn("hover-transition overflow-hidden", className)}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
    </CardHeader>
    <CardContent className="p-6 pt-4">
      <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
      {description && (
        <CardDescription className="text-xs">{description}</CardDescription>
      )}
      {trend && (
        <div className="flex items-center mt-2">
          <span 
            className={cn(
              "text-xs font-medium inline-flex items-center px-2 py-0.5 rounded-full",
              trend.positive 
                ? "text-green-800 bg-green-100" 
                : "text-red-800 bg-red-100"
            )}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground ml-2">{trend.label}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default StatCard;
