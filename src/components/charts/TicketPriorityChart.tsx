import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PriorityData {
  priority: string;
  count: number;
  percentage: number;
}

interface TicketPriorityChartProps {
  data: PriorityData[];
}

const PRIORITY_COLORS = {
  low: '#3b82f6',      // Blue
  medium: '#f59e0b',   // Amber
  high: '#f97316',     // Orange
  critical: '#ef4444', // Red
};

export const TicketPriorityChart = ({ data }: TicketPriorityChartProps) => {
  // Filter out items with 0 count to avoid empty bars
  const chartData = data
    .filter(item => item.count > 0)
    .map(item => ({
      name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
      count: item.count,
      percentage: item.percentage,
      fill: PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || '#6b7280'
    }));

  // If no data, show a placeholder
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            Priority Distribution
          </CardTitle>
          <CardDescription>
            Distribution of tickets by priority level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">📊</div>
              <p>No priority data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-semibold text-foreground">{data.count}</span>
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
          Priority Distribution
        </CardTitle>
        <CardDescription>
          Distribution of tickets by priority level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
