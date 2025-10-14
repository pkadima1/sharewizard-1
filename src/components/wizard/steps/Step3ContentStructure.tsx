import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Content type options
const CONTENT_TYPES = [
  'Blog Post',
  'Article',
  'Tutorial',
  'Guide',
  'Case Study',
  'How-to',
  'How-To / Step-by-Step',
  'FAQ / Q&A',
  'Comparison / vs.',
  'Review / Analysis',
  'List Post',
  'Opinion Piece',
  'Review',
  'Interview'
];

// Tone options
const TONE_OPTIONS = [
  'Professional',
  'Casual',
  'Friendly',
  'Authoritative',
  'Conversational',
  'Informative',
  'Inspirational',
  'Humorous',
  'Technical',
  'Persuasive',
  'Formal',
  'Storytelling'
];

const Step3ContentStructure = ({ formData, updateFormData }) => {
  // Function to handle structure change
  const handleStructureChange = (e) => {
    updateFormData('structureNotes', e.target.value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Structure & Tone</h2>
        <p className="text-muted-foreground">
          Define how your content should be structured and what tone it should have.
        </p>
      </div>

      <div className="space-y-4">
        {/* Content Type Selection */}
        <div className="space-y-2">
          <label htmlFor="contentType" className="block text-sm font-medium">
            Content Type
          </label>
          <Select 
            value={formData.contentType} 
            onValueChange={(value) => updateFormData('contentType', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('step3.placeholders.contentType')} />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((type) => (
                <SelectItem key={type} value={type.toLowerCase().replace(' ', '-')}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This determines the overall format and purpose of your content.
          </p>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <label htmlFor="tone" className="block text-sm font-medium">
            Content Tone
          </label>
          <Select 
            value={formData.tone} 
            onValueChange={(value) => updateFormData('tone', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('step3.placeholders.contentTone')} />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((tone) => (
                <SelectItem key={tone} value={tone.toLowerCase()}>
                  {tone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The tone defines the voice and personality of your content.
          </p>
        </div>

        {/* Structure Notes */}
        <div className="space-y-2">
          <label htmlFor="structure" className="block text-sm font-medium">
            Structure Notes (Optional)
          </label>
          <Textarea
            id="structure"
            placeholder="E.g., 'Include an introduction, 5 main points with subheadings, and a conclusion with call to action'"
            value={formData.structureNotes || ''}
            onChange={handleStructureChange}
            className="w-full min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground">
            Provide any specific structural elements you'd like to include in your content.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step3ContentStructure;
