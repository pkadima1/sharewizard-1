import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthlyEarning } from '../types/dashboard';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../../components/ui/skeleton';

interface EarningsChartProps {
  data: MonthlyEarning[];
}

export function EarningsChart({ data }: EarningsChartProps) {
  const { t } = useTranslation('partners');

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.monthlyEarnings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    month: new Date(item.month).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    amount: item.amount,
    customers: item.customers
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.monthlyEarnings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'amount' ? `$${value.toFixed(2)}` : value,
                name === 'amount' ? t('dashboard.earnings') : t('dashboard.customers')
              ]}
              labelFormatter={(label) => t('dashboard.month', { month: label })}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
