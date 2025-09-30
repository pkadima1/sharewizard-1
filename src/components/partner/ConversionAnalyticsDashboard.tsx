/**
 * Conversion Analytics Dashboard Component
 * 
 * Displays comprehensive conversion tracking and analytics
 * for partner dashboards with real-time metrics.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  getPartnerConversionSummary,
  getPartnerConversionAnalytics,
  getPartnerConversionFunnel,
  formatConversionRate,
  formatCurrency,
  getTrendIndicator,
  getPeriodOptions,
  ConversionAnalytics,
  PartnerConversionSummary,
  ConversionFunnelStep
} from '@/services/conversionAnalyticsService';

// Icons
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  BarChart3,
  Calendar,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConversionAnalyticsDashboardProps {
  partnerId: string;
}

const ConversionAnalyticsDashboard: React.FC<ConversionAnalyticsDashboardProps> = ({ partnerId }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('partners');
  
  const [summary, setSummary] = useState<PartnerConversionSummary | null>(null);
  const [analytics, setAnalytics] = useState<ConversionAnalytics | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const periodOptions = getPeriodOptions();

  // Fetch conversion data
  const fetchConversionData = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    try {
      // Fetch summary
      const summaryData = await getPartnerConversionSummary(partnerId);
      setSummary(summaryData);
      
      // Fetch analytics for selected period
      const selectedPeriodOption = periodOptions.find(p => p.value === selectedPeriod);
      if (selectedPeriodOption) {
        const analyticsData = await getPartnerConversionAnalytics(
          partnerId,
          selectedPeriodOption.startDate,
          selectedPeriodOption.endDate
        );
        setAnalytics(analyticsData);
        
        // Fetch funnel data
        const funnelData = await getPartnerConversionFunnel(
          partnerId,
          selectedPeriodOption.startDate,
          selectedPeriodOption.endDate
        );
        setFunnel(funnelData);
      }
      
    } catch (error) {
      console.error('Error fetching conversion data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de conversion',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversionData();
    setRefreshing(false);
  };

  // Handle period change
  const handlePeriodChange = async (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    await fetchConversionData();
  };

  useEffect(() => {
    fetchConversionData();
  }, [partnerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Chargement des données de conversion...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <Alert>
        <AlertDescription>
          Aucune donnée de conversion disponible pour ce partenaire.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analyse des Conversions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi complet du parcours de conversion des utilisateurs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="ml-2">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Period Referrals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parrainages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.currentPeriod.referrals}</div>
            <p className="text-xs text-muted-foreground">
              Période actuelle
            </p>
          </CardContent>
        </Card>

        {/* Current Period Conversions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.currentPeriod.conversions}</div>
            <p className="text-xs text-muted-foreground">
              Taux: {formatConversionRate(summary.currentPeriod.conversionRate)}
            </p>
          </CardContent>
        </Card>

        {/* Current Period Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.currentPeriod.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Période actuelle
            </p>
          </CardContent>
        </Card>

        {/* Current Period Commission */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.currentPeriod.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              Période actuelle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Entonnoir de Conversion</CardTitle>
          <CardDescription>
            Parcours complet des utilisateurs du parrainage à la conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnel.map((step, index) => (
              <div key={step.step} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {step.step === 'referral' && 'Parrainage'}
                      {step.step === 'signup' && 'Inscription'}
                      {step.step === 'conversion' && 'Conversion'}
                      {step.step === 'subscription' && 'Abonnement'}
                    </Badge>
                    <span className="text-sm font-medium">{step.count} utilisateurs</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {step.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={step.percentage} className="h-2" />
                {step.averageTimeToNext && (
                  <p className="text-xs text-gray-500">
                    Temps moyen jusqu'à l'étape suivante: {step.averageTimeToNext.toFixed(1)} jours
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendances de Performance</CardTitle>
          <CardDescription>
            Évolution des métriques clés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Taux de Conversion:</span>
              <Badge variant={summary.trends.conversionRateTrend === 'up' ? 'default' : 
                           summary.trends.conversionRateTrend === 'down' ? 'destructive' : 'secondary'}>
                {getTrendIndicator(summary.trends.conversionRateTrend)}
                {summary.trends.conversionRateTrend === 'up' && 'En hausse'}
                {summary.trends.conversionRateTrend === 'down' && 'En baisse'}
                {summary.trends.conversionRateTrend === 'stable' && 'Stable'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Taux d'Abonnement:</span>
              <Badge variant={summary.trends.subscriptionRateTrend === 'up' ? 'default' : 
                           summary.trends.subscriptionRateTrend === 'down' ? 'destructive' : 'secondary'}>
                {getTrendIndicator(summary.trends.subscriptionRateTrend)}
                {summary.trends.subscriptionRateTrend === 'up' && 'En hausse'}
                {summary.trends.subscriptionRateTrend === 'down' && 'En baisse'}
                {summary.trends.subscriptionRateTrend === 'stable' && 'Stable'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Valeur:</span>
              <Badge variant={summary.trends.valueTrend === 'up' ? 'default' : 
                           summary.trends.valueTrend === 'down' ? 'destructive' : 'secondary'}>
                {getTrendIndicator(summary.trends.valueTrend)}
                {summary.trends.valueTrend === 'up' && 'En hausse'}
                {summary.trends.valueTrend === 'down' && 'En baisse'}
                {summary.trends.valueTrend === 'stable' && 'Stable'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé Historique</CardTitle>
          <CardDescription>
            Données cumulées depuis le début
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.historical.totalReferrals}</div>
              <p className="text-sm text-gray-500">Parrainages totaux</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{summary.historical.totalConversions}</div>
              <p className="text-sm text-gray-500">Conversions totales</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatConversionRate(summary.historical.lifetimeConversionRate)}
              </div>
              <p className="text-sm text-gray-500">Taux de conversion global</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(summary.historical.totalLifetimeCommission)}
              </div>
              <p className="text-sm text-gray-500">Commissions totales</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionAnalyticsDashboard;




