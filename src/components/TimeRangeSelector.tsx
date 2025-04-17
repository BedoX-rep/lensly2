
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeRange } from "@/hooks/useDashboardData";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export const TimeRangeSelector = ({ value, onChange }: TimeRangeSelectorProps) => {
  const ranges: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  const currentLabel = ranges.find(range => range.value === value)?.label || 'All Time';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{currentLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {ranges.map(range => (
          <DropdownMenuItem 
            key={range.value}
            onClick={() => onChange(range.value)}
            className={value === range.value ? "bg-primary/10 font-medium" : ""}
          >
            {range.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
