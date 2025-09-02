export interface Partner {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerCode {
  id: string;
  partnerUid: string;
  code: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface CommissionLedgerEntry {
  id: string;
  partnerUid: string;
  customerEmail: string;
  invoiceId: string;
  amount: number;
  commission: number;
  status: 'pending' | 'paid' | 'cancelled';
  creditedAt: Date;
  paidAt?: Date;
}

export interface ReferralCustomer {
  id: string;
  partnerUid: string;
  customerUid: string;
  displayName: string;
  email: string;
  joinedAt: Date;
  status: 'active' | 'inactive' | 'churned';
  totalSpent: number;
  lastActivity: Date;
}

export interface InvoiceEntry {
  id: string;
  invoiceId: string;
  customerEmail: string;
  amount: number;
  commission: number;
  creditedPartnerUid: string;
  creditedAt: Date;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface DashboardStats {
  monthlyCommissions: number;
  activeCustomers: number;
  churnRate: number;
  totalEarnings: number;
  monthlyEarnings: MonthlyEarning[];
}

export interface MonthlyEarning {
  month: string;
  amount: number;
  customers: number;
}

export interface PartnerDashboardData {
  partner: Partner;
  codes: PartnerCode[];
  earnings: CommissionLedgerEntry[];
  customers: ReferralCustomer[];
  invoices: InvoiceEntry[];
  stats: DashboardStats;
}
