
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export function useDashboardData(timeRange: TimeRange = 'all') {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', timeRange],
    queryFn: async () => {
      // Calculate date range based on selection
      const now = new Date();
      let startDate = new Date(2000, 0, 1); // Default to an old date for 'all'
      let endDate = new Date(now.getFullYear() + 1, 0, 1); // Future date for 'all'
      
      switch (timeRange) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }

      // Get total revenue within the time range
      const { data: revenue } = await supabase
        .from('receipts')
        .select('total, cost, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      const totalRevenue = revenue?.reduce((sum, receipt) => {
        const total = receipt.total || 0;
        const cost = receipt.cost || 0;
        return sum + (total - cost);
      }, 0) || 0;

      // Get active clients count
      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Get new clients within time range
      const { count: newClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get receipts count for selected time range
      const { count: periodReceipts, data: receiptsData } = await supabase
        .from('receipts')
        .select('id, created_at, total, advance_payment, balance', { count: 'exact' })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      // Get total receipts count
      const { count: totalReceipts } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true });

      // Get products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      // Get average sale value
      const avgSaleValue = periodReceipts && periodReceipts > 0 
        ? totalRevenue / periodReceipts 
        : 0;

      // Get unpaid balance
      const totalUnpaidBalance = receiptsData?.reduce((sum, receipt) => sum + (receipt.balance || 0), 0) || 0;
      
      // Get monthly data for charts
      const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, i);
        return {
          month: format(date, 'MMM'),
          startDate: startOfMonth(date).toISOString(),
          endDate: endOfMonth(date).toISOString(),
        };
      }).reverse();

      const monthlyRevenuePromises = lastSixMonths.map(async ({ month, startDate, endDate }) => {
        const { data } = await supabase
          .from('receipts')
          .select('total')
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        
        const monthlyTotal = data?.reduce((sum, receipt) => sum + (receipt.total || 0), 0) || 0;
        
        return {
          month,
          revenue: monthlyTotal
        };
      });

      const monthlyRevenue = await Promise.all(monthlyRevenuePromises);

      // Get top product categories
      const { data: receiptItemsWithProducts } = await supabase
        .from('receipt_items')
        .select(`
          quantity, price, 
          products:product_id (name)
        `)
        .not('product_id', 'is', null);

      // Group products by name
      const productSales = receiptItemsWithProducts?.reduce((acc, item) => {
        const productName = item.products?.name || 'Unknown';
        if (!acc[productName]) {
          acc[productName] = { 
            name: productName, 
            count: 0,
            revenue: 0
          };
        }
        acc[productName].count += item.quantity || 0;
        acc[productName].revenue += (item.price * item.quantity) || 0;
        return acc;
      }, {} as Record<string, {name: string, count: number, revenue: number}>);

      const topProducts = Object.values(productSales || {})
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalRevenue,
        activeClients: activeClients || 0,
        newClients: newClients || 0,
        periodReceipts: periodReceipts || 0,
        totalReceipts: totalReceipts || 0,
        productsCount: productsCount || 0,
        avgSaleValue,
        totalUnpaidBalance,
        monthlyRevenue,
        topProducts,
        timeRange
      };
    }
  });

  return { stats, isLoading: isStatsLoading };
}
