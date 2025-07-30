/**
 * Type Guards and Utilities
 * Comprehensive type guards and utilities to safely handle unknown data
 */

import { 
  UserProfile, 
  ApiResponse, 
  AppError, 
  WizardFormData, 
  CaptionData,
  ContentGenerationRequest,
  ContentGenerationResponse,
  MediaFile,
  ValidationError,
  NetworkError
} from '@/types/core';

// Core Type Guards
export const isUserProfile = (data: unknown): data is UserProfile => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'displayName' in data &&
    'email' in data &&
    'requests_used' in data &&
    'plan_type' in data &&
    'requests_limit' in data
  );
};

export const isApiResponse = <T>(data: unknown): data is ApiResponse<T> => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as ApiResponse<T>).success === 'boolean'
  );
};

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string'
  );
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return (
    isAppError(error) &&
    'field' in error &&
    'value' in error &&
    'expected' in error
  );
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return (
    isAppError(error) &&
    'status' in error &&
    'statusText' in error &&
    'url' in error &&
    'method' in error
  );
};

export const isWizardFormData = (data: unknown): data is WizardFormData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'topic' in data &&
    'audience' in data &&
    'industry' in data &&
    'contentTone' in data &&
    'wordCount' in data &&
    'keywords' in data &&
    Array.isArray((data as WizardFormData).keywords)
  );
};

export const isCaptionData = (data: unknown): data is CaptionData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    'caption' in data &&
    'cta' in data &&
    'hashtags' in data &&
    'platform' in data &&
    'tone' in data &&
    'wordCount' in data &&
    'mediaType' in data &&
    'language' in data &&
    Array.isArray((data as CaptionData).hashtags)
  );
};

export const isContentGenerationRequest = (data: unknown): data is ContentGenerationRequest => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'topic' in data &&
    'audience' in data &&
    'industry' in data &&
    'contentTone' in data &&
    'wordCount' in data &&
    'keywords' in data &&
    'structureFormat' in data &&
    'contentType' in data &&
    'ctaType' in data &&
    'includeStats' in data &&
    'includeReferences' in data &&
    'tocRequired' in data &&
    'summaryRequired' in data &&
    'structuredData' in data &&
    'enableMetadataBlock' in data &&
    'outputFormat' in data &&
    'plagiarismCheck' in data &&
    'lang' in data &&
    Array.isArray((data as ContentGenerationRequest).keywords)
  );
};

export const isContentGenerationResponse = (data: unknown): data is ContentGenerationResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as ContentGenerationResponse).success === 'boolean'
  );
};

export const isMediaFile = (data: unknown): data is MediaFile => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'type' in data &&
    'size' in data &&
    'url' in data &&
    'uploadedAt' in data
  );
};

// Array Type Guards
export const isUserProfileArray = (data: unknown): data is UserProfile[] => {
  return Array.isArray(data) && data.every(isUserProfile);
};

export const isCaptionDataArray = (data: unknown): data is CaptionData[] => {
  return Array.isArray(data) && data.every(isCaptionData);
};

export const isMediaFileArray = (data: unknown): data is MediaFile[] => {
  return Array.isArray(data) && data.every(isMediaFile);
};

export const isStringArray = (data: unknown): data is string[] => {
  return Array.isArray(data) && data.every(item => typeof item === 'string');
};

export const isNumberArray = (data: unknown): data is number[] => {
  return Array.isArray(data) && data.every(item => typeof item === 'number');
};

// Primitive Type Guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date;
};

// Firebase Type Guards
export const isFirebaseTimestamp = (value: unknown): value is any => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value
  );
};

export const isFirebaseDocument = (data: unknown): data is { id: string; data: () => unknown } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'data' in data &&
    typeof (data as any).data === 'function'
  );
};

// Error Handling Utilities
export const createAppError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    timestamp: Date.now(),
  };
};

export const handleApiError = (error: unknown): AppError => {
  const appError = createAppError(error);
  
  // Log error for debugging
  console.error('API Error:', appError);
  
  return appError;
};

export const createValidationError = (
  field: string,
  value: unknown,
  expected: string,
  message?: string
): ValidationError => {
  return {
    code: 'VALIDATION_ERROR',
    message: message || `Invalid value for field '${field}'`,
    field,
    value,
    expected,
    timestamp: Date.now(),
  };
};

export const createNetworkError = (
  status: number,
  statusText: string,
  url: string,
  method: string,
  message?: string
): NetworkError => {
  return {
    code: 'NETWORK_ERROR',
    message: message || `HTTP ${status}: ${statusText}`,
    status,
    statusText,
    url,
    method,
    timestamp: Date.now(),
  };
};

