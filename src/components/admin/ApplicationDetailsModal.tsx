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

// Import shared types
import { PartnerApplication } from '@/types/partnerApplication';
import { validateLanguageData } from '@/utils/languageUtils';

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
                  <p className="text-gray-900 dark:text-white">{application.fullName || application.displayName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.email')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">{application.email}</p>
                </div>
                {application.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone
                    </Label>
                    <p className="text-gray-900 dark:text-white">{application.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.company')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">
                    {application.companyName || t('details.notProvided')}
                  </p>
                </div>
                {application.industry && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Industrie
                    </Label>
                    <p className="text-gray-900 dark:text-white">{application.industry}</p>
                  </div>
                )}
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
                {application.portfolioSamples && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Portfolio/Échantillons
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 dark:text-white">{application.portfolioSamples}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openUrl(application.portfolioSamples!)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
                {application.experienceLevel && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Niveau d'expérience
                    </Label>
                    <p className="text-gray-900 dark:text-white">
                      {application.experienceLevel.charAt(0).toUpperCase() + application.experienceLevel.slice(1)}
                    </p>
                  </div>
                )}
                {application.availability && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Disponibilité
                    </Label>
                    <p className="text-gray-900 dark:text-white">{application.availability}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.timezone')}
                  </Label>
                  <p className="text-gray-900 dark:text-white">
                    {application.timezone || t('details.notProvided')}
                  </p>
                </div>
              </div>
              
              {application.contentSkills && application.contentSkills.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Compétences en contenu
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {application.contentSkills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {application.languages && application.languages.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('details.languages')}
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {validateLanguageData(application.languages).map((lang, index) => (
                      <Badge key={index} variant="outline">
                        <Languages className="h-3 w-3 mr-1" />
                        {lang.language} ({lang.level})
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

          {/* Commission Tier Information */}
          {(application.commissionTier || application.partnerSourcedRate || application.epSourcedRate !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Informations de Commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.commissionTier && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Niveau de partenariat
                      </Label>
                      <Badge variant="outline" className="mt-1">
                        {application.commissionTier.charAt(0).toUpperCase() + application.commissionTier.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {application.partnerSourcedRate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Taux vos leads
                      </Label>
                      <p className="text-gray-900 dark:text-white">
                        {(application.partnerSourcedRate * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  {application.epSourcedRate !== undefined && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Taux nos leads
                      </Label>
                      <p className="text-gray-900 dark:text-white">
                        {application.epSourcedRate > 0 ? `${(application.epSourcedRate * 100).toFixed(0)}%` : 'Non éligible'}
                      </p>
                    </div>
                  )}
                  {application.canReceiveEPLeads !== undefined && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Peut recevoir nos leads
                      </Label>
                      <Badge variant={application.canReceiveEPLeads ? "default" : "secondary"}>
                        {application.canReceiveEPLeads ? "Oui" : "Non"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('details.marketingDesc')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{t('details.emailMarketing')}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('details.emailMarketingDesc')}</p>
                        </div>
                      </div>
                      <Badge variant={application.marketingPreferences.emailMarketing ? "default" : "secondary"}>
                        {application.marketingPreferences.emailMarketing ? "✓ Activé" : "✗ Désactivé"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">SMS</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{t('details.smsMarketing')}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('details.smsMarketingDesc')}</p>
                        </div>
                      </div>
                      <Badge variant={application.marketingPreferences.smsMarketing ? "default" : "secondary"}>
                        {application.marketingPreferences.smsMarketing ? "✓ Activé" : "✗ Désactivé"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">📧</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{t('details.partnerNewsletter')}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('details.partnerNewsletterDesc')}</p>
                        </div>
                      </div>
                      <Badge variant={application.marketingPreferences.partnerNewsletter ? "default" : "secondary"}>
                        {application.marketingPreferences.partnerNewsletter ? "✓ Activé" : "✗ Désactivé"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note :</strong> Ces préférences ont été définies par le candidat lors de l'inscription et peuvent être modifiées dans leurs paramètres de compte.
                    </p>
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
