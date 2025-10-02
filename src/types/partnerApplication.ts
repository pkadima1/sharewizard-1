/**
 * Shared PartnerApplication Type Definition
 * 
 * This file contains the shared interface for partner applications
 * used across all admin components to ensure type consistency.
 */

import { Timestamp } from 'firebase/firestore';

export interface PartnerApplication {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  portfolioUrl?: string;
  experienceNote?: string;
  languages?: Array<{
    language: string;
    level: string;
  }>;
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
  
  // Enhanced partner data fields
  fullName?: string;
  phone?: string;
  industry?: string;
  contentSkills?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  availability?: string;
  portfolioSamples?: string;
  
  // Commission tier information
  commissionTier?: 'basic' | 'standard' | 'certified';
  partnerSourcedRate?: number;
  epSourcedRate?: number;
  canReceiveEPLeads?: boolean;
}
