/**
 * Simple Mock Partner Data for Testing
 * 
 * This provides fallback data when Firestore doesn't have real partner codes
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
  }
} as const;

/**
 * Check if we're in development mode with mock data enabled
 */
export function shouldUseMockData(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_PARTNERS === 'true';
}

/**
 * Get mock partner data for a code
 */
export function getMockPartnerData(code: string) {
  const normalizedCode = code.toUpperCase();
  return MOCK_PARTNER_DATA[normalizedCode as keyof typeof MOCK_PARTNER_DATA] || null;
}
