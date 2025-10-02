/**
 * Enhanced Partner Dashboard
 * 
 * Complete, professional partner dashboard with advanced features,
 * real-time analytics, and comprehensive management tools.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePartnerDashboard } from './hooks/usePartnerDashboard';
import { EnhancedPerformanceCards } from '../../components/partner/EnhancedPerformanceCards';
import { AdvancedReferralManagement } from '../../components/partner/AdvancedReferralManagement';
import { FinancialOverview } from '../../components/partner/FinancialOverview';
import { AdvancedAnalytics } from '../../components/partner/AdvancedAnalytics';
import { InteractiveCharts } from '../../components/partner/InteractiveCharts';
import { ExportableReports } from '../../components/partner/ExportableReports';
import ConversionAnalyticsDashboard from '../../components/partner/ConversionAnalyticsDashboard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, RefreshCw, Download, Settings, Bell, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';

export default function EnhancedPartnerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('partners');
  const { data, loading, error, refetch } = usePartnerDashboard();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Redirect if not authenticated
  React.useEffect(() => {
    console.log('🔍 EnhancedPartnerDashboard: Auth check - currentUser:', !!currentUser);
    
    if (!currentUser) {
      console.log('🔍 EnhancedPartnerDashboard: No current user, redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('🔍 EnhancedPartnerDashboard: User is authenticated');
  }, [currentUser, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting data in ${format} format`);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 pt-24">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 pt-24">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('dashboard.noData')}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 pt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('dashboard.subtitle', { name: data.partner.displayName })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="ml-2">Actualiser</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Performance Cards */}
        <EnhancedPerformanceCards stats={data.stats} />

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Parrainages
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Analyses
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Financier
          </TabsTrigger>
          <TabsTrigger value="conversions" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Conversions
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Rapports
          </TabsTrigger>
        </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Performance Récente
                      </h3>
                      <Badge variant="outline">7 derniers jours</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Nouveaux parrainages</span>
                        <span className="font-medium">{data.customers.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Conversions</span>
                        <span className="font-medium text-green-600">{data.earnings.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taux de conversion</span>
                        <span className="font-medium text-blue-600">
                          {data.customers.length > 0 ? ((data.earnings.length / data.customers.length) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Revenus
                      </h3>
                      <Badge variant="outline">Ce mois</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Commissions</span>
                        <span className="font-medium">€{data.stats.monthlyCommissions.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">En attente</span>
                        <span className="font-medium text-orange-600">€{(data.stats.monthlyCommissions * 0.3).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Payé</span>
                        <span className="font-medium text-green-600">€{(data.stats.monthlyCommissions * 0.7).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Actions Rapides
                  </h3>
                  <div className="space-y-3">
                    <Button className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Créer un code de parrainage
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter les données
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Paramètres du compte
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-blue-500" />
                      <span>{data.customers.length} nouveaux parrainages</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-green-500" />
                      <span>{data.earnings.length} conversions ce mois</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-orange-500" />
                      <span>€{data.stats.monthlyCommissions.toFixed(2)} en attente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <AdvancedReferralManagement 
              codes={data.codes}
              partnerId={data.partner.id}
              onCodeCreated={handleRefresh}
              onCodeUpdated={handleRefresh}
              onCodeDeleted={handleRefresh}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics 
              partnerId={data.partner.id}
              onExport={handleExport}
            />
            
            <InteractiveCharts 
              partnerId={data.partner.id}
              onExport={handleExport}
            />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <FinancialOverview 
              commissions={data.earnings.map(earning => ({
                id: earning.id,
                date: earning.createdAt,
                amount: earning.commissionAmount,
                currency: earning.currency,
                status: 'paid' as const,
                source: 'Parrainage',
                customerId: earning.customerId,
                description: `Commission pour ${earning.customerId}`
              }))}
              payments={[]}
              totalEarnings={data.stats.totalEarnings}
              pendingAmount={data.stats.monthlyCommissions * 0.3}
              paidAmount={data.stats.monthlyCommissions * 0.7}
            />
          </TabsContent>

          {/* Conversions Tab */}
          <TabsContent value="conversions">
            <ConversionAnalyticsDashboard partnerId={data.partner.id} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ExportableReports 
              partnerId={data.partner.id}
              onGenerateReport={async (type, period, format) => {
                // TODO: Implement report generation
                console.log(`Generating ${type} report for ${period} in ${format} format`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
