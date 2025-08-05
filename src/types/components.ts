/**
 * Component Type Definitions
 * Type definitions for React components to eliminate any types
 */

import { ReactNode } from 'react';
import { UserProfile, CaptionData, MediaFile, ContentGenerationRequest } from './core';

// Media Uploader Types
export interface MediaUploaderProps {
  onMediaSelect: (file: File | null) => void;
  selectedMedia: File | null;
  previewUrl: string | null;
  onTextOnlySelect: () => void;
}

export interface ImageFilter {
  name: string;
  class: string;
  icon: ReactNode;
  description: string;
}

export interface EmojiData {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

export interface TextOverlayData {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
  opacity: number;
}

// Wizard Form Types
export interface WizardFormData {
  topic: string;
  audience: string;
  industry: string;
  contentTone: string;
  wordCount: number;
  keywords: string[];
  mediaUrls: string[];
  mediaCaptions: string[];
  mediaAnalysis: string[];
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
  
  // Additional properties for form data
  tone: string;
  structure: any[];
  structureNotes: string;
  optimizedTitle: string;
  includeImages: boolean;
  includeMedia?: boolean;
  qualityLevel?: string;
  customIndustry?: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  isValid: boolean;
  errors: string[];
}

export interface WizardValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// Caption Generator Types
export interface CaptionGeneratorProps {
  onCaptionGenerated: (caption: CaptionData) => void;
  initialData?: Partial<CaptionData>;
  platform?: string;
  mediaType?: 'image' | 'video' | 'text';
}

export interface CaptionTemplate {
  id: string;
  name: string;
  description: string;
  structure: string;
  tone: string;
  wordCount: number;
  hashtags: string[];
  platform: string;
}

export interface CaptionPreviewProps {
  caption: CaptionData;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  onEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
}

// Content Manager Types
export interface ContentManagerProps {
  userId: string;
  contentType: 'longform' | 'captions' | 'all';
  onContentSelect: (content: ContentItem) => void;
  onContentDelete: (contentId: string) => void;
  onContentEdit: (content: ContentItem) => void;
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'longform' | 'caption';
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  metadata: ContentMetadata;
  userId: string;
}

export interface ContentMetadata {
  wordCount: number;
  readingTime: number;
  language: 'en' | 'fr';
  platform?: string;
  tone?: string;
  hashtags?: string[];
  mediaType?: 'image' | 'video' | 'text';
}

// Analytics Types
export interface AnalyticsProps {
  userId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: AnalyticsMetric[];
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface UsageStatsProps {
  userProfile: UserProfile;
  onUpgrade: () => void;
  onPurchaseFlexy: () => void;
}

// Auth Types
export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<boolean>;
  incrementRequestUsage: () => Promise<boolean>;
  checkRequestAvailability: () => Promise<RequestAvailabilityResult>;
  activateFreeTrial: (selectedPlan: 'basicMonth' | 'basicYear', selectedCycle: 'monthly' | 'yearly') => Promise<boolean>;
  subscription: Subscription | null;
}

export interface RequestAvailabilityResult {
  canMakeRequest: boolean;
  message: string;
  usagePercentage: number;
  requestsRemaining: number;
  planType: string;
}

// UI Component Types
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface SelectProps<T> {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export interface SelectOption<T> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption<unknown>[];
  defaultValue?: unknown;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
  isActive?: boolean;
  isDisabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof T) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  options?: Record<string, unknown>;
  height?: number;
  width?: number;
}

// File Upload Types
export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload: (files: File[]) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface FileUploadResult {
  success: boolean;
  files?: File[];
  error?: string;
}

// Search Types
export interface SearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  disabled?: boolean;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  category?: string;
}

// Pagination Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  showTotal?: boolean;
}

// Filter Types
export interface FilterProps {
  filters: FilterOption[];
  activeFilters: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  onClearAll?: () => void;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'range' | 'checkbox';
  options?: SelectOption<unknown>[];
  placeholder?: string;
}

// Loading Types
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}

// Error Types
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Tooltip Types
export interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

// Dropdown Types
export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
}

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

// Import Firebase types
import { User, UserCredential } from 'firebase/auth';
import { Subscription } from './core'; 