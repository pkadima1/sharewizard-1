/**
 * Partner System Constants and Utilities
 * 
 * Frontend utilities for the Partner/Affiliate system
 * Includes validation, formatting, and localization helpers
 */

// Re-export types and constants from backend
export const DEFAULT_COMMISSION_RATE = 0.6;
export const COMMISSION_RATE_OPTIONS = [0.4, 0.5, 0.6, 0.7] as const;

/**
 * Partner Status Types for Frontend
 */
export type PartnerStatus =
  | 'pending'     // Awaiting approval
  | 'approved'    // Approved and can earn commissions
  | 'suspended'   // Temporarily disabled
  | 'inactive'    // Voluntarily paused by partner
  | 'terminated'; // Permanently disabled

/**
 * Commission Status Types for Frontend
 */
export type CommissionStatus = 
  | 'accrued'   // Commission earned but not yet paid
  | 'reversed'  // Commission reversed due to refund/chargeback
  | 'paid';     // Commission has been paid out

/**
 * Referral Source Types for Frontend
 */
export type ReferralSource = 
  | 'link'           // Direct referral link click
  | 'manual'         // Manually attributed by admin
  | 'promotion_code' // Stripe promotion code
  | 'widget';        // Embedded widget

/**
 * Partner Code Validation
 */
class PartnerCodeValidator {
  // Regex for valid partner codes: 3-20 alphanumeric characters, uppercase
  private static readonly CODE_REGEX = /^[A-Z0-9]{3,20}$/;
  
  // Reserved codes that cannot be used
  private static readonly RESERVED_CODES = [
    'ADMIN', 'TEST', 'DEMO', 'API', 'WWW', 'MAIL', 'SUPPORT',
    'HELP', 'INFO', 'SALES', 'BILLING', 'LEGAL', 'TERMS',
    'PRIVACY', 'COOKIE', 'GDPR', 'CCPA', 'ENGAGE', 'PERFECT'
  ];

  /**
   * Validate a partner code format
   */
  static validateFormat(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: 'Code is required' };
    }

    if (!this.CODE_REGEX.test(code)) {
      return { 
        valid: false, 
        error: 'Code must be 3-20 characters, uppercase letters and numbers only' 
      };
    }

    if (this.RESERVED_CODES.includes(code)) {
      return { 
        valid: false, 
        error: 'This code is reserved and cannot be used' 
      };
    }

    return { valid: true };
  }

  /**
   * Generate a suggested code from a name
   */
  static generateSuggestion(name: string): string {
    // Remove special characters and convert to uppercase
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Take first 8 characters or pad with random numbers
    let suggestion = clean.substring(0, 8);
    if (suggestion.length < 3) {
      suggestion += Math.random().toString().substring(2, 5);
    }
    
    return suggestion;
  }
}

/**
 * Commission Calculation Utilities
 */
class CommissionCalculator {
  /**
   * Calculate commission amount from gross amount
   */
  static calculateCommission(grossAmount: number, commissionRate: number): number {
    return Math.round(grossAmount * commissionRate);
  }

  /**
   * Format commission amount for display
   */
  static formatCommission(
    amount: number, 
    currency: string = 'usd', 
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100); // Convert from cents
  }

  /**
   * Calculate conversion rate percentage
   */
  static calculateConversionRate(conversions: number, referrals: number): number {
    if (referrals === 0) return 0;
    return Math.round((conversions / referrals) * 100 * 100) / 100; // Round to 2 decimals
  }
}

/**
 * Partner URL Generation
 */
class PartnerURLGenerator {
  private static readonly BASE_URL = import.meta.env.VITE_APP_URL || 'https://engageperfect.com';

  /**
   * Generate a referral URL for a partner code
   */
  static generateReferralURL(code: string, page: string = 'pricing'): string {
    const url = new URL(`/${page}`, this.BASE_URL);
    url.searchParams.set('ref', code);
    return url.toString();
  }

  /**
   * Generate multiple referral URLs for different pages
   */
  static generateReferralURLs(code: string): Record<string, string> {
    return {
      pricing: this.generateReferralURL(code, 'pricing'),
      home: this.generateReferralURL(code, ''),
      signup: this.generateReferralURL(code, 'signup'),
      dashboard: this.generateReferralURL(code, 'dashboard'),
    };
  }

  /**
   * Extract referral code from URL
   */
  static extractReferralCode(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('ref');
    } catch {
      return null;
    }
  }
}

/**
 * Partner Status Utilities
 */
class PartnerStatusHelper {
  /**
   * Get status badge color class
   */
  static getStatusColor(status: PartnerStatus): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  /**
   * Check if partner can earn commissions
   */
  static canEarnCommissions(status: PartnerStatus): boolean {
    return status === 'approved';
  }

  /**
   * Check if partner can access dashboard
   */
  static canAccessDashboard(status: PartnerStatus): boolean {
    return ['approved', 'inactive'].includes(status);
  }
}

