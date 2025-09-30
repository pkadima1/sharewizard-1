/**
 * Conversion Analytics Firebase Functions
 * 
 * Exposes conversion tracking data to partner dashboards
 * and admin interfaces for comprehensive analytics.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeFirebaseAdmin } from "../config/firebase-admin.js";
import { 
  getConversionAnalytics,
  getPartnerConversionSummary,
  getConversionFunnel
} from "./conversionTracking.js";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeFirebaseAdmin();

/**
 * Get conversion analytics for a partner
 * 
 * @param request - Firebase function request
 * @returns Conversion analytics data
 */
export const getPartnerConversionAnalytics = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to access conversion analytics."
      );
    }

    const callerUid = request.auth.uid;
    const data = request.data as {
      partnerId: string;
      startDate?: string;
      endDate?: string;
    };

    if (!data || !data.partnerId) {
      throw new HttpsError(
        "invalid-argument",
        "Partner ID is required."
      );
    }

    // Parse dates
    const startDate = data.startDate ? new Date(data.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const endDate = data.endDate ? new Date(data.endDate) : new Date(); // Default: now

    logger.info(`[ConversionAnalytics] Getting analytics for partner:`, {
      callerUid,
      partnerId: data.partnerId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Get conversion analytics
    const analytics = await getConversionAnalytics(
      data.partnerId,
      startDate,
      endDate
    );

    if (!analytics) {
      return {
        success: false,
        message: 'Failed to retrieve conversion analytics'
      };
    }

    return {
      success: true,
      data: analytics,
      message: 'Conversion analytics retrieved successfully'
    };

  } catch (error) {
    logger.error(`[ConversionAnalytics] Error getting conversion analytics:`, error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal",
      "Failed to retrieve conversion analytics"
    );
  }
});

/**
 * Get partner conversion summary for dashboard
 * 
 * @param request - Firebase function request
 * @returns Partner conversion summary
 */
export const getPartnerConversionSummaryCallable = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to access conversion summary."
      );
    }

    const callerUid = request.auth.uid;
    const data = request.data as {
      partnerId: string;
    };

    if (!data || !data.partnerId) {
      throw new HttpsError(
        "invalid-argument",
        "Partner ID is required."
      );
    }

    logger.info(`[ConversionAnalytics] Getting conversion summary for partner:`, {
      callerUid,
      partnerId: data.partnerId
    });

    // Get conversion summary
    const summary = await getPartnerConversionSummary(data.partnerId);

    if (!summary) {
      return {
        success: false,
        message: 'Failed to retrieve conversion summary'
      };
    }

    return {
      success: true,
      data: summary,
      message: 'Conversion summary retrieved successfully'
    };

  } catch (error) {
    logger.error(`[ConversionAnalytics] Error getting conversion summary:`, error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal",
      "Failed to retrieve conversion summary"
    );
  }
});

/**
 * Get conversion funnel for a partner
 * 
 * @param request - Firebase function request
 * @returns Conversion funnel data
 */
export const getPartnerConversionFunnel = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 10
}, async (request): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated", 
        "Authentication required to access conversion funnel."
      );
    }

    const callerUid = request.auth.uid;
    const data = request.data as {
      partnerId: string;
      startDate?: string;
      endDate?: string;
    };

    if (!data || !data.partnerId) {
      throw new HttpsError(
        "invalid-argument",
        "Partner ID is required."
      );
    }

    // Parse dates
    const startDate = data.startDate ? new Date(data.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const endDate = data.endDate ? new Date(data.endDate) : new Date(); // Default: now

    logger.info(`[ConversionAnalytics] Getting conversion funnel for partner:`, {
      callerUid,
      partnerId: data.partnerId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Get conversion funnel
    const funnel = await getConversionFunnel(
      data.partnerId,
      startDate,
      endDate
    );

    return {
      success: true,
      data: funnel,
      message: 'Conversion funnel retrieved successfully'
    };

  } catch (error) {
    logger.error(`[ConversionAnalytics] Error getting conversion funnel:`, error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError(
      "internal",
      "Failed to retrieve conversion funnel"
    );
  }
});