// Data Transformation Utilities
export const safeParseJSON = <T>(jsonString: string): T | null => {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return null;
  }
};

export const safeStringify = (data: unknown): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

// Validation Utilities
export const validateRequired = (value: unknown, fieldName: string): ValidationError | null => {
  if (value === null || value === undefined || value === '') {
    return createValidationError(fieldName, value, 'required', `${fieldName} is required`);
  }
  return null;
};

export const validateString = (value: unknown, fieldName: string): ValidationError | null => {
  if (!isString(value)) {
    return createValidationError(fieldName, value, 'string', `${fieldName} must be a string`);
  }
  return null;
};

export const validateNumber = (value: unknown, fieldName: string): ValidationError | null => {
  if (!isNumber(value)) {
    return createValidationError(fieldName, value, 'number', `${fieldName} must be a number`);
  }
  return null;
};

export const validateBoolean = (value: unknown, fieldName: string): ValidationError | null => {
  if (!isBoolean(value)) {
    return createValidationError(fieldName, value, 'boolean', `${fieldName} must be a boolean`);
  }
  return null;
};

export const validateArray = (value: unknown, fieldName: string): ValidationError | null => {
  if (!Array.isArray(value)) {
    return createValidationError(fieldName, value, 'array', `${fieldName} must be an array`);
  }
  return null;
};

export const validateObject = (value: unknown, fieldName: string): ValidationError | null => {
  if (!isObject(value)) {
    return createValidationError(fieldName, value, 'object', `${fieldName} must be an object`);
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationError | null => {
  if (value.length < minLength) {
    return createValidationError(
      fieldName,
      value,
      `minimum ${minLength} characters`,
      `${fieldName} must be at least ${minLength} characters long`
    );
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationError | null => {
  if (value.length > maxLength) {
    return createValidationError(
      fieldName,
      value,
      `maximum ${maxLength} characters`,
      `${fieldName} must be no more than ${maxLength} characters long`
    );
  }
  return null;
};

export const validateMinValue = (value: number, minValue: number, fieldName: string): ValidationError | null => {
  if (value < minValue) {
    return createValidationError(
      fieldName,
      value,
      `minimum ${minValue}`,
      `${fieldName} must be at least ${minValue}`
    );
  }
  return null;
};

export const validateMaxValue = (value: number, maxValue: number, fieldName: string): ValidationError | null => {
  if (value > maxValue) {
    return createValidationError(
      fieldName,
      value,
      `maximum ${maxValue}`,
      `${fieldName} must be no more than ${maxValue}`
    );
  }
  return null;
};

export const validateEmail = (value: string, fieldName: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return createValidationError(
      fieldName,
      value,
      'valid email address',
      `${fieldName} must be a valid email address`
    );
  }
  return null;
};

export const validateUrl = (value: string, fieldName: string): ValidationError | null => {
  try {
    new URL(value);
    return null;
  } catch {
    return createValidationError(
      fieldName,
      value,
      'valid URL',
      `${fieldName} must be a valid URL`
    );
  }
};

// Type Assertion Utilities (use with caution)
export const assertIsUserProfile = (data: unknown): UserProfile => {
  if (!isUserProfile(data)) {
    throw new Error('Data is not a valid UserProfile');
  }
  return data;
};

export const assertIsCaptionData = (data: unknown): CaptionData => {
  if (!isCaptionData(data)) {
    throw new Error('Data is not a valid CaptionData');
  }
  return data;
};

export const assertIsContentGenerationRequest = (data: unknown): ContentGenerationRequest => {
  if (!isContentGenerationRequest(data)) {
    throw new Error('Data is not a valid ContentGenerationRequest');
  }
  return data;
};

// Safe Type Casting
export const safeCast = <T>(value: unknown, typeGuard: (value: unknown) => value is T, fallback: T): T => {
  return typeGuard(value) ? value : fallback;
};

export const safeCastOrNull = <T>(value: unknown, typeGuard: (value: unknown) => value is T): T | null => {
  return typeGuard(value) ? value : null;
};

// Utility Functions
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isNotEmpty = (value: unknown): boolean => {
  return !isEmpty(value);
};

export const hasProperty = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj;
};

export const getProperty = <T>(obj: unknown, key: string, fallback: T): T => {
  return hasProperty(obj, key) ? (obj[key] as T) : fallback;
}; 