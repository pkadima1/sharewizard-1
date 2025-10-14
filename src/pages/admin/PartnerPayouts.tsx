/**
 * PartnerPayouts.tsx - Admin Partner Payout Management
 * 
 * Purpose: Allow admins to view partner earnings and process payouts
 * Features: View earnings, process payouts, reset revenue, maintain history
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Icons
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  CreditCard,
  History
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PartnerEarnings {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  currentEarnings: number;
  totalEarnings: number;
  totalReferrals: number;
  totalConversions: number;
  lastPayout?: Date;
  lastPayoutAmount?: number;
}

interface PayoutRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  processedAt: Date;
  processedBy: string;
  notes?: string;
  transactionId?: string;
}

const PartnerPayouts: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('partners');
  
  const [partners, setPartners] = useState<PartnerEarnings[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerEarnings | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com';

  // Fetch partner earnings data
  const fetchPartnerEarnings = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Fetch all partners - simplified query to avoid index issues
      const partnersQuery = query(
        collection(db, 'partners'),
        where('status', '==', 'active')
      );
      
      const partnersSnapshot = await getDocs(partnersQuery);
      const partnersData: PartnerEarnings[] = [];
      
      for (const partnerDoc of partnersSnapshot.docs) {
        const partnerData = partnerDoc.data();
        
        // Use partner stats directly instead of complex queries
        const currentEarnings = partnerData.stats?.totalCommissionEarned || 0;
        const totalEarnings = currentEarnings; // For now, use same value
        const totalPaid = partnerData.stats?.totalCommissionPaid || 0;
        
        partnersData.push({
          partnerId: partnerDoc.id,
          partnerName: partnerData.displayName,
          partnerEmail: partnerData.email,
          currentEarnings: currentEarnings - totalPaid, // Outstanding amount
          totalEarnings: currentEarnings,
          totalReferrals: partnerData.stats?.totalReferrals || 0,
          totalConversions: partnerData.stats?.totalConversions || 0,
          lastPayout: partnerData.stats?.lastPayoutAt ? 
            (partnerData.stats.lastPayoutAt.toDate ? 
              partnerData.stats.lastPayoutAt.toDate() : 
              new Date(partnerData.stats.lastPayoutAt)) : undefined,
          lastPayoutAmount: partnerData.stats?.lastPayoutAmount || 0
        });
      }
      
      setPartners(partnersData);
    } catch (error) {
      console.error('Error fetching partner earnings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch partner earnings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch payout history
  const fetchPayoutHistory = async () => {
    try {
      // Simplified query - just get all payouts without ordering to avoid index issues
      const payoutsQuery = collection(db, 'partnerPayouts');
      
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payoutsData: PayoutRecord[] = payoutsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          processedAt: data.processedAt?.toDate ? data.processedAt.toDate() : new Date(data.processedAt)
        };
      }) as PayoutRecord[];
      
      // Sort client-side to avoid index requirement
      payoutsData.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
      
      setPayouts(payoutsData);
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  };

  // Process payout
  const processPayout = async () => {
    if (!selectedPartner || !payoutAmount) return;
    
    setProcessingPayout(true);
    try {
      const amount = parseFloat(payoutAmount);
      
      if (amount <= 0 || amount > (selectedPartner.currentEarnings / 100)) {
        toast({
          title: 'Invalid Amount',
          description: 'Payout amount must be greater than 0 and not exceed current earnings',
          variant: 'destructive',
        });
        return;
      }
      
      // Create payout record
      const payoutRecord = {
        partnerId: selectedPartner.partnerId,
        partnerName: selectedPartner.partnerName,
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'USD',
        status: 'completed',
        processedAt: Timestamp.now(),
        processedBy: currentUser?.email || 'admin',
        notes: payoutNotes,
        transactionId: `PAYOUT_${Date.now()}`
      };
      
      await addDoc(collection(db, 'partnerPayouts'), payoutRecord);
      
      // Update partner statistics - simplified approach
      const partnerRef = doc(db, 'partners', selectedPartner.partnerId);
      const currentPaid = selectedPartner.totalEarnings - selectedPartner.currentEarnings;
      const newTotalPaid = currentPaid + Math.round(amount * 100);
      
      await updateDoc(partnerRef, {
        'stats.totalCommissionPaid': newTotalPaid,
        'stats.lastPayoutAt': Timestamp.now(),
        'stats.lastPayoutAmount': Math.round(amount * 100),
        updatedAt: Timestamp.now()
      });
      
      toast({
        title: 'Payout Processed',
        description: `Successfully processed $${amount.toFixed(2)} payout for ${selectedPartner.partnerName}`,
      });
      
      setShowPayoutModal(false);
      setSelectedPartner(null);
      setPayoutAmount('');
      setPayoutNotes('');
      
      // Refresh data
      await fetchPartnerEarnings();
      await fetchPayoutHistory();
      
    } catch (error) {
      console.error('Error processing payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payout',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayout(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPartnerEarnings();
      fetchPayoutHistory();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const totalOutstanding = partners.reduce((sum, partner) => sum + partner.currentEarnings, 0);
  const totalPaidOut = partners.reduce((sum, partner) => sum + (partner.totalEarnings - partner.currentEarnings), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Partner Payouts
              </h1>
            </div>
            <Button onClick={fetchPartnerEarnings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground">
                Unpaid commissions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPaidOut)}</div>
              <p className="text-xs text-muted-foreground">
                Historical payouts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partners.length}</div>
              <p className="text-xs text-muted-foreground">
                Partners with earnings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Earnings</CardTitle>
            <CardDescription>
              Current outstanding earnings for each partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading partner earnings...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Current Earnings</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Last Payout</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.partnerId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{partner.partnerName}</div>
                          <div className="text-sm text-gray-500">{partner.partnerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(partner.currentEarnings)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(partner.totalEarnings)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{partner.totalReferrals}</div>
                          <div className="text-sm text-gray-500">
                            {partner.totalConversions} conversions
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {partner.lastPayout ? (
                          <div>
                            <div className="text-sm font-medium">
                              {formatCurrency(partner.lastPayoutAmount || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {partner.lastPayout.toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPartner(partner);
                            setPayoutAmount((partner.currentEarnings / 100).toFixed(2));
                            setShowPayoutModal(true);
                          }}
                          disabled={partner.currentEarnings <= 0}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Process payout for {selectedPartner?.partnerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Earnings</Label>
                  <div className="text-lg font-semibold">
                    {selectedPartner && formatCurrency(selectedPartner.currentEarnings)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Earnings</Label>
                  <div className="text-lg font-semibold">
                    {selectedPartner && formatCurrency(selectedPartner.totalEarnings)}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="payoutAmount">Payout Amount (USD)</Label>
              <Input
                id="payoutAmount"
                type="number"
                step="0.01"
                min="0"
                max={selectedPartner ? (selectedPartner.currentEarnings / 100).toFixed(2) : "0"}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="payoutNotes">Notes (Optional)</Label>
              <Textarea
                id="payoutNotes"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Add any notes about this payout..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processPayout} 
              disabled={processingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0}
            >
              {processingPayout ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerPayouts;
