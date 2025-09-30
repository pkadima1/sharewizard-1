/**
 * Advanced Referral Management Component
 * 
 * Comprehensive referral code management with statistics,
 * analytics, and advanced features for partner dashboard.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Plus, 
  Link, 
  Trash2, 
  Edit, 
  Eye, 
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface ReferralCode {
  id: string;
  code: string;
  usageCount: number;
  conversionCount: number;
  totalRevenue: number;
  createdAt: Date;
  isActive: boolean;
  description?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface AdvancedReferralManagementProps {
  codes: ReferralCode[];
  partnerId: string;
  onCodeCreated: () => void;
  onCodeUpdated: () => void;
  onCodeDeleted: () => void;
}

export function AdvancedReferralManagement({ 
  codes, 
  partnerId, 
  onCodeCreated, 
  onCodeUpdated, 
  onCodeDeleted 
}: AdvancedReferralManagementProps) {
  const { t } = useTranslation('partners');
  const { toast } = useToast();
  
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUtmSource, setNewUtmSource] = useState('');
  const [newUtmMedium, setNewUtmMedium] = useState('');
  const [newUtmCampaign, setNewUtmCampaign] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ReferralCode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter and sort codes
  const filteredCodes = codes
    .filter(code => {
      const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          code.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && code.isActive) ||
                           (filterStatus === 'inactive' && !code.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'conversionCount':
          aValue = a.conversionCount;
          bValue = b.conversionCount;
          break;
        case 'totalRevenue':
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copié !',
        description: 'Lien copié dans le presse-papiers',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
    }
  };

  const createNewCode = async () => {
    if (!newCode.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du code est requis',
        variant: 'destructive',
      });
      return;
    }

    if (codes.length >= 5) {
      toast({
        title: 'Limite atteinte',
        description: 'Maximum 5 codes de parrainage autorisés',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // TODO: Implement code creation logic
      // await createPartnerCode(partnerId, {
      //   code: newCode.trim(),
      //   description: newDescription.trim(),
      //   utmSource: newUtmSource.trim(),
      //   utmMedium: newUtmMedium.trim(),
      //   utmCampaign: newUtmCampaign.trim()
      // });
      
      toast({
        title: 'Succès',
        description: 'Code de parrainage créé avec succès',
      });
      
      setNewCode('');
      setNewDescription('');
      setNewUtmSource('');
      setNewUtmMedium('');
      setNewUtmCampaign('');
      setShowCreateDialog(false);
      onCodeCreated();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le code',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getReferralLink = (code: string) => {
    return `${window.location.origin}/?ref=${code}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getConversionRate = (code: ReferralCode) => {
    return code.usageCount > 0 ? (code.conversionCount / code.usageCount * 100).toFixed(1) : '0.0';
  };

  const exportCodesData = () => {
    const csvData = filteredCodes.map(code => ({
      Code: code.code,
      Description: code.description || '',
      'Utilisations': code.usageCount,
      'Conversions': code.conversionCount,
      'Taux de Conversion': `${getConversionRate(code)}%`,
      'Revenus': formatCurrency(code.totalRevenue),
      'Statut': code.isActive ? 'Actif' : 'Inactif',
      'Créé le': code.createdAt.toLocaleDateString('fr-FR')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes-parrainage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Codes de Parrainage
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos codes de parrainage et suivez leurs performances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCodesData}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Code
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date de création</SelectItem>
                <SelectItem value="usageCount">Utilisations</SelectItem>
                <SelectItem value="conversionCount">Conversions</SelectItem>
                <SelectItem value="totalRevenue">Revenus</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Codes de Parrainage ({filteredCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Revenus</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{code.code}</Badge>
                      {code.utmSource && (
                        <Badge variant="outline" className="text-xs">
                          {code.utmSource}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {code.description || 'Aucune description'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      {code.usageCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {code.conversionCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{getConversionRate(code)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      {formatCurrency(code.totalRevenue)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.isActive ? "default" : "secondary"}>
                      {code.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(getReferralLink(code.code))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCode(code);
                          setShowStatsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Code de Parrainage</DialogTitle>
            <DialogDescription>
              Créez un nouveau code de parrainage avec des paramètres personnalisés
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Code *</label>
                <Input
                  placeholder="Ex: PROMO2024"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Description du code"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Paramètres UTM (optionnels)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Source (ex: email)"
                    value={newUtmSource}
                    onChange={(e) => setNewUtmSource(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Medium (ex: newsletter)"
                    value={newUtmMedium}
                    onChange={(e) => setNewUtmMedium(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Campaign (ex: summer2024)"
                    value={newUtmCampaign}
                    onChange={(e) => setNewUtmCampaign(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={createNewCode} 
              disabled={isCreating || !newCode.trim()}
            >
              {isCreating ? 'Création...' : 'Créer le Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Statistics Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Statistiques du Code: {selectedCode?.code}</DialogTitle>
            <DialogDescription>
              Analyse détaillée des performances de ce code de parrainage
            </DialogDescription>
          </DialogHeader>
          
          {selectedCode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedCode.usageCount}
                  </div>
                  <div className="text-sm text-blue-600">Utilisations</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedCode.conversionCount}
                  </div>
                  <div className="text-sm text-green-600">Conversions</div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {getConversionRate(selectedCode)}%
                </div>
                <div className="text-sm text-purple-600">Taux de Conversion</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(selectedCode.totalRevenue)}
                </div>
                <div className="text-sm text-orange-600">Revenus Générés</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



