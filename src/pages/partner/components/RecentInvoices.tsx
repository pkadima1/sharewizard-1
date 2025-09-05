import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { InvoiceEntry } from '../types/dashboard';
import { useTranslation } from 'react-i18next';
import { Receipt } from 'lucide-react';

interface RecentInvoicesProps {
  invoices: InvoiceEntry[];
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const { t } = useTranslation('partners');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('invoices.status.paid')}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t('invoices.status.pending')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('invoices.status.cancelled')}</Badge>;
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

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('dashboard.recentInvoices')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('dashboard.noInvoicesYet')}</p>
            <p className="text-sm">{t('dashboard.invoicesWillAppear')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {t('dashboard.recentInvoices')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.slice(0, 5).map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{invoice.customerEmail}</span>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('invoices.invoiceId')}: {invoice.invoiceId}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${invoice.amount.toFixed(2)}</div>
                <div className="text-sm text-green-600 font-medium">
                  +${invoice.commission.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(invoice.creditedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {invoices.length > 5 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.showingFirst', { count: 5, total: invoices.length })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
