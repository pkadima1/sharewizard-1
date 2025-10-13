import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { 
  PartnerDashboardData, 
  DashboardStats, 
  Partner,
  PartnerCode,
  CommissionLedgerEntry,
  ReferralCustomer,
  InvoiceEntry,
  MonthlyEarning
} from '../types/dashboard';

// Helper function to fetch partner codes
const fetchPartnerCodes = async (partnerUid: string): Promise<PartnerCode[]> => {
  try {
    const codesQuery = query(
      collection(db, 'partnerCodes'),
      where('partnerId', '==', partnerUid),
      where('active', '==', true),
        orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(codesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PartnerCode[];
  } catch (error) {
    console.error('Error fetching partner codes:', error);
    return [];
  }
};

// Helper function to fetch partner earnings
const fetchPartnerEarnings = async (partnerUid: string): Promise<CommissionLedgerEntry[]> => {
  try {
    const earningsQuery = query(
      collection(db, 'commissionLedger'),
      where('partnerId', '==', partnerUid),
        orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(earningsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommissionLedgerEntry[];
  } catch (error) {
    console.error('Error fetching partner earnings:', error);
    return [];
  }
};

// Helper function to fetch partner customers
const fetchPartnerCustomers = async (partnerUid: string): Promise<ReferralCustomer[]> => {
  try {
    const customersQuery = query(
      collection(db, 'referralCustomers'),
      where('partnerId', '==', partnerUid),
        orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(customersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ReferralCustomer[];
  } catch (error) {
    console.error('Error fetching partner customers:', error);
    return [];
  }
};

// Helper function to fetch partner invoices
const fetchPartnerInvoices = async (partnerUid: string): Promise<InvoiceEntry[]> => {
  try {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('partnerId', '==', partnerUid),
        orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(invoicesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InvoiceEntry[];
  } catch (error) {
    console.error('Error fetching partner invoices:', error);
    return [];
  }
};

// Helper function to calculate dashboard stats
const calculateDashboardStats = (
  earnings: CommissionLedgerEntry[],
  customers: ReferralCustomer[]
): DashboardStats => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Calculate monthly commissions
  const monthlyCommissions = earnings
    .filter(earning => {
      return earning.createdAt >= thisMonth;
    })
    .reduce((sum, earning) => sum + earning.amount, 0);
  
  // Calculate total earnings
  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
  
  // Calculate active customers
  const activeCustomers = customers.filter(customer => customer.status === 'active').length;
  
  // Calculate churn rate (simplified - customers inactive in last 30 days)
  const inactiveIn30Days = customers.filter(customer => 
    customer.joinedAt < thirtyDaysAgo
  ).length;
  const churnRate = customers.length > 0 ? (inactiveIn30Days / customers.length) * 100 : 0;
  
  // Calculate monthly earnings for chart
  const monthlyEarnings: MonthlyEarning[] = [];
  for (let i = 11; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const monthEarnings = earnings
      .filter(earning => {
        const earningDate = earning.createdAt;
        return earningDate >= month && earningDate <= monthEnd;
      })
      .reduce((sum, earning) => sum + earning.amount, 0);
    
    const monthCustomers = customers
      .filter(customer => {
        const joinedDate = customer.joinedAt;
        return joinedDate >= month && joinedDate <= monthEnd;
      }).length;
    
    monthlyEarnings.push({
      month: month.toISOString(),
      amount: monthEarnings,
      customers: monthCustomers
    });
  }
  
  return {
    monthlyCommissions,
    activeCustomers,
    churnRate,
    totalEarnings,
    monthlyEarnings
  };
};

export function usePartnerDashboard() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('🔍 usePartnerDashboard: No current user');
      setLoading(false);
      return;
    }

    console.log('🔍 usePartnerDashboard: Starting data fetch for user:', currentUser.uid);

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'partners'),
        where('uid', '==', currentUser.uid)
      ),
      async (partnerSnapshot) => {
        try {
          console.log('🔍 usePartnerDashboard: Partner snapshot received, empty:', partnerSnapshot.empty);
          
          if (partnerSnapshot.empty) {
            console.log('🔍 usePartnerDashboard: No partner profile found');
            setError('Partner profile not found');
            setLoading(false);
            return;
          }

          const partner = {
            id: partnerSnapshot.docs[0].id,
            ...partnerSnapshot.docs[0].data()
          } as Partner;
          
          console.log('🔍 usePartnerDashboard: Partner data:', partner);
          
          // Fetch all partner data in parallel
          console.log('🔍 usePartnerDashboard: Fetching parallel data...');
          const [codes, earnings, customers, invoices] = await Promise.all([
            fetchPartnerCodes(currentUser.uid),
            fetchPartnerEarnings(currentUser.uid),
            fetchPartnerCustomers(currentUser.uid),
            fetchPartnerInvoices(currentUser.uid)
          ]);

          console.log('🔍 usePartnerDashboard: Data fetched:', {
            codes: codes.length,
            earnings: earnings.length,
            customers: customers.length,
            invoices: invoices.length
          });

          const stats = calculateDashboardStats(earnings, customers);
          
          setData({
            partner,
            codes,
            earnings,
            customers,
            invoices,
            stats
          });
          setLoading(false);
        } catch (err) {
          console.error('🔍 usePartnerDashboard: Error:', err);
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
          setLoading(false);
        }
      },
      (err) => {
        console.error('🔍 usePartnerDashboard: Snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid, refreshTrigger]);

  return { data, loading, error, refetch };
}
