/**
 * PendingPartners.tsx - Admin Partner Applications Console
 * 
 * Purpose: Complete admin interface for managing partner applications
 * Features: Approve/reject applications, view details, commission management
 * 
 * Implementation:
 * - Tabbed interface for pending, approved, and rejected applications
 * - Real-time data synchronization with Firestore
 * - Mobile-first responsive design with Tailwind CSS
 * - Admin role guard for security
 * - Full localization support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  collection, 
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// Icons
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  Globe,
  Mail,
  Building,
  ExternalLink,
  Copy,
  RefreshCw,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Modal Components
import ApprovalModal from '@/components/admin/ApprovalModal';
import RejectionModal from '@/components/admin/RejectionModal';
import ApplicationDetailsModal from '@/components/admin/ApplicationDetailsModal';
import PartnerApplicationDiagnostic from '@/components/admin/PartnerApplicationDiagnostic';

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

/**
 * Application Card Component (Mobile)
 */
const ApplicationCard = ({ 
  application, 
  onApprove, 
  onReject, 
  onViewDetails,
  t 
}: {
  application: PartnerApplication;
  onApprove: (application: PartnerApplication) => void;
  onReject: (application: PartnerApplication) => void;
  onViewDetails: (application: PartnerApplication) => void;
  t: any;
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
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {application.displayName}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {application.email}
            </CardDescription>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('details.company')}:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {application.companyName || t('details.notProvided')}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('details.expectedClients')}:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {application.expectedClients || t('details.notProvided')}
              </p>
            </div>
          </div>

          {/* Languages */}
          {application.languages && application.languages.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('details.languages')}:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {application.languages.map((lang, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Submitted Date */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3 inline mr-1" />
            {t('details.submittedAt')}: {formatDate(application.createdAt)}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(application)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('actions.viewDetails')}
            </Button>
            
            {application.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onApprove(application)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {t('actions.approve')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(application)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('actions.reject')}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main PendingPartners Component
 */
const PendingPartners = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('adminPartners');
  
  // State management
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Admin check - exact match with backend logic
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com' || 
                  currentUser?.uid === 'admin-uid-here';

  // Cloud Functions
  const approvePartner = httpsCallable(functions, 'approvePartner');
  const rejectPartner = httpsCallable(functions, 'rejectPartner');

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const applicationsQuery = query(
        collection(db, 'partners'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
        const applicationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PartnerApplication[];
        
        setApplications(applicationsData);
        setLoading(false);
      }, (error) => {
        console.error('Error listening to applications:', error);
        toast({
          title: t('errors.fetchFailed'),
          description: t('errors.fetchFailedDesc'),
          variant: 'destructive',
        });
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: t('errors.fetchFailed'),
        description: t('errors.fetchFailedDesc'),
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [isAdmin, toast, t]);

  // Initial data load
  useEffect(() => {
    const unsubscribe = fetchApplications();
    return () => {
      if (unsubscribe) unsubscribe;
    };
  }, [fetchApplications]);

  // Filter applications based on search and tab
  const filteredApplications = applications.filter(application => {
    const matchesSearch = !searchTerm || 
      application.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || application.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Handle approve application
  const handleApprove = (application: PartnerApplication) => {
    setSelectedApplication(application);
    setShowApprovalModal(true);
  };

  // Handle reject application
  const handleReject = (application: PartnerApplication) => {
    setSelectedApplication(application);
    setShowRejectionModal(true);
  };

  // Handle view details
  const handleViewDetails = (application: PartnerApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  // Handle approval submission
  const handleApprovalSubmit = async (commissionRate: number, desiredCode?: string) => {
    if (!selectedApplication) return;
    
    setApproving(true);
    try {
      const result = await approvePartner({
        applicationId: selectedApplication.id,
        commissionRate,
        desiredCode
      });
      
      const data = result.data as any;
      
      if (data.success) {
        toast({
          title: t('messages.applicationApproved'),
          description: t('approval.successDesc', { rate: (commissionRate * 100).toFixed(0) }),
        });
        
        // Show success with code info
        if (data.code) {
          toast({
            title: t('approval.codeGenerated', { code: data.code }),
            description: t('approval.linkGenerated', { link: `/signup?ref=${data.code}` }),
          });
        }
        
        setShowApprovalModal(false);
        setSelectedApplication(null);
      }
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: t('errors.approvalFailed'),
        description: error.message || t('errors.approvalFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setApproving(false);
    }
  };

  // Handle rejection submission
  const handleRejectionSubmit = async (reviewNote: string) => {
    if (!selectedApplication) return;
    
    setRejecting(true);
    try {
      const result = await rejectPartner({
        applicationId: selectedApplication.id,
        reviewNote
      });
      
      const data = result.data as any;
      
      if (data.success) {
        toast({
          title: t('messages.applicationRejected'),
          description: t('messages.applicationRejectedDesc'),
        });
        
        setShowRejectionModal(false);
        setSelectedApplication(null);
      }
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: t('errors.rejectionFailed'),
        description: error.message || t('errors.rejectionFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setRejecting(false);
    }
  };

  // Admin route guard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-blue-500" />
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {applications.length} {t('totalApplications')}
              </span>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('actions.refresh')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Diagnostic Component - Temporary */}
        <div className="mb-6">
          <PartnerApplicationDiagnostic />
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              {t('tabs.pending')} ({applications.filter(a => a.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="active">
              {t('tabs.approved')} ({applications.filter(a => a.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {t('tabs.rejected')} ({applications.filter(a => a.status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          {['pending', 'active', 'rejected'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('noResults')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('noResultsDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('columns.name')}</TableHead>
                          <TableHead>{t('columns.email')}</TableHead>
                          <TableHead>{t('columns.languages')}</TableHead>
                          <TableHead>{t('columns.expectedClients')}</TableHead>
                          <TableHead>{t('columns.submitted')}</TableHead>
                          <TableHead>{t('columns.status')}</TableHead>
                          <TableHead>{t('columns.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell className="font-medium">
                              {application.displayName}
                              {application.companyName && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {application.companyName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{application.email}</TableCell>
                            <TableCell>
                              {application.languages && application.languages.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {application.languages.slice(0, 2).map((lang, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {lang}
                                    </Badge>
                                  ))}
                                  {application.languages.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{application.languages.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">{t('details.notProvided')}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {application.expectedClients || t('details.notProvided')}
                            </TableCell>
                            <TableCell>
                              {application.createdAt.toDate().toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {application.status === 'pending' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {t('status.pending')}
                                </Badge>
                              )}
                              {application.status === 'active' && (
                                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {t('status.approved')}
                                </Badge>
                              )}
                              {application.status === 'rejected' && (
                                <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {t('status.rejected')}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(application)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t('actions.viewDetails')}
                                  </DropdownMenuItem>
                                  
                                  {application.status === 'pending' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleApprove(application)}>
                                        <Check className="h-4 w-4 mr-2" />
                                        {t('actions.approve')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleReject(application)}>
                                        <X className="h-4 w-4 mr-2" />
                                        {t('actions.reject')}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden">
                    {filteredApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onViewDetails={handleViewDetails}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modals */}
      {selectedApplication && (
        <>
          <ApprovalModal
            isOpen={showApprovalModal}
            onClose={() => {
              setShowApprovalModal(false);
              setSelectedApplication(null);
            }}
            application={selectedApplication}
            onSubmit={handleApprovalSubmit}
            loading={approving}
            t={t}
          />
          
          <RejectionModal
            isOpen={showRejectionModal}
            onClose={() => {
              setShowRejectionModal(false);
              setSelectedApplication(null);
            }}
            application={selectedApplication}
            onSubmit={handleRejectionSubmit}
            loading={rejecting}
            t={t}
          />
          
          <ApplicationDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedApplication(null);
            }}
            application={selectedApplication}
            t={t}
          />
        </>
      )}
    </div>
  );
};

export default PendingPartners;
