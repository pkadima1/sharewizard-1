/**
 * Enhanced Performance Cards Component
 * 
 * Modern, responsive performance cards with advanced metrics
 * and real-time data visualization for partner dashboard.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EnhancedPerformanceCardsProps {
  stats: {
    monthlyCommissions: number;
    activeCustomers: number;
    churnRate: number;
    totalEarnings: number;
    conversionRate?: number;
    totalReferrals?: number;
    totalConversions?: number;
    averageOrderValue?: number;
    monthlyGrowth?: number;
  };
}

export function EnhancedPerformanceCards({ stats }: EnhancedPerformanceCardsProps) {
  const { t } = useTranslation('partners');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number, isPositive: boolean) => {
    if (value > 0) {
      return isPositive ? TrendingUp : TrendingDown;
    }
    return Activity;
  };

  const getTrendColor = (value: number, isPositive: boolean) => {
    if (value > 0) {
      return isPositive ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-500';
  };

  const cards = [
    {
      title: 'Commissions Mensuelles',
      value: formatCurrency(stats.monthlyCommissions),
      icon: DollarSign,
      description: 'Ce mois-ci',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      trend: stats.monthlyGrowth || 0,
      trendLabel: 'vs mois dernier',
      isPositive: true
    },
    {
      title: 'Clients Actifs',
      value: stats.activeCustomers.toString(),
      icon: Users,
      description: 'Actuellement actifs',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      trend: 0,
      trendLabel: 'Clients parrainés',
      isPositive: true
    },
    {
      title: 'Taux de Conversion',
      value: formatPercentage(stats.conversionRate || 0),
      icon: Target,
      description: 'Parrainages → Conversions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      trend: 0,
      trendLabel: 'Performance',
      isPositive: true,
      progress: stats.conversionRate || 0
    },
    {
      title: 'Revenus Totaux',
      value: formatCurrency(stats.totalEarnings),
      icon: BarChart3,
      description: 'Depuis le début',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      trend: 0,
      trendLabel: 'Cumulé',
      isPositive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        const TrendIcon = getTrendIcon(card.trend, card.isPositive);
        const trendColor = getTrendColor(card.trend, card.isPositive);
        
        return (
          <Card 
            key={index} 
            className={`hover:shadow-xl transition-all duration-300 hover:scale-105 ${card.bgColor} ${card.borderColor} border-2`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
                {card.trend !== 0 && (
                  <div className={`flex items-center space-x-1 ${trendColor}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {Math.abs(card.trend).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
                
                {card.progress !== undefined && (
                  <div className="space-y-1">
                    <Progress 
                      value={card.progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
                
                {card.trendLabel && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {card.trendLabel}
                    </span>
                    {card.trend !== 0 && (
                      <Badge 
                        variant={card.trend > 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {card.trend > 0 ? '↗' : '↘'} {Math.abs(card.trend).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}