/**
 * Date and Time Utilities for Partner System
 */
class PartnerDateUtils {
  /**
   * Format date for partner dashboard
   */
  static formatDate(date: Date | string, locale: string = 'en-US'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  }

  /**
   * Format date with time for detailed views
   */
  static formatDateTime(date: Date | string, locale: string = 'en-US'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }

  /**
   * Get relative time (e.g., "2 days ago")
   */
  static getRelativeTime(date: Date | string, locale: string = 'en-US'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return this.formatDate(dateObj, locale);
  }

  /**
   * Get date range for current month
   */
  static getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }

  /**
   * Get date range for last 30 days
   */
  static getLast30DaysRange(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }
}

/**
 * Localization Keys for Partner System
 * These should match the keys defined in the backend types
 */
export const PARTNER_I18N_KEYS = {
  // Navigation and titles
  nav: {
    partners: 'nav.partners',
    dashboard: 'nav.partner.dashboard',
    referrals: 'nav.partner.referrals',
    commissions: 'nav.partner.commissions',
    settings: 'nav.partner.settings',
  },

  // Partner status labels
  status: {
    pending: 'partner.status.pending',
    active: 'partner.status.active',
    suspended: 'partner.status.suspended',
    inactive: 'partner.status.inactive',
    terminated: 'partner.status.terminated',
  },
  
  // Commission status labels
  commission: {
    accrued: 'partner.commission.accrued',
    reversed: 'partner.commission.reversed',
    paid: 'partner.commission.paid',
  },
  
  // Referral source labels
  source: {
    link: 'partner.source.link',
    manual: 'partner.source.manual',
    promotion_code: 'partner.source.promotion_code',
    widget: 'partner.source.widget',
  },
  
  // Dashboard labels
  dashboard: {
    title: 'partner.dashboard.title',
    overview: 'partner.dashboard.overview',
    stats: 'partner.dashboard.stats',
    earnings: 'partner.dashboard.earnings',
    referrals: 'partner.dashboard.referrals',
    conversions: 'partner.dashboard.conversions',
    conversionRate: 'partner.dashboard.conversionRate',
    pendingCommission: 'partner.dashboard.pendingCommission',
    totalEarned: 'partner.dashboard.totalEarned',
    recentActivity: 'partner.dashboard.recentActivity',
    generateLinks: 'partner.dashboard.generateLinks',
    viewReports: 'partner.dashboard.viewReports',
  },

  // Form labels
  form: {
    partnerCode: 'partner.form.partnerCode',
    displayName: 'partner.form.displayName',
    companyName: 'partner.form.companyName',
    website: 'partner.form.website',
    commissionRate: 'partner.form.commissionRate',
    paymentMethod: 'partner.form.paymentMethod',
    accountId: 'partner.form.accountId',
    description: 'partner.form.description',
    save: 'partner.form.save',
    cancel: 'partner.form.cancel',
    generate: 'partner.form.generate',
  },

  // Messages and notifications
  messages: {
    applicationSubmitted: 'partner.messages.applicationSubmitted',
    codeGenerated: 'partner.messages.codeGenerated',
    settingsUpdated: 'partner.messages.settingsUpdated',
    payoutRequested: 'partner.messages.payoutRequested',
    invalidCode: 'partner.messages.invalidCode',
    codeExists: 'partner.messages.codeExists',
    error: 'partner.messages.error',
    success: 'partner.messages.success',
  },

  // Buttons and actions
  actions: {
    apply: 'partner.actions.apply',
    generateCode: 'partner.actions.generateCode',
    copyLink: 'partner.actions.copyLink',
    requestPayout: 'partner.actions.requestPayout',
    viewDetails: 'partner.actions.viewDetails',
    editProfile: 'partner.actions.editProfile',
    deactivate: 'partner.actions.deactivate',
    activate: 'partner.actions.activate',
  }
} as const;

/**
 * Validation Schemas for Forms
 * These can be used with react-hook-form and zod
 */
export const PARTNER_VALIDATION_RULES = {
  partnerCode: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9]{3,20}$/,
    validate: (value: string) => PartnerCodeValidator.validateFormat(value),
  },
  
  displayName: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  
  website: {
    required: false,
    pattern: /^https?:\/\/.+/,
  },
  
  commissionRate: {
    required: true,
    min: 0.1,
    max: 0.9,
    step: 0.1,
  },
} as const;

/**
 * Default values for forms
 */
export const PARTNER_FORM_DEFAULTS = {
  commissionRate: DEFAULT_COMMISSION_RATE,
  marketingPreferences: {
    language: 'en' as const,
    receiveUpdates: true,
  },
} as const;

// Export utility classes
export {
  PartnerCodeValidator,
  CommissionCalculator,
  PartnerURLGenerator,
  PartnerStatusHelper,
  PartnerDateUtils,
};
