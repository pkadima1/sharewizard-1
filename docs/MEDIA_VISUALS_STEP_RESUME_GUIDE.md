# Media & Visuals Step Resume Guide

## Overview

The Media & Visuals step (Step2MediaVisuals) has been temporarily commented out to prevent integration issues while the application is being stabilized. This guide provides detailed instructions on how to resume this step in a future update.

## Current Status

### What's Commented Out

1. **Import Statement** in `src/pages/LongFormWizard.tsx`:
   ```typescript
   // import Step2MediaVisuals from '@/components/wizard/steps/Step2MediaVisuals';
   ```

2. **Step Definition** in `src/pages/LongFormWizard.tsx`:
   ```typescript
   // { 
   //   name: t('wizard.steps.mediaVisuals.name'), 
   //   optional: false, 
   //   estimatedTime: 3,
   //   description: t('wizard.steps.mediaVisuals.description')
   // },
   ```

3. **Step Rendering** in `src/pages/LongFormWizard.tsx`:
   ```typescript
   // case 1: // Media & Visuals
   //   stepComponent = (
   //     <Step2MediaVisuals formData={formData} updateFormData={updateFormData} />
   //   );
   //   break;
   ```

4. **Component File** `src/components/wizard/steps/Step2MediaVisuals.tsx`:
   - Entire component is commented out with a temporary placeholder

### Current Step Flow

After commenting out the Media & Visuals step, the wizard flow is now:
- Step 0: What & Who (Topic + Audience)
- Step 1: SEO & Keywords (previously Step 2)
- Step 2: Structure & Tone (previously Step 3)
- Step 3: Generation Settings (previously Step 4)
- Step 4: Review & Generate (previously Step 5)

## Issues That Need to Be Resolved

### 1. TypeScript Interface Issues

The `WizardFormData` interface in `src/types/components.ts` needs to be updated to include media-related properties:

```typescript
interface WizardFormData {
  // ... existing properties ...
  
  // Media-related properties (currently missing)
  mediaFiles?: File[];
  mediaUrls?: string[];
  mediaTypes?: string[];
  mediaPlacements?: string[];
  mediaCaptions?: string[];
  includeImages?: boolean;
  mediaAnalysis?: any;
  includeReferences?: boolean;
  // ... other missing properties
}
```

### 2. Form Data Initialization

The `formData` initialization in `src/pages/LongFormWizard.tsx` needs to include media-related default values:

```typescript
const [formData, setFormData] = useState<WizardFormData>({
  // ... existing properties ...
  
  // Add these media-related properties
  mediaFiles: [],
  mediaUrls: [],
  mediaTypes: [],
  mediaPlacements: [],
  mediaCaptions: [],
  includeImages: false,
  mediaAnalysis: null,
  includeReferences: false,
  // ... other missing properties
});
```

### 3. Firebase Storage Integration

The component uses Firebase Storage for file uploads. Ensure:
- Firebase Storage is properly configured
- Storage rules allow authenticated users to upload files
- File size limits are appropriate
- Supported file types are clearly defined

### 4. File Upload Functionality

The component includes:
- Drag and drop file upload
- Progress tracking
- File validation (size, type)
- File metadata management (placement, captions)
- File removal functionality

### 5. Auto-save Integration

The component uses the `useAutoSave` hook. Ensure:
- Auto-save key is unique: `'step2-media-visuals-draft'`
- Draft restoration works properly
- Manual save functionality is working

### 6. Translation Keys

Ensure all translation keys are available in:
- `public/locales/en/longform.json`
- `public/locales/fr/longform.json`

Required keys include:
- `step2.title`
- `step2.subtitle`
- `step2.settings.title`
- `step2.upload.title`
- `step2.files.title`
- `step2.completion.title`
- And many more...

## Steps to Resume the Media & Visuals Step

### Phase 1: Prepare the Foundation

1. **Update TypeScript Interfaces**
   ```bash
   # Edit src/types/components.ts
   # Add missing media-related properties to WizardFormData interface
   ```

2. **Update Form Data Initialization**
   ```bash
   # Edit src/pages/LongFormWizard.tsx
   # Add media-related default values to formData state
   ```

3. **Verify Firebase Configuration**
   ```bash
   # Check src/lib/firebase.ts
   # Ensure storage is properly configured
   ```

4. **Update Storage Rules**
   ```bash
   # Check storage.rules
   # Ensure authenticated users can upload files
   ```

### Phase 2: Restore the Step

