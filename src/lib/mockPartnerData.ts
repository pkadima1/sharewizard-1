/**
 * Simple Mock Partner Data for Testing
 * 
 * DISABLED FOR PRODUCTION DEVELOPMENT
 * This provides fallback data when Firestore doesn't have real partner codes
 * Currently disabled - system uses real Firestore database
 */

export const MOCK_PARTNER_DATA = {
  'ACME2024': {
    partnerId: 'test-partner-acme',
    email: 'acme.partner@example.com',
    displayName: 'John Doe',
    companyName: 'ACME Corp',
    active: true,
    commissionRate: 0.65
  },
  'PARTNER123': {
    partnerId: 'test-partner-123',
    email: 'partner123@example.com',
    displayName: 'Jane Smith',
    companyName: 'Partner Solutions Inc',
    active: true,
    commissionRate: 0.7
  },
  'TESTCODE': {
    partnerId: 'test-partner-code',
    email: 'test.partner@example.com',
    displayName: 'Test Partner',
    companyName: 'Test Company',
    active: true,
    commissionRate: 0.6
  },
  'PATRICK': {
    partnerId: 'DUAQ3fcgkGgeMzro3MUT',
    email: 'patrick@example.com',
    displayName: 'Patrick',
    companyName: 'Patrick Company',
    active: true,
    commissionRate: 0.7
  }
} as const;

/**
 * Check if we're in development mode with mock data enabled
 * DISABLED FOR PRODUCTION DEVELOPMENT - Always use real Firestore data
 */
export function shouldUseMockData(): boolean {
  // Mock data is disabled for production development
  // Always use real Firestore database
  return false;
}

/**
 * Get mock partner data for a code
 */
export function getMockPartnerData(code: string) {
  const normalizedCode = code.toUpperCase();
  return MOCK_PARTNER_DATA[normalizedCode as keyof typeof MOCK_PARTNER_DATA] || null;
}
