/**
 * Enhanced Error Recovery System
 * Version: 1.0.0
 * 
 * Purpose: Comprehensive error handling with specific error categorization,
 * smart retry logic, and user-friendly feedback messages in French
 * 
 * FEATURES:
 * - Specific error types with proper recovery strategies
 * - Exponential backoff with jitter for retry logic
 * - French localization for all error messages
 * - Intelligent error classification and handling
 * - Template fallback mechanisms
 * - Detailed logging for debugging
 */

export enum ContentGenerationError {
  GEMINI_TRUNCATED = "gemini_truncated",
  GEMINI_INVALID_JSON = "gemini_invalid_json",
  GEMINI_OVERLOADED = "gemini_overloaded",
  OPENAI_RATE_LIMIT = "openai_rate_limit",
  OPENAI_CONTENT_FILTER = "openai_content_filter",
  NETWORK_TIMEOUT = "network_timeout",
  QUOTA_EXCEEDED = "quota_exceeded",
  MEDIA_PROCESSING_FAILED = "media_processing_failed",
  AUTHENTICATION_ERROR = "authentication_error",
  VALIDATION_ERROR = "validation_error",
  UNKNOWN_ERROR = "unknown_error"
}

export interface ErrorContext {
  userId?: string;
  operation: string;
  retryCount: number;
  timestamp: number;
  additionalData?: Record<string, unknown>;
}

export interface ContentGenerationContext extends ErrorContext {
  topic?: string;
  wordCount?: number;
  simplified?: boolean;
}

export interface PromptData {
  topic?: string;
  wordCount?: number;
  simplified?: boolean;
}

export interface UserFriendlyMessage {
  title: string;
  description: string;
  action?: string;
  retryAfter?: number;
}

export class ContentGenerationException extends Error {
  constructor(
    public code: ContentGenerationError,
    message: string,
    public recoverable: boolean = false,
    public retryAfter?: number,
    public userMessage?: UserFriendlyMessage,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'ContentGenerationException';
  }
}

export class ErrorRecoverySystem {
  private maxRetries = 3;
  private baseDelay = 1000;
  private maxDelay = 30000;
  
  // French error messages
  private readonly frenchMessages: Record<ContentGenerationError, UserFriendlyMessage> = {
    [ContentGenerationError.GEMINI_TRUNCATED]: {
      title: "Contenu Incomplet",
      description: "La génération du contenu a été interrompue. Nous essayons une approche simplifiée.",
      action: "Réessayer avec un sujet plus court"
    },
    [ContentGenerationError.GEMINI_INVALID_JSON]: {
      title: "Erreur de Format",
      description: "Le format de réponse n'est pas valide. Nous utilisons un modèle de secours.",
      action: "Réessayer la génération"
    },
    [ContentGenerationError.GEMINI_OVERLOADED]: {
      title: "Service Occupé",
      description: "Le service de génération est temporairement surchargé. Utilisation du modèle de secours.",
      action: "Réessayer dans quelques minutes"
    },
    [ContentGenerationError.OPENAI_RATE_LIMIT]: {
      title: "Limite de Vitesse",
      description: "Trop de demandes. Veuillez attendre un moment avant de réessayer.",
      retryAfter: 5000
    },
    [ContentGenerationError.OPENAI_CONTENT_FILTER]: {
      title: "Contenu Non Autorisé",
      description: "Le contenu généré ne respecte pas nos directives. Veuillez modifier votre demande.",
      action: "Modifier les paramètres"
    },
    [ContentGenerationError.NETWORK_TIMEOUT]: {
      title: "Délai de Connexion",
      description: "La connexion a expiré. Vérifiez votre connexion internet et réessayez.",
      action: "Vérifier la connexion"
    },
    [ContentGenerationError.QUOTA_EXCEEDED]: {
      title: "Quota Dépassé",
      description: "Vous avez atteint votre limite de générations. Mettez à niveau votre plan.",
      action: "Mettre à niveau"
    },
    [ContentGenerationError.MEDIA_PROCESSING_FAILED]: {
      title: "Erreur de Média",
      description: "Impossible de traiter vos fichiers média. Vérifiez le format et la taille.",
      action: "Vérifier les fichiers"
    },
    [ContentGenerationError.AUTHENTICATION_ERROR]: {
      title: "Erreur d'Authentification",
      description: "Veuillez vous reconnecter pour continuer.",
      action: "Se reconnecter"
    },
    [ContentGenerationError.VALIDATION_ERROR]: {
      title: "Données Invalides",
      description: "Veuillez vérifier et corriger les informations saisies.",
      action: "Corriger les données"
    },
    [ContentGenerationError.UNKNOWN_ERROR]: {
      title: "Erreur Inattendue",
      description: "Une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support.",
      action: "Contacter le support"
    }
  };

