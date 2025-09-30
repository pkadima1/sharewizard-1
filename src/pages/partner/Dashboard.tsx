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
import ConversionAnalyticsDashboard from '../../components/partner/ConversionAnalyticsDashboard';
import EnhancedPartnerDashboard from './EnhancedPartnerDashboard';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function PartnerDashboard() {
  // Use the enhanced dashboard by default
  return <EnhancedPartnerDashboard />;
}
