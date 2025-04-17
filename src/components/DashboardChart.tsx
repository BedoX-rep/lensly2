import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chart from "@/components/ui/chart";
import { TimeRangeSelector } from "@/components/TimeRangeSelector";
import { supabase } from "@/integrations/supabase/client";
import { TimeRange } from "@/hooks/useDashboardData";
import { 
  format, parseISO, addHours, startOfDay, endOfDay, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  startOfYear, endOfYear, eachHourOfInterval, 
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  getHours, getDate, getMonth, getDay
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface DashboardChartProps {
  title?: string;
  description?: string;
}

const TIMEZONE = 'Africa/Casablanca';

const DashboardChart = ({ title, description }: DashboardChartProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("week");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [selectedTimeRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const now = toZonedTime(new Date(), TIMEZONE);
      let start, end;

      switch (selectedTimeRange) {
        case 'today':
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case 'week':
          start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
          end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
          break;
        case 'month':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'year':
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        default:
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
          break;
      }

      const { data: receipts, error } = await supabase
        .from("receipts")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching receipts:", error);
        return;
      }

      const processedData = processDataByTimeRange(receipts || [], selectedTimeRange, start, end);
      setChartData(processedData);
    } catch (error) {
      console.error("Error in fetchRevenueData:", error);
      setChartData(getEmptyDataStructure(selectedTimeRange));
    } finally {
      setIsLoading(false);
    }
  };

  const processDataByTimeRange = (receipts: any[], timeRange: TimeRange, start: Date, end: Date) => {
    if (!receipts || receipts.length === 0) {
      return getEmptyDataStructure(timeRange, start, end);
    }

    switch (timeRange) {
      case 'today':
        return processHourlyData(receipts, start, end);
      case 'week':
        return processDailyData(receipts, start, end);
      case 'month':
        return processDateData(receipts, start, end);
      case 'year':
        return processMonthlyData(receipts, start, end);
      case 'all':
        return processMonthlyData(receipts, start, end);
      default:
        return processDailyData(receipts, start, end);
    }
  };

  const processHourlyData = (receipts: any[], start: Date, end: Date) => {
    const hours = eachHourOfInterval({ start, end });
    
    const hourlyData = hours.map(hourDate => {
      const hour = getHours(hourDate);
      return {
        name: format(hourDate, 'h a'), // Format: "1 AM", "2 PM", etc.
        revenue: 0,
        hour: hour
      };
    });

    receipts.forEach(receipt => {
      const receiptDate = toZonedTime(parseISO(receipt.created_at), TIMEZONE);
      const hour = getHours(receiptDate);
      
      const dataIndex = hourlyData.findIndex(data => data.hour === hour);
      if (dataIndex !== -1) {
        hourlyData[dataIndex].revenue += parseFloat(receipt.total || 0);
      }
    });

    return hourlyData;
  };

  const processDailyData = (receipts: any[], start: Date, end: Date) => {
    const days = eachDayOfInterval({ start, end });

    const dailyData = days.map(day => {
      return {
        name: format(day, 'EEE'), // Short day name: "Mon", "Tue", etc.
        fullName: format(day, 'EEEE'), // Full day name for tooltip
        revenue: 0,
        date: format(day, 'yyyy-MM-dd')
      };
    });

    receipts.forEach(receipt => {
      const receiptDate = toZonedTime(parseISO(receipt.created_at), TIMEZONE);
      const dateStr = format(receiptDate, 'yyyy-MM-dd');
      
      const dataIndex = dailyData.findIndex(data => data.date === dateStr);
      if (dataIndex !== -1) {
        dailyData[dataIndex].revenue += parseFloat(receipt.total || 0);
      }
    });

    return dailyData;
  };

  const processDateData = (receipts: any[], start: Date, end: Date) => {
    const dates = eachDayOfInterval({ start, end });

    const dateData = dates.map(date => {
      return {
        name: format(date, 'd'), // Day of month: "1", "2", etc.
        fullDate: format(date, 'MMM d, yyyy'), // Full date for tooltip
        revenue: 0,
        date: format(date, 'yyyy-MM-dd')
      };
    });

    receipts.forEach(receipt => {
      const receiptDate = toZonedTime(parseISO(receipt.created_at), TIMEZONE);
      const dateStr = format(receiptDate, 'yyyy-MM-dd');
      
      const dataIndex = dateData.findIndex(data => data.date === dateStr);
      if (dataIndex !== -1) {
        dateData[dataIndex].revenue += parseFloat(receipt.total || 0);
      }
    });

    return dateData;
  };

  const processMonthlyData = (receipts: any[], start: Date, end: Date) => {
    const months = eachMonthOfInterval({ start, end });

    const monthlyData = months.map(month => {
      return {
        name: format(month, 'MMM'), // Short month name: "Jan", "Feb", etc.
        fullName: format(month, 'MMMM yyyy'), // Full month name for tooltip
        revenue: 0,
        month: getMonth(month)
      };
    });

    receipts.forEach(receipt => {
      const receiptDate = toZonedTime(parseISO(receipt.created_at), TIMEZONE);
      const month = getMonth(receiptDate);
      
      const dataIndex = monthlyData.findIndex(data => data.month === month);
      if (dataIndex !== -1) {
        const total = parseFloat(receipt.total || 0);
        const cost = parseFloat(receipt.cost || 0);
        monthlyData[dataIndex].revenue += (total - cost);
      }
    });

    return monthlyData;
  };

  const getEmptyDataStructure = (timeRange: TimeRange, start?: Date, end?: Date) => {
    const now = toZonedTime(new Date(), TIMEZONE);
    
    start = start || (() => {
      switch (timeRange) {
        case 'today': return startOfDay(now);
        case 'week': return startOfWeek(now, { weekStartsOn: 1 });
        case 'month': return startOfMonth(now);
        case 'year': return startOfYear(now);
        default: return startOfWeek(now, { weekStartsOn: 1 });
      }
    })();
    
    end = end || (() => {
      switch (timeRange) {
        case 'today': return endOfDay(now);
        case 'week': return endOfWeek(now, { weekStartsOn: 1 });
        case 'month': return endOfMonth(now);
        case 'year': return endOfYear(now);
        default: return endOfWeek(now, { weekStartsOn: 1 });
      }
    })();

    switch (timeRange) {
      case 'today':
        return processHourlyData([], start, end);
      case 'week':
        return processDailyData([], start, end);
      case 'month':
        return processDateData([], start, end);
      case 'year':
        return processMonthlyData([], start, end);
      case 'all':
        return processMonthlyData([], start, end);
      default:
        return processDailyData([], start, end);
    }
  };

  const formatXAxisTick = (value: string) => {
    if (!value) return '';
    
    return value;
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      
      let labelText = label;
      if (selectedTimeRange === 'week' && item.fullName) {
        labelText = item.fullName;
      } else if (selectedTimeRange === 'month' && item.fullDate) {
        labelText = item.fullDate;
      } else if ((selectedTimeRange === 'year' || selectedTimeRange === 'all') && item.fullName) {
        labelText = item.fullName;
      }
      
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{labelText}</p>
          <p className="text-sm">Revenue: DH{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <Card className="col-span-3 animate-fade-in hover-transition">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title || "Revenue Trend"}</CardTitle>
          <TimeRangeSelector 
            value={selectedTimeRange} 
            onChange={(range) => setSelectedTimeRange(range)} 
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description || `Revenue data by ${selectedTimeRange === 'today' ? 'hour' : selectedTimeRange === 'month' ? 'date' : selectedTimeRange === 'week' ? 'day' : 'month'}`}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Chart
            data={chartData}
            type="bar"
            xAxis="name"
            yAxis="revenue"
            height={300}
            colors={["#0369a1"]}
            showLegend={false}
            formatXAxisTick={formatXAxisTick}
            customTooltip={customTooltip}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardChart;
