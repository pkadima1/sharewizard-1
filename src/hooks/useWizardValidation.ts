import { useMemo } from 'react';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface FormData {
  topic?: string;
  audience?: string;
  industry?: string;
  keywords?: string[];
  contentType?: string;
  contentTone?: string;
  structureFormat?: string;
  [key: string]: any;
}

interface WizardValidationResult {
  isStepValid: (step: number) => boolean;
  getStepErrors: (step: number) => ValidationError[];
  getAllErrors: () => Record<number, ValidationError[]>;
  isFormValid: boolean;
}

/**
 * Custom hook for validating wizard steps
 * @param formData - The current form data
 * @returns Validation functions and state
 */
export function useWizardValidation(formData: FormData): WizardValidationResult {
    // Validate Step 0: Media & Topic (only topic validation now)
  const validateStep0 = (): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // Topic validation - must be more than 10 characters
    if (!formData.topic || formData.topic.trim().length <= 10) {
      errors.push({
        field: 'topic',
        message: 'Topic must be more than 10 characters long'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Validate Step 1: Industry & Audience
  const validateStep1 = (): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // Industry validation - must be selected
    if (!formData.industry || formData.industry.trim().length === 0) {
      errors.push({
        field: 'industry',
        message: 'Industry must be selected'
      });
    }
    
    // Audience validation - must be selected
    if (!formData.audience || formData.audience.trim().length === 0) {
      errors.push({
        field: 'audience',
        message: 'Target audience must be specified'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Validate Step 2: Keywords & SEO  
  const validateStep2 = (): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // At least 1 keyword must be selected
    if (!formData.keywords || formData.keywords.length === 0) {
      errors.push({
        field: 'keywords',
        message: 'At least one keyword must be selected for SEO optimization'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Validate Step 3: Structure & Tone
  const validateStep3 = (): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // Content type must be selected
    if (!formData.contentType || formData.contentType.trim().length === 0) {
      errors.push({
        field: 'contentType',
        message: 'Content type must be selected'
      });
    }
    
    // Content tone must be selected
    if (!formData.contentTone || formData.contentTone.trim().length === 0) {
      errors.push({
        field: 'contentTone',
        message: 'Content tone must be selected'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Validate Step 4: Generation Settings (no validation required)
  const validateStep4 = (): ValidationResult => {
    // Generation settings have default values, so no validation needed
    return {
      isValid: true,
      errors: []
    };
  };

  // Validate Step 5: Review & Generate (no additional validation)
  const validateStep5 = (): ValidationResult => {
    // Review step just shows summary, no additional validation needed
    return {
      isValid: true,
      errors: []
    };
  };

  // Map step numbers to validation functions
  const stepValidators: Record<number, () => ValidationResult> = {
    0: validateStep0,
    1: validateStep1,
    2: validateStep2,
    3: validateStep3,
    4: validateStep4,
    5: validateStep5
  };

  // Memoize validation results to avoid unnecessary recalculations
  const validationResults = useMemo(() => {
    const results: Record<number, ValidationResult> = {};
    
    Object.keys(stepValidators).forEach(stepKey => {
      const step = parseInt(stepKey);
      results[step] = stepValidators[step]();
    });
    
    return results;
  }, [
    formData.topic,
    formData.audience,
    formData.industry,
    formData.keywords,
    formData.contentType,
    formData.contentTone,
    formData.structureFormat
  ]);

  // Check if a specific step is valid
  const isStepValid = (step: number): boolean => {
    return validationResults[step]?.isValid ?? false;
  };

  // Get validation errors for a specific step
  const getStepErrors = (step: number): ValidationError[] => {
    return validationResults[step]?.errors ?? [];
  };

  // Get all validation errors grouped by step
  const getAllErrors = (): Record<number, ValidationError[]> => {
    const allErrors: Record<number, ValidationError[]> = {};
    
    Object.keys(validationResults).forEach(stepKey => {
      const step = parseInt(stepKey);
      const errors = validationResults[step].errors;
      if (errors.length > 0) {
        allErrors[step] = errors;
      }
    });
    
    return allErrors;
  };

  // Check if the entire form is valid (all steps)
  const isFormValid = useMemo(() => {
    return Object.values(validationResults).every(result => result.isValid);
  }, [validationResults]);

  return {
    isStepValid,
    getStepErrors,
    getAllErrors,
    isFormValid
  };
}

// Helper function to get user-friendly error messages
export function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    topic: 'Topic',
    audience: 'Target Audience',
    keywords: 'Keywords',
    contentType: 'Content Type',
    contentTone: 'Content Tone',
    industry: 'Industry',
    structureFormat: 'Structure Format'
  };
  
  return fieldNames[field] || field;
}

// Helper function to format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => error.message);
}