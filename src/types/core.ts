/**
 * Core Type Definitions
 * Comprehensive type definitions to eliminate any types and improve type safety
 */

import { Timestamp } from 'firebase/firestore';

// User and Profile Types
export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
  requests_used: number;
  plan_type: 'free' | 'basic' | 'premium' | 'flexy';
  requests_limit: number;
  flexy_requests?: number;
  subscription_id?: string;
  trial_end?: Timestamp;
  last_login?: Timestamp;
  preferences?: UserPreferences;
  analytics?: UserAnalytics;
}

export interface UserPreferences {
  language: 'en' | 'fr';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
  };
}

export interface UserAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastRequestDate?: Timestamp;
  favoriteFeatures: string[];
  usagePatterns: Record<string, number>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Handling Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: number;
  userId?: string;
  context?: {
    component?: string;
    action?: string;
    url?: string;
  };
}

export interface ValidationError extends AppError {
  field: string;
  value: unknown;
  expected: string;
}

export interface NetworkError extends AppError {
  status: number;
  statusText: string;
  url: string;
  method: string;
}

// Pagination and Sorting
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: unknown;
}

// Content Generation Types
export interface ContentGenerationRequest {
  topic: string;
  audience: string;
  industry: string;
  contentTone: string;
  wordCount: number;
  keywords: string[];
  mediaUrls?: string[];
  mediaCaptions?: string[];
  mediaAnalysis?: string[];
  structureFormat: string;
  contentType: string;
  ctaType: string;
  includeStats: boolean;
  includeReferences: boolean;
  tocRequired: boolean;
  summaryRequired: boolean;
  structuredData: boolean;
  enableMetadataBlock: boolean;
  outputFormat: 'markdown' | 'html';
  plagiarismCheck: boolean;
  writingPersonality?: string;
  readingLevel?: string;
  targetLocation?: string;
  geographicScope?: 'local' | 'regional' | 'national' | 'global';
  marketFocus?: string[];
  localSeoKeywords?: string[];
  culturalContext?: string;
  lang: 'en' | 'fr';
}

export interface ContentGenerationResponse {
  success: boolean;
  contentId?: string;
  content?: string;
  outline?: ContentOutline;
  metadata?: ContentMetadata;
  requestsRemaining?: number;
  message?: string;
  fallback?: boolean;
  error?: AppError;
}

export interface ContentOutline {
  meta: {
    estimatedReadingTime: string;
    primaryEmotion: string;
    keyValueProposition: string;
    authorityLevel: string;
    geographicScope: string;
    trustFactors: string[];
  };
  hookOptions: string[];
  sections: ContentSection[];
  seoStrategy: SeoStrategy;
  conclusion: Conclusion;
}

export interface ContentSection {
  title: string;
  wordCount: number;
  tone: string;
  keyPoints: string[];
  humanElements: {
    storyOpportunity: string;
    emotionalConnection: string;
    practicalValue: string;
  };
  subsections?: ContentSubsection[];
}

export interface ContentSubsection {
  subtitle: string;
  focusArea: string;
  wordCount: number;
  eevatFocus: string;
}

export interface SeoStrategy {
  metaDescription: string;
  primaryKeyword: string;
  geographicKeywords: string[];
  authorityKeywords: string[];
  keywordDensity: string;
  featuredSnippetTarget: string;
  localSeoOpportunities: string[];
  schemaMarkup: string;
}

export interface Conclusion {
  approach: string;
  emotionalGoal: string;
  ctaIntegration: string;
  credibilityReinforcement: string;
}

export interface ContentMetadata {
  actualWordCount: number;
  estimatedReadingTime: number;
  generationTime: number;
  version: string;
  readingLevel?: string;
  hasReferences?: boolean;
  contentPersonality?: string;
  contentEmotion?: string;
  topics?: string[];
  metaTitle?: string;
  metaDescription?: string;
  contentQuality?: {
    hasEmotionalElements: boolean;
    hasActionableContent: boolean;
    seoOptimized: boolean;
    structureComplexity: number;
  };
  lang?: string;
}

// Caption Generation Types
export interface CaptionData {
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
  platform: string;
  tone: string;
  wordCount: number;
  mediaType: 'image' | 'video' | 'text';
  language: 'en' | 'fr';
}

export interface CaptionGenerationRequest {
  topic: string;
  platform: string;
  tone: string;
  wordCount: number;
  hashtags: string[];
  mediaType: 'image' | 'video' | 'text';
  language: 'en' | 'fr';
  customInstructions?: string;
}

export interface CaptionGenerationResponse {
  success: boolean;
  captions: CaptionData[];
  requestsRemaining?: number;
  message?: string;
  error?: AppError;
}

// Media Types
export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Timestamp;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
}

export interface MediaUploadResponse {
  success: boolean;
  file: MediaFile;
  error?: AppError;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface PageViewEvent extends AnalyticsEvent {
  name: 'page_view';
  properties: {
    page_title: string;
    page_url: string;
    referrer?: string;
  };
}

export interface ContentGenerationEvent extends AnalyticsEvent {
  name: 'content_generation';
  properties: {
    content_type: string;
    word_count: number;
    generation_time: number;
    success: boolean;
    error_code?: string;
  };
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'basic' | 'premium' | 'flexy';
  cycle: 'monthly' | 'yearly';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    requests: number;
    flexyRequests?: number;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type AsyncResult<T, E = AppError> = Promise<{
  success: true;
  data: T;
} | {
  success: false;
  error: E;
}>;

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirestoreDocument<T = unknown> {
  id: string;
  data: T;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Environment Types
export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  apiUrl: string;
  firebaseConfig: FirebaseConfig;
  analytics: {
    enabled: boolean;
    debugMode: boolean;
  };
  features: {
    [key: string]: boolean;
  };
} 