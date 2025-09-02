import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePartnerDashboard } from './hooks/usePartnerDashboard';
import { PerformanceCards } from './components/PerformanceCards';
import { ReferralActions } from './components/ReferralActions';
import { EarningsChart } from './components/EarningsChart';
import { RecentInvoices } from './components/RecentInvoices';
import { ReferralCustomers } from './components/ReferralCustomers';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PartnerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('partners');
  const { data, loading, error } = usePartnerDashboard();

  // Redirect if not authenticated
  React.useEffect(() => {
    console.log('🔍 PartnerDashboard: Auth check - currentUser:', !!currentUser);
    
    if (!currentUser) {
      console.log('🔍 PartnerDashboard: No current user, redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('🔍 PartnerDashboard: User is authenticated');
  }, [currentUser, navigate]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('dashboard.noData')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle', { name: data.partner.displayName })}
        </p>
      </div>

      {/* Performance Cards */}
      <PerformanceCards stats={data.stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Actions & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <EarningsChart data={data.stats.monthlyEarnings} />
          <RecentInvoices invoices={data.invoices} />
        </div>

        {/* Right Column - Actions & Customers */}
        <div className="space-y-6">
          <ReferralActions 
            codes={data.codes}
            partnerId={data.partner.id}
            onCodeCreated={() => {
              // Refresh dashboard data
              window.location.reload();
            }}
          />
          <ReferralCustomers customers={data.customers} />
        </div>
      </div>
    </div>
  );
}
