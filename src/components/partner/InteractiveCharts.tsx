/**
 * Interactive Charts Component
 * 
 * Advanced data visualization with interactive charts
 * for partner dashboard analytics and reporting.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Maximize2,
  RotateCcw,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getPartnerChartData, ChartData } from '@/services/partnerAnalyticsService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
}

interface InteractiveChartsProps {
  partnerId: string;
  onExport: (format: 'csv' | 'pdf') => void;
}

export function InteractiveCharts({ partnerId, onExport }: InteractiveChartsProps) {
  const [selectedChart, setSelectedChart] = useState('earnings');
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // State for real data
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Fetch chart data
  const fetchChartData = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 6);
      }
      
      const chartData = await getPartnerChartData(partnerId, startDate, endDate);
      setData(chartData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Impossible de charger les données des graphiques');
    } finally {
      setLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = async (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    await fetchChartData();
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChartData();
    setRefreshing(false);
  };

  // Load data on mount and when partnerId changes
  useEffect(() => {
    fetchChartData();
  }, [partnerId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Chargement des graphiques...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!data) {
    return (
      <Alert>
        <AlertDescription>
          Aucune donnée de graphique disponible pour cette période.
        </AlertDescription>
      </Alert>
    );
  }

  // Earnings Chart Data
  const earningsChartData: ChartData = {
    labels: data.monthlyEarnings?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Revenus (€)',
        data: data.monthlyEarnings?.map(item => item.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      },
      {
        label: 'Clients',
        data: data.monthlyEarnings?.map(item => item.customers) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2
      }
    ]
  };

  // Conversion Funnel Data
  const funnelChartData: ChartData = {
    labels: data.conversionFunnel?.map(item => item.step) || [],
    datasets: [
      {
        label: 'Nombre d\'utilisateurs',
        data: data.conversionFunnel?.map(item => item.count) || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Sources Chart Data
  const sourcesChartData: ChartData = {
    labels: data.topSources?.map(item => item.source) || [],
    datasets: [
      {
        label: 'Parrainages',
        data: data.topSources?.map(item => item.referrals) || [],
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2
      },
      {
        label: 'Conversions',
        data: data.topSources?.map(item => item.conversions) || [],
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2
      }
    ]
  };

  const renderEarningsChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Évolution des Revenus</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Graphique des revenus</p>
          <p className="text-sm text-gray-400">Données: {data.monthlyEarnings?.length || 0} mois</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.monthlyEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0)}
          </div>
          <div className="text-sm text-blue-600">Total des revenus</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data.monthlyEarnings?.reduce((sum, item) => sum + item.customers, 0) || 0}
          </div>
          <div className="text-sm text-green-600">Total des clients</div>
        </div>
      </div>
    </div>
  );

  const renderFunnelChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Entonnoir de Conversion</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Graphique en entonnoir</p>
          <p className="text-sm text-gray-400">Étapes: {data.conversionFunnel?.length || 0}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.conversionFunnel?.map((step, index) => (
          <div key={step.step} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">{step.step}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{step.count}</span>
              <span className="text-sm text-gray-500">{formatPercentage(step.percentage)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSourcesChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sources de Parrainage</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Graphique des sources</p>
          <p className="text-sm text-gray-400">Sources: {data.topSources?.length || 0}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.topSources?.map((source, index) => (
          <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">#{index + 1}</Badge>
              <span className="font-medium">{source.source}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{source.referrals} parrainages</div>
                <div className="text-xs text-gray-500">{source.conversions} conversions</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  {formatCurrency(source.revenue)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSelectedChart = () => {
    switch (selectedChart) {
      case 'earnings':
        return renderEarningsChart();
      case 'funnel':
        return renderFunnelChart();
      case 'sources':
        return renderSourcesChart();
      default:
        return renderEarningsChart();
    }
  };

  return (
    <Card className={`${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Graphiques Interactifs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedChart} onValueChange={setSelectedChart}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="earnings">Revenus</SelectItem>
                <SelectItem value="funnel">Entonnoir</SelectItem>
                <SelectItem value="sources">Sources</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderSelectedChart()}
      </CardContent>
    </Card>
  );
}
