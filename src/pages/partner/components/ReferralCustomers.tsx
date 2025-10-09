import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ReferralCustomer } from '../types/dashboard';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

interface ReferralCustomersProps {
  customers: ReferralCustomer[];
}

export function ReferralCustomers({ customers }: ReferralCustomersProps) {
  const { t } = useTranslation('partners');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('customers.status.active')}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{t('customers.status.inactive')}</Badge>;
      case 'churned':
        return <Badge variant="destructive">{t('customers.status.churned')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (customers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('dashboard.referralCustomers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('dashboard.noCustomersYet')}</p>
            <p className="text-sm">{t('dashboard.customersWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('dashboard.referralCustomers')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customers.slice(0, 5).map((customer) => (
            <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{customer.displayName}</span>
                  {getStatusBadge(customer.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('customers.joined')}: {formatDate(customer.joinedAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${customer.totalSpent.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {t('customers.lastActivity')}: {formatDate(customer.lastActivity)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {customers.length > 5 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.showingFirst', { count: 5, total: customers.length })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