  async handleError(error: unknown, context: ContentGenerationContext): Promise<unknown> {
    const errorType = this.classifyError(error);
    const userMessage = this.frenchMessages[errorType];
    
    console.log(`[ErrorRecovery] Handling error type: ${errorType}, retry: ${context.retryCount}`);
    const errorObj = error as Error;
    console.log(`[ErrorRecovery] Error message: ${errorObj.message}`);
    
    // Update context with error information
    context.additionalData = {
      errorType,
      errorMessage: errorObj.message,
      userMessage
    };
    
    switch (errorType) {
      case ContentGenerationError.GEMINI_TRUNCATED:
        return this.handleTruncation(context);
        
      case ContentGenerationError.GEMINI_INVALID_JSON:
        return this.handleInvalidJSON(error, context);
        
      case ContentGenerationError.GEMINI_OVERLOADED:
        return this.handleOverload(context);
        
      case ContentGenerationError.OPENAI_RATE_LIMIT:
        return this.handleRateLimit(error, context);
        
      case ContentGenerationError.NETWORK_TIMEOUT:
        return this.handleTimeout(error, context);
        
      case ContentGenerationError.QUOTA_EXCEEDED:
        throw new ContentGenerationException(
          errorType,
          'API quota exceeded',
          false,
          undefined,
          userMessage,
          context
        );
        
      case ContentGenerationError.AUTHENTICATION_ERROR:
        throw new ContentGenerationException(
          errorType,
          'Authentication required',
          false,
          undefined,
          userMessage,
          context
        );
        
      default:
        return this.handleUnknownError(error, context);
    }
  }
  
  private classifyError(error: unknown): ContentGenerationError {
    const errorObj = error as Error;
    const message = errorObj.message?.toLowerCase() || '';
    const code = (errorObj as any).code?.toLowerCase() || '';
    
    // Check for specific error patterns
    if (message.includes('truncated') || message.includes('incomplete') || message.includes('cut off')) {
      return ContentGenerationError.GEMINI_TRUNCATED;
    }
    
    if (message.includes('json') || message.includes('parse') || message.includes('invalid json')) {
      return ContentGenerationError.GEMINI_INVALID_JSON;
    }
    
    if (message.includes('overloaded') || message.includes('503 service unavailable') || 
        message.includes('model is overloaded')) {
      return ContentGenerationError.GEMINI_OVERLOADED;
    }
    
    if (message.includes('rate limit') || message.includes('429') || 
        message.includes('too many requests')) {
      return ContentGenerationError.OPENAI_RATE_LIMIT;
    }
    
    if (message.includes('content filter') || message.includes('policy violation')) {
      return ContentGenerationError.OPENAI_CONTENT_FILTER;
    }
    
    if (message.includes('timeout') || message.includes('network') || 
        message.includes('connection') || message.includes('deadline')) {
      return ContentGenerationError.NETWORK_TIMEOUT;
    }
    
    if (message.includes('quota') || message.includes('usage') || 
        message.includes('insufficient credits')) {
      return ContentGenerationError.QUOTA_EXCEEDED;
    }
    
    if (message.includes('media') || message.includes('file') || 
        message.includes('upload')) {
      return ContentGenerationError.MEDIA_PROCESSING_FAILED;
    }
    
    if (code === 'unauthenticated' || message.includes('auth') || 
        message.includes('login')) {
      return ContentGenerationError.AUTHENTICATION_ERROR;
    }
    
    if (code === 'invalid-argument' || message.includes('validation') || 
        message.includes('invalid')) {
      return ContentGenerationError.VALIDATION_ERROR;
    }
    
    return ContentGenerationError.UNKNOWN_ERROR;
  }
  
  private async handleTruncation(context: ContentGenerationContext) {
    if (context.retryCount >= this.maxRetries) {
      throw new ContentGenerationException(
        ContentGenerationError.GEMINI_TRUNCATED,
        'Content generation failed after multiple attempts',
        false,
        undefined,
        this.frenchMessages[ContentGenerationError.GEMINI_TRUNCATED],
        context
      );
    }
    
    console.log(`[ErrorRecovery] Attempting simplified generation, retry ${context.retryCount + 1}`);
    
    // Signal for retry with simplified approach
    throw new Error('retry_with_simplified');
  }
  
  private async handleInvalidJSON(error: unknown, context: ContentGenerationContext) {
    if (context.retryCount >= 2) {
      console.log("[ErrorRecovery] JSON parsing failed multiple times, using fallback");
      return this.generateFallbackOutline(context);
    }
    
    // Try to repair JSON if possible
    const errorObj = error as any;
    const response = errorObj.response || errorObj.text || '';
    const repairedJSON = this.attemptJSONRepair(response);
    
    if (repairedJSON) {
      console.log("[ErrorRecovery] Successfully repaired JSON response");
      return repairedJSON;
    }
    
    throw new Error('retry_json_generation');
  }
  
  private async handleOverload(context: ContentGenerationContext) {
    console.log("[ErrorRecovery] API overload detected, using template fallback");
    return this.generateFallbackOutline(context);
  }
  
