
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductData {
  name: string;
  count: number;
  revenue: number;
}

interface ProductsChartProps {
  data: ProductData[];
  title: string;
  description?: string;
}

export const ProductsChart = ({ data, title, description }: ProductsChartProps) => {
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)', 
                 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.2)'];

  const chartData = data.map(item => ({
    name: item.name,
    value: item.revenue
  }));
  
  return (
    <Card className="col-span-3 xl:col-span-1 hover-transition h-full">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`DH${Number(value).toFixed(2)}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
