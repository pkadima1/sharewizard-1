# Word Count Abbreviation Translation Fix

## Issue
The word count abbreviation "w" was appearing in the French UI instead of the correct French abbreviation "m" (for "mots") in the content structure breakdown.

## Root Cause
In the `Step4ToneStructure.tsx` component (line 653), there was a hardcoded "w" suffix for displaying word counts in the structure preview sections.

## Fix Applied
Updated line 653 in `src/components/wizard/steps/Step4ToneStructure.tsx`:

**Before:**
```tsx
{section.words}w
```

**After:**
```tsx
{section.words} {t('step4.preview.wordsShort')}
```

## Additional Fix
Also fixed spacing in `ContentPreview.tsx` line 773:

**Before:**
```tsx
{section.estimatedWords}{t('step4.preview.wordsShort')}
```

**After:**
```tsx
{section.estimatedWords} {t('step4.preview.wordsShort')}
```

## Translation Keys Verified
- **English**: `"wordsShort": "w"` ✅
- **French**: `"wordsShort": "m"` ✅

## Expected Result
In the content structure breakdown:
- English UI: "200 w", "150 w", "250 w"
- French UI: "200 m", "150 m", "250 m" ✅

## Additional Fixes
Also fixed TypeScript interface issues in wizard step components:
- Added proper TypeScript interfaces for props in Step1WhatWho, Step2MediaVisuals, Step3KeywordsSEO, Step4ToneStructure, Step5GenerationSettings, and Step6ReviewGenerate components
- Resolved "Unexpected any" TypeScript strict mode errors

## Testing
- ✅ Build completed successfully
- ✅ Lint passed without errors
- ✅ Translation keys verified in both language files
- ✅ TypeScript interfaces properly defined

## Status
**COMPLETED** - The word count abbreviations will now correctly display "m" in French and "w" in English interfaces throughout the content wizard.

---
*Fix completed on: June 30, 2025*
