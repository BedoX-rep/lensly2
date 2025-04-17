import React, { useState } from "react";
import { Eye, Users, Receipt, ShoppingBag, DollarSign, Wallet, ChevronUp, ChevronDown, TrendingUp, PieChart, BarChart } from "lucide-react";
import { useDashboardData, TimeRange } from "@/hooks/useDashboardData";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatCard } from "@/components/StatCard";
import DashboardChart from "@/components/DashboardChart";
import { TimeRangeSelector } from "@/components/TimeRangeSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { stats, isLoading } = useDashboardData(timeRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your optical store performance
            </p>
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Gross Income" 
            value={`DH${stats?.totalRevenue.toFixed(2) || '0.00'}`}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            description={`${stats?.timeRange !== 'all' ? `For ${stats?.timeRange}` : 'All time'}`}
          />
          <StatCard 
            title="Avg. Sale Value" 
            value={`DH${stats?.avgSaleValue.toFixed(2) || '0.00'}`}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            description={`${stats?.periodReceipts || 0} transaction${stats?.periodReceipts !== 1 ? 's' : ''}`}
          />
          <StatCard 
            title="Unpaid Balance" 
            value={`DH${stats?.totalUnpaidBalance.toFixed(2) || '0.00'}`}
            icon={<Wallet className="h-4 w-4 text-primary" />}
            description={`Across ${stats?.totalReceipts || 0} receipt${stats?.totalReceipts !== 1 ? 's' : ''}`}
          />
          <StatCard 
            title="Active Clients" 
            value={stats?.activeClients || 0}
            icon={<Users className="h-4 w-4 text-primary" />}
            description={`${stats?.newClients || 0} new in this period`}
            trend={stats?.newClients && stats?.activeClients ? {
              value: Math.round((stats.newClients / stats.activeClients) * 100),
              label: "growth rate",
              positive: true
            } : undefined}
          />
        </div>

        <div className="grid gap-6">
          <DashboardChart 
            title="Revenue Trend"
            description={`Revenue data by ${timeRange === 'today' ? 'hour' : timeRange === 'month' ? 'date' : timeRange === 'week' ? 'day' : 'month'}`}
          />
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="col-span-1 hover-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.productsCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total products in inventory</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 hover-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.periodReceipts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {timeRange === 'all' ? 'All time' : timeRange === 'today' ? 'Today' : `This ${timeRange}`}
              </p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 hover-transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newClients || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {timeRange === 'all' ? 'All time' : timeRange === 'today' ? 'Today' : `This ${timeRange}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default Dashboard;
