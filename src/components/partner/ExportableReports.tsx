/**
 * Exportable Reports Component
 * 
 * Comprehensive reporting system with PDF and CSV export
 * functionality for partner analytics and financial data.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  FileText, 
  Table as TableIcon, 
  Calendar,
  Filter,
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { getPartnerReports } from '@/services/partnerAnalyticsService';

interface ReportData {
  id: string;
  title: string;
  type: 'financial' | 'analytics' | 'referrals' | 'conversions';
  period: string;
  createdAt: Date;
  status: 'ready' | 'generating' | 'error';
  size: string;
  format: 'pdf' | 'csv';
}

interface ExportableReportsProps {
  partnerId: string;
  onGenerateReport: (type: string, period: string, format: 'pdf' | 'csv') => Promise<void>;
}

export function ExportableReports({ partnerId, onGenerateReport }: ExportableReportsProps) {
  const [selectedType, setSelectedType] = useState('financial');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Real data for existing reports
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return DollarSign;
      case 'analytics':
        return BarChart3;
      case 'referrals':
        return Users;
      case 'conversions':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'financial':
        return 'Financier';
      case 'analytics':
        return 'Analytics';
      case 'referrals':
        return 'Parrainages';
      case 'conversions':
        return 'Conversions';
      default:
        return 'Autre';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default">Prêt</Badge>;
      case 'generating':
        return <Badge variant="secondary">Génération...</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  // Fetch reports data
  const fetchReports = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const reportsData = await getPartnerReports(partnerId);
      setReports(reportsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Impossible de charger les rapports');
    } finally {
      setLoading(false);
    }
  };

  // Load reports on mount
  useEffect(() => {
    fetchReports();
  }, [partnerId]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await onGenerateReport(selectedType, selectedPeriod, selectedFormat);
      
      // Add new report to list
      const newReport: ReportData = {
        id: Date.now().toString(),
        title: `Rapport ${getTypeLabel(selectedType)} - ${new Date().toLocaleDateString('fr-FR')}`,
        type: selectedType as any,
        period: selectedPeriod,
        createdAt: new Date(),
        status: 'ready',
        size: selectedFormat === 'pdf' ? '2.1 MB' : '456 KB',
        format: selectedFormat
      };
      
      setReports(prev => [newReport, ...prev]);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = (report: ReportData) => {
    // TODO: Implement actual download functionality
    console.log('Downloading report:', report);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 mr-2">⚠️</div>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rapports Exportables
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Générez et téléchargez vos rapports de performance
          </p>
        </div>
      </div>

      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un Nouveau Rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Type de Rapport</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financier</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="referrals">Parrainages</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-period">Période</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="90d">90 derniers jours</SelectItem>
                  <SelectItem value="1y">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-format">Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Rapports Existants ({filteredReports.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un rapport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="ready">Prêts</SelectItem>
                  <SelectItem value="generating">En cours</SelectItem>
                  <SelectItem value="error">Erreurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rapport</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const TypeIcon = getTypeIcon(report.type);
                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-gray-500">ID: {report.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(report.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {report.period}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.format === 'pdf' ? 'default' : 'secondary'}>
                        {report.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{report.size}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDate(report.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                          disabled={report.status !== 'ready'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Rapport Financier
              </h3>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
              Revenus, commissions et paiements
            </p>
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => {
                setSelectedType('financial');
                setSelectedFormat('pdf');
                handleGenerateReport();
              }}
            >
              Générer PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Analytics
              </h3>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 mb-3">
              Performance et tendances
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedType('analytics');
                setSelectedFormat('csv');
                handleGenerateReport();
              }}
            >
              Générer CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Parrainages
              </h3>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-3">
              Codes et performances
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedType('referrals');
                setSelectedFormat('pdf');
                handleGenerateReport();
              }}
            >
              Générer PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
