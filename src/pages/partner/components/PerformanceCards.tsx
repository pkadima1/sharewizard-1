import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { DollarSign, Users, TrendingDown, TrendingUp } from 'lucide-react';
import { DashboardStats } from '../types/dashboard';
import { useTranslation } from 'react-i18next';

interface PerformanceCardsProps {
  stats: DashboardStats;
}

export function PerformanceCards({ stats }: PerformanceCardsProps) {
  const { t } = useTranslation('partners');

  const cards = [
    {
      title: t('dashboard.monthlyCommissions'),
      value: `$${stats.monthlyCommissions.toFixed(2)}`,
      icon: DollarSign,
      description: t('dashboard.thisMonth'),
      color: 'text-green-600'
    },
    {
      title: t('dashboard.activeCustomers'),
      value: stats.activeCustomers.toString(),
      icon: Users,
      description: t('dashboard.currentlyActive'),
      color: 'text-blue-600'
    },
    {
      title: t('dashboard.churnRate'),
      value: `${stats.churnRate.toFixed(1)}%`,
      icon: TrendingDown,
      description: t('dashboard.last30Days'),
      color: 'text-red-600'
    },
    {
      title: t('dashboard.totalEarnings'),
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: TrendingUp,
      description: t('dashboard.allTime'),
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
