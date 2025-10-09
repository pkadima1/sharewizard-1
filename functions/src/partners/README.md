# Partner System Cloud Functions

This directory contains the Firebase Cloud Functions for the Partner/Affiliate system.

## Functions

### `createPartner`
**Admin-only callable function** to create new partner accounts.

**Request:**
```typescript
{
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  description?: string;
  referralBonus?: number;
  customCommissionRate?: number; // 0.1 to 0.9
}
```

**Response:**
```typescript
{
  success: boolean;
  partnerId: string;
  partner: Partner;
  message: string;
  messageKey: string; // For localization
}
```

**Features:**
- ✅ Admin-only access (engageperfect@gmail.com)
- ✅ Creates Firebase Auth user for partner
- ✅ Sets custom claims (`partner: true`, `partnerId: string`)
- ✅ Comprehensive validation
- ✅ Automatic partner ID generation
- ✅ Commission rate validation (10%-90%)
- ✅ Localization support

### `createPartnerCode`
**Admin-only callable function** to create referral codes for partners.

**Request:**
```typescript
{
  partnerId: string;
  desiredCode?: string; // Auto-generated if not provided
  description?: string;
  expiresAt?: string; // ISO date string
  maxUses?: number;
  customCommissionRate?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  code: string;
  partnerCode: PartnerCode;
  message: string;
  messageKey: string;
}
```

**Features:**
- ✅ Admin-only access
- ✅ Code format validation (3-20 uppercase alphanumeric)
- ✅ Uniqueness checking
- ✅ Auto-generation from partner name
- ✅ Reserved code protection
- ✅ Expiration date support
- ✅ Usage limit support
- ✅ Custom commission rates per code

## Code Format Rules

Partner codes must follow these rules:
- **Length:** 3-20 characters
- **Characters:** Uppercase letters (A-Z) and numbers (0-9) only
- **Reserved codes:** Cannot use ADMIN, TEST, DEMO, API, etc.
- **Uniqueness:** Must be unique across all partner codes

## Testing

### Prerequisites
- Node.js 18+ with TypeScript support
- Firebase CLI (for emulator testing if needed)

### Quick Validation Tests
Run validation tests for core logic without Firebase dependencies:
```bash
cd functions
npx ts-node test/partner-functions.test.ts
```

This will test:
- ✅ Email validation logic
- ✅ Partner code format validation  
- ✅ Commission rate validation
- ✅ Random code generation
- ✅ Admin authorization checks

### Full Integration Testing
For complete testing with Firebase emulators:

1. Start Firebase emulators:
   ```bash
   firebase emulators:start --only auth,firestore,functions
   ```

2. Ensure admin user exists in Auth emulator with email `engageperfect@gmail.com`

3. Use Firebase console or frontend to test callable functions

### Manual Testing
Use the Firebase console or your frontend to call these functions:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Create partner
const createPartner = httpsCallable(functions, 'createPartner');
const result = await createPartner({
  email: 'partner@example.com',
  displayName: 'John Doe',
  companyName: 'Acme Corp',
  customCommissionRate: 0.65
});

// Create partner code
const createPartnerCode = httpsCallable(functions, 'createPartnerCode');
const codeResult = await createPartnerCode({
  partnerId: result.data.partnerId,
  desiredCode: 'ACME2024',
  maxUses: 1000
});
```

## Security

### Authentication
- Both functions require authentication
- Only admin users can execute these functions
- Admin check: `email === 'engageperfect@gmail.com'`

### Validation
- Comprehensive input validation
- SQL injection protection (Firestore NoSQL)
- XSS protection through type validation
- Rate limiting through Firebase Functions

### Authorization
- Partner creation restricted to admins only
- Partner code creation restricted to admins only
- Each partner can only access their own data (enforced by security rules)

## Database Schema

### Partners Collection (`partners/{partnerId}`)
```typescript
{
  partnerId: string;
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  description?: string;
  active: boolean;
  commissionRate: number; // Default: 0.6 (60%)
  referralBonus?: number;
  totalEarnings: number;
  totalReferrals: number;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

### Partner Codes Collection (`partnerCodes/{code}`)
```typescript
{
  code: string; // Document ID
  partnerId: string;
  active: boolean;
  uses: number;
  maxUses?: number;
  description?: string;
  customCommissionRate?: number;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
}
```

## Error Handling

Functions use Firebase's `HttpsError` with these codes:
- `unauthenticated`: User not logged in
- `permission-denied`: Not an admin user
- `invalid-argument`: Invalid input data
- `already-exists`: Email/code already taken
- `not-found`: Partner not found
- `internal`: Server error

All errors include descriptive messages and are logged for debugging.

## Localization

Functions return `messageKey` for frontend localization:
- `partner.messages.created`
- `partner.messages.codeCreated`
- `partner.errors.emailTaken`
- `partner.errors.invalidCommission`

Frontend should use these keys with i18next for proper translations.

## Performance

### Optimization Features
- Firestore indexes for efficient queries
- Composite indexes for partner code lookups
- Timeout limits (60 seconds)
- Memory limits (256MB)
- Concurrency limits (10 instances)
- Efficient validation order (fail fast)

### Monitoring
- Structured logging with Firebase Logger
- Performance timing for operations
- Error tracking with context
- Request validation logging

## Development

### Adding New Features
1. Update types in `../types/partners.ts`
2. Update database config in `../config/partner-database.ts`
3. Add new function in this directory
4. Export in `../index.ts`
5. Add tests
6. Update documentation

### Code Style
- TypeScript strict mode
- Comprehensive error handling
- Detailed logging
- Input validation
- Performance monitoring
- Security-first design
