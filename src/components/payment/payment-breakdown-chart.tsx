'use client';

import { useState, useEffect } from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calculatePaymentBreakdown, PaymentBreakdownOutput } from '@/ai/flows/payment-breakdown-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PaymentBreakdownChartProps {
  totalPrice: number;
}

const COLORS = {
  landlord: 'hsl(var(--primary))',
  platform: 'hsl(var(--accent))',
  tenant: 'hsl(var(--secondary))',
};

export function PaymentBreakdownChart({ totalPrice }: PaymentBreakdownChartProps) {
  const [breakdown, setBreakdown] = useState<PaymentBreakdownOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getBreakdown() {
      try {
        setLoading(true);
        const result = await calculatePaymentBreakdown({ totalPrice });
        setBreakdown(result);
      } catch (error) {
        console.error('Failed to calculate payment breakdown:', error);
      } finally {
        setLoading(false);
      }
    }
    getBreakdown();
  }, [totalPrice]);

  if (loading || !breakdown) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const data = [
    { name: 'Landlord', value: breakdown.landlordAmount, percentage: breakdown.landlordPercentage },
    { name: 'Platform Fee', value: breakdown.platformAmount, percentage: breakdown.platformPercentage },
    { name: 'Tenant Earnings', value: breakdown.tenantAmount, percentage: breakdown.tenantPercentage },
  ];

  const colorMapping: Record<string, string> = {
    'Landlord': COLORS.landlord,
    'Platform Fee': COLORS.platform,
    'Tenant Earnings': COLORS.tenant,
  };

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={colorMapping[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              formatter={(value: number, name, props) => [`$${value.toFixed(2)}`, `${props.payload.name} (${props.payload.percentage}%)`]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colorMapping[entry.name] }}
              />
              <span>{entry.name}</span>
              <Badge variant="outline">{entry.percentage}%</Badge>
            </div>
            <span className="font-medium">${entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