1. **Uncomment Import Statement**
   ```typescript
   // In src/pages/LongFormWizard.tsx
   import Step2MediaVisuals from '@/components/wizard/steps/Step2MediaVisuals';
   ```

2. **Uncomment Step Definition**
   ```typescript
   // In getWizardSteps function
   { 
     name: t('wizard.steps.mediaVisuals.name'), 
     optional: false, 
     estimatedTime: 3,
     description: t('wizard.steps.mediaVisuals.description')
   },
   ```

3. **Uncomment Step Rendering**
   ```typescript
   // In renderStepContent function
   case 1: // Media & Visuals
     stepComponent = (
       <Step2MediaVisuals formData={formData} updateFormData={updateFormData} />
     );
     break;
   ```

4. **Update Case Numbers**
   ```typescript
   // Adjust all case numbers after step 1
   case 2: // SEO & Keywords (was case 2, now case 1)
   case 3: // Structure & Tone (was case 3, now case 2)
   case 4: // Generation Settings (was case 4, now case 3)
   case 5: // Review & Generate (was case 5, now case 4)
   ```

5. **Restore Component File**
   ```bash
   # Edit src/components/wizard/steps/Step2MediaVisuals.tsx
   # Remove the comment block and restore the original component
   ```

### Phase 3: Test and Validate

1. **Test File Upload**
   - Test drag and drop functionality
   - Test file size validation
   - Test file type validation
   - Test upload progress tracking

2. **Test Auto-save**
   - Test draft saving
   - Test draft restoration
   - Test manual save functionality

3. **Test Integration**
   - Test step navigation
   - Test form data persistence
   - Test media data flow to subsequent steps

4. **Test Error Handling**
   - Test upload failures
   - Test network errors
   - Test authentication errors

### Phase 4: Translation and Localization

1. **Add Missing Translation Keys**
   ```bash
   # Edit public/locales/en/longform.json
   # Add all step2.* translation keys
   ```

2. **Add French Translations**
   ```bash
   # Edit public/locales/fr/longform.json
   # Add French translations for all step2.* keys
   ```

## Testing Checklist

### File Upload Testing
- [ ] Drag and drop files
- [ ] Click to select files
- [ ] File size validation (5MB limit)
- [ ] File type validation (images and videos)
- [ ] Upload progress tracking
- [ ] Upload success/failure handling

### UI/UX Testing
- [ ] Step navigation (previous/next)
- [ ] Auto-save functionality
- [ ] Draft restoration
- [ ] File management (add/remove)
- [ ] File metadata editing
- [ ] Responsive design

### Integration Testing
- [ ] Form data persistence
- [ ] Media data flow to next steps
- [ ] Step completion tracking
- [ ] Error boundary handling

### Performance Testing
- [ ] Large file uploads
- [ ] Multiple file uploads
- [ ] Memory usage during uploads
- [ ] Network timeout handling

## Rollback Plan

If issues arise during restoration:

1. **Immediate Rollback**
   ```bash
   # Re-comment the import statement
   # Re-comment the step definition
   # Re-comment the step rendering
   # Restore the placeholder component
   ```

2. **Gradual Rollback**
   - Keep the step but disable file uploads
   - Keep the step but use mock data
   - Keep the step but simplify functionality

## Dependencies

### Required Dependencies
- Firebase Storage
- React hooks (useState, useEffect)
- UI components (Button, Card, Progress, etc.)
- Translation system (react-i18next)
- Auto-save hook (useAutoSave)

### Optional Dependencies
- Image processing libraries
- Video thumbnail generation
- File compression utilities

## Notes

- The step was originally designed to handle both images and videos
- File uploads are stored in Firebase Storage under `media/{userId}/{fileId}`
- The component includes quality indicators and completion scoring
- Auto-save functionality uses the key `'step2-media-visuals-draft'`
- The step integrates with the overall wizard flow and form data management

## Future Enhancements

When resuming this step, consider these potential enhancements:

1. **Advanced File Processing**
   - Image optimization
   - Video compression
   - Thumbnail generation

2. **Enhanced UI**
   - File previews
   - Drag and drop reordering
   - Batch operations

3. **Better Integration**
   - AI-powered image analysis
   - Automatic caption generation
   - Content-aware placement suggestions

4. **Performance Improvements**
   - Lazy loading
   - Progressive uploads
   - Caching strategies

---

**Last Updated**: [Current Date]
**Status**: Temporarily Disabled
**Priority**: Medium
**Estimated Restoration Time**: 2-3 hours 