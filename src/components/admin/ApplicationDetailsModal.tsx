/**
 * ApplicationDetailsModal.tsx - Partner Application Details Modal
 * 
 * Purpose: Modal for viewing comprehensive partner application details
 * Features: Complete application information display, organized sections
 */

import React from 'react';
import { Timestamp } from 'firebase/firestore';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// Icons
import { 
  Eye, 
  Mail, 
  Building, 
  Globe, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Languages,
  Target,
  FileText,
  ExternalLink,
  MapPin,
  Percent,
  Hash
} from 'lucide-react';

// Types
interface PartnerApplication {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  portfolioUrl?: string;
  experienceNote?: string;
  languages?: string[];
  timezone?: string;
  expectedClients?: number;
  description?: string;
  marketingPreferences?: {
    emailMarketing?: boolean;
    smsMarketing?: boolean;
    partnerNewsletter?: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'pending' | 'active' | 'rejected';
  approvedByUid?: string;
  approvedByEmail?: string;
  approvedAt?: Timestamp;
  rejectedByUid?: string;
  rejectedByEmail?: string;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
  commissionRate?: number;
}

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: PartnerApplication;
  t: any;
}

const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  isOpen,
  onClose,
  application,
  t
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {t('status.pending')}
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('status.approved')}
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          {t('status.rejected')}
        </Badge>;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString();
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            {t('details.title')}
          </DialogTitle>
          <DialogDescription>
            {t('details.subtitle', { name: application.displayName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {application.displayName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {application.email}
              </p>
            </div>
            {getStatusBadge(application.status)}
          </div>

          <Separator />

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('details.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.displayName')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">{application.displayName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.email')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">{application.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.company')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">
                    {application.companyName || t('details.notProvided')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.website')}
                  </Label>
                  {application.website ? (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 dark:text-white">{application.website}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openUrl(application.website!)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t('details.notProvided')}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('details.experience')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.expectedClients')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">
                    {application.expectedClients || t('details.notProvided')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.timezone')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">
                    {application.timezone || t('details.notProvided')}
                  </p>
                </div>
              </div>
              
              {application.languages && application.languages.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.languages')}
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {application.languages.map((lang, index) => (
                      <Badge key={index} variant="outline">
                        <Languages className="h-3 w-3 mr-1" />
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {application.experienceNote && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.experienceNote')}
                  </Label>
                  <p className="text-gray-900 dark:text-white mt-2 whitespace-pre-wrap">
                    {application.experienceNote}
                  </p>
                </div>
              )}

              {application.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.description')}
                  </Label>
                  <p className="text-gray-900 dark:text-white mt-2 whitespace-pre-wrap">
                    {application.description}
                  </p>
                </div>
              )}

              {application.portfolioUrl && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.portfolio')}
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-gray-900 dark:text-white">{application.portfolioUrl}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openUrl(application.portfolioUrl!)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marketing Preferences */}
          {application.marketingPreferences && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t('details.marketing')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={application.marketingPreferences.emailMarketing ? "default" : "secondary"}>
                      {application.marketingPreferences.emailMarketing ? "✓" : "✗"}
                    </Badge>
                    <span className="text-sm">{t('details.emailMarketing')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={application.marketingPreferences.smsMarketing ? "default" : "secondary"}>
                      {application.marketingPreferences.smsMarketing ? "✓" : "✗"}
                    </Badge>
                    <span className="text-sm">{t('details.smsMarketing')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={application.marketingPreferences.partnerNewsletter ? "default" : "secondary"}>
                      {application.marketingPreferences.partnerNewsletter ? "✓" : "✗"}
                    </Badge>
                    <span className="text-sm">{t('details.partnerNewsletter')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('details.submission')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.submittedAt')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(application.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.status')}
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(application.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Information (if approved/rejected) */}
          {(application.status === 'active' || application.status === 'rejected') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('details.review')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {application.status === 'active' ? t('details.reviewedBy') : t('details.reviewedBy')}
                    </Label>
                    <p className="text-gray-900 dark:text-white">
                      {application.status === 'active' 
                        ? application.approvedByEmail 
                        : application.rejectedByEmail}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {application.status === 'active' ? t('details.reviewedAt') : t('details.reviewedAt')}
                    </Label>
                    <p className="text-gray-900 dark:text-white">
                      {application.status === 'active' 
                        ? (application.approvedAt ? formatDate(application.approvedAt) : t('details.notApplicable'))
                        : (application.rejectedAt ? formatDate(application.rejectedAt) : t('details.notApplicable'))}
                    </p>
                  </div>
                </div>

                {application.status === 'active' && application.commissionRate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('details.commissionRate')}
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Percent className="h-4 w-4" />
                      <p className="text-gray-900 dark:text-white">
                        {(application.commissionRate * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}

                {application.status === 'rejected' && application.rejectionReason && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('details.reviewNote')}
                    </Label>
                    <p className="text-gray-900 dark:text-white mt-2 whitespace-pre-wrap">
                      {application.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            {t('actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsModal;
