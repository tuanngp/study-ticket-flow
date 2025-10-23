import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TicketStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface TicketStatusChartProps {
  data: TicketStatusData[];
}

const COLORS = {
  open: '#3b82f6',      // Blue
  in_progress: '#f59e0b', // Amber
  resolved: '#10b981',   // Emerald
  closed: '#6b7280',     // Gray
};

export const TicketStatusChart = ({ data }: TicketStatusChartProps) => {
  // Filter out items with 0 count to avoid overlapping labels
  const chartData = data
    .filter(item => item.count > 0)
    .map(item => ({
      name: item.status.replace('_', ' ').toUpperCase(),
      value: item.count,
      percentage: item.percentage,
      fill: COLORS[item.status as keyof typeof COLORS] || '#6b7280'
    }));

  // If no data, show a placeholder
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            Ticket Status Distribution
          </CardTitle>
          <CardDescription>
            Current distribution of tickets by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">📊</div>
              <p>No tickets data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-semibold text-foreground">{data.value}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-semibold text-foreground">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          Ticket Status Distribution
        </CardTitle>
        <CardDescription>
          Current distribution of tickets by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage, value }) => 
                  value > 0 ? `${name}: ${percentage}%` : null
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>
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
