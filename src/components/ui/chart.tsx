import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
  TooltipProps,
} from "recharts";

// Color palette
const colors = {
  primary: "#0369a1",
  secondary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  chart: [
    "#0369a1",
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
  ],
};

export type ChartData = Record<string, any>[];

interface ChartProps {
  data: ChartData;
  type: "line" | "bar" | "pie" | "area";
  xAxis?: string;
  yAxis?: string[] | string;
  height?: number;
  width?: string;
  className?: string;
  title?: string;
  colors?: string[];
  stacked?: boolean;
  dataKey?: string;
  nameKey?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  hideLegend?: boolean;
  renderLegend?: any;
  renderTooltip?: any;
  customTooltip?: React.FC<TooltipProps<any, any>>;
  onClick?: (data: any, index: number) => void;
  formatXAxisTick?: (value: any) => string;
}

const Chart = ({
  data,
  type,
  xAxis = "name",
  yAxis = "value",
  height = 300,
  width = "100%",
  className = "",
  title,
  colors: customColors,
  stacked = false,
  dataKey,
  nameKey = "name",
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  hideLegend = false,
  renderLegend,
  renderTooltip,
  customTooltip,
  onClick,
  formatXAxisTick,
}: ChartProps) => {
  const chartColors = customColors || colors.chart;
  const yAxisArray = Array.isArray(yAxis) ? yAxis : [yAxis];

  // Default formatter if none provided
  const defaultFormatXAxisTick = (value: any) => {
    return value !== undefined && value !== null ? value.toString() : '';
  };

  // Use custom formatter if provided, otherwise use default
  const tickFormatter = formatXAxisTick || defaultFormatXAxisTick;
  
  // Check if all data points have 0 values for the yAxis
  const allZeroValues = data.every(item => {
    for (const key of yAxisArray) {
      if (item[key] !== 0) return false;
    }
    return true;
  });

  return (
    <div className={`chart-container ${className}`}>
      {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
      <ResponsiveContainer width={width} height={height}>
        {type === "line" ? (
          <LineChart
            data={data}
            onClick={onClick ? (data) => onClick(data.activePayload?.[0]?.payload, data.activeTooltipIndex || 0) : undefined}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xAxis} 
              tickFormatter={tickFormatter}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis 
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(value) => `${value}`}
              domain={allZeroValues ? [0, 10] : ['auto', 'auto']}
            />
            {showTooltip && (customTooltip ? (
              <Tooltip content={(props) => customTooltip(props)} />
            ) : (
              <Tooltip />
            ))}
            {!hideLegend && showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                content={renderLegend}
              />
            )}

            {yAxisArray.map((key, index) => (
              <Line
                key={`line-${key}`}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                activeDot={{ r: 8 }}
              />
            ))}
            
            {allZeroValues && <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="3 3" />}
          </LineChart>
        ) : type === "bar" ? (
          <BarChart
            data={data}
            onClick={onClick ? (data) => onClick(data.activePayload?.[0]?.payload, data.activeTooltipIndex || 0) : undefined}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xAxis} 
              tickFormatter={tickFormatter}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis 
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(value) => `${value}`}
              domain={allZeroValues ? [0, 10] : ['auto', 'auto']}
            />
            {showTooltip && (customTooltip ? (
              <Tooltip content={(props) => customTooltip(props)} />
            ) : (
              <Tooltip formatter={(value, name) => [value, name]} />
            ))}
            {!hideLegend && showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                content={renderLegend}
              />
            )}

            {yAxisArray.map((key, index) => (
              <Bar
                key={`bar-${key}`}
                dataKey={key}
                fill={chartColors[index % chartColors.length]}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
            
            {allZeroValues && <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="3 3" />}
          </BarChart>
        ) : type === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey || yAxisArray[0]}
              nameKey={nameKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              onClick={onClick ? (_, index) => onClick(data[index], index) : undefined}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            {showTooltip && (customTooltip ? (
              <Tooltip content={(props) => customTooltip(props)} />
            ) : (
              <Tooltip />
            ))}
            {!hideLegend && showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                content={renderLegend}
              />
            )}
          </PieChart>
        ) : (
          <AreaChart
            data={data}
            onClick={onClick ? (data) => onClick(data.activePayload?.[0]?.payload, data.activeTooltipIndex || 0) : undefined}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xAxis} 
              tickFormatter={tickFormatter}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis 
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tickFormatter={(value) => `${value}`}
              domain={allZeroValues ? [0, 10] : ['auto', 'auto']}
            />
            {showTooltip && (customTooltip ? (
              <Tooltip content={(props) => customTooltip(props)} />
            ) : (
              <Tooltip />
            ))}
            {!hideLegend && showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                content={renderLegend}
              />
            )}

            {yAxisArray.map((key, index) => (
              <Area
                key={`area-${key}`}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                fill={chartColors[index % chartColors.length]}
                stackId={stacked ? "stack" : undefined}
                fillOpacity={0.3}
              />
            ))}
            
            {allZeroValues && <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="3 3" />}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