  private async handleRateLimit(error: unknown, context: ContentGenerationContext) {
    const delay = this.calculateBackoffDelay(context.retryCount);
    
    if (context.retryCount >= this.maxRetries) {
      throw new ContentGenerationException(
        ContentGenerationError.OPENAI_RATE_LIMIT,
        'Rate limit exceeded',
        true,
        delay,
        this.frenchMessages[ContentGenerationError.OPENAI_RATE_LIMIT],
        context
      );
    }
    
    console.log(`[ErrorRecovery] Rate limited, waiting ${delay}ms before retry ${context.retryCount + 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    throw new Error('retry_after_delay');
  }
  
  private async handleTimeout(error: unknown, context: ContentGenerationContext) {
    if (context.retryCount >= 2) {
      throw new ContentGenerationException(
        ContentGenerationError.NETWORK_TIMEOUT,
        'Network timeout after retries',
        true,
        5000,
        this.frenchMessages[ContentGenerationError.NETWORK_TIMEOUT],
        context
      );
    }
    
    const delay = 2000 * (context.retryCount + 1);
    console.log(`[ErrorRecovery] Network timeout, retrying in ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    throw new Error('retry_after_timeout');
  }
  
  private async handleUnknownError(error: unknown, context: ContentGenerationContext) {
    console.error("[ErrorRecovery] Unknown error occurred:", error);
    
    if (context.retryCount >= 1) {
      throw new ContentGenerationException(
        ContentGenerationError.UNKNOWN_ERROR,
        'Unexpected error occurred',
        false,
        undefined,
        this.frenchMessages[ContentGenerationError.UNKNOWN_ERROR],
        context
      );
    }
    
    throw new Error('retry_unknown');
  }
  
  private calculateBackoffDelay(retryCount: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }
  
  private attemptJSONRepair(response: string): Record<string, unknown> | null {
    try {
      // Remove markdown code blocks
      let cleaned = response.replace(/```json\s*|\s*```/g, "");
      
      // Fix common JSON issues
      cleaned = cleaned
        .replace(/([{,]\s*)(\w+):/g, "$1\"$2\":") // Add quotes to keys
        .replace(/:\s*'([^']*)'/g, ":\"$1\"") // Replace single quotes
        .replace(/,\s*}/g, "}") // Remove trailing commas
        .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
        .replace(/"\s*$/, "\"}") // Fix unterminated strings
        .replace(/,\s*$/, ""); // Remove trailing commas at end
      
      // If still truncated, try to close the JSON properly
      if (!cleaned.endsWith("}")) {
        const openBraces = (cleaned.match(/\{/g) || []).length;
        const closeBraces = (cleaned.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        cleaned += "}".repeat(missingBraces);
      }
      
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
  
  private generateFallbackOutline(context: ErrorContext) {
    const { additionalData } = context;
    const promptData = (additionalData?.promptData as PromptData) || {};
    
    console.log("[ErrorRecovery] Generating fallback outline");
    
    // Generate a basic template-based outline
    return {
      meta: {
        estimatedReadingTime: `${Math.ceil((promptData.wordCount || 1000) / 200)} minutes`,
        primaryEmotion: "informative",
        fallback: true
      },
      sections: [
        {
                  title: `Introduction à ${promptData.topic || "votre sujet"}`,
        wordCount: Math.floor((promptData.wordCount || 1000) * 0.2),
        keyPoints: ["Aperçu", "Concepts clés", "Ce que les lecteurs apprendront"]
        },
        {
                  title: `Comprendre ${promptData.topic || "votre sujet"}`,
        wordCount: Math.floor((promptData.wordCount || 1000) * 0.3),
        keyPoints: ["Explication détaillée", "Exemples", "Meilleures pratiques"]
        },
        {
                  title: `Implémenter ${promptData.topic || "votre sujet"}`,
        wordCount: Math.floor((promptData.wordCount || 1000) * 0.3),
        keyPoints: ["Approche étape par étape", "Défis courants", "Solutions"]
        },
        {
          title: "Conclusion",
          wordCount: Math.floor((promptData.wordCount || 1000) * 0.2),
          keyPoints: ["Points clés", "Prochaines étapes", "Ressources"]
        }
      ]
    };
  }
  
  // Utility method to create error context
  createContext(operation: string, userId?: string, additionalData?: Record<string, unknown>): ErrorContext {
    return {
      userId,
      operation,
      retryCount: 0,
      timestamp: Date.now(),
      additionalData
    };
  }
  
  // Method to increment retry count
  incrementRetry(context: ErrorContext): ErrorContext {
    return {
      ...context,
      retryCount: context.retryCount + 1,
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const errorRecovery = new ErrorRecoverySystem();

// Export utility functions for easy access
export const createErrorContext = (operation: string, userId?: string, additionalData?: Record<string, unknown>) => 
  errorRecovery.createContext(operation, userId, additionalData);

export const incrementRetry = (context: ErrorContext) => 
  errorRecovery.incrementRetry(context); 