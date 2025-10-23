import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceData {
  name: string;
  resolvedTickets: number;
  averageTime: number;
  rating: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const chartData = data.map(item => ({
    name: item.name.split(' ')[0], // First name only for better display
    resolved: item.resolvedTickets,
    avgTime: item.averageTime,
    rating: item.rating
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Resolved: <span className="font-semibold text-foreground">{data.resolved}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Avg. Time: <span className="font-semibold text-foreground">{data.avgTime}h</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Rating: <span className="font-semibold text-foreground">⭐ {data.rating.toFixed(1)}</span>
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
          Top Performers
        </CardTitle>
        <CardDescription>
          Staff performance comparison
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
                label={{ value: 'Tickets', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="resolved" 
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="Resolved Tickets"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
