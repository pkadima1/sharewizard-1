/**
 * BlogContentRenderer.tsx - Reusable Blog Content Renderer Component
 * 
 * Purpose: Reusable component for rendering blog content with consistent formatting
 * Usage: Can be used anywhere in the app where blog content needs to be displayed
 */

import React from 'react';
import { formatBlogContent, formatBlogContentPreview, getContentPreview } from '@/utils/contentFormatter';

interface BlogContentRendererProps {
  content: string;
  preview?: boolean;
  maxPreviewLength?: number;
  className?: string;
}

/**
 * Reusable component for rendering blog content with consistent formatting
 * 
 * @param content - The raw blog content (markdown)
 * @param preview - Whether to render in preview mode (smaller spacing)
 * @param maxPreviewLength - Maximum length for preview content
 * @param className - Additional CSS classes
 */
export const BlogContentRenderer: React.FC<BlogContentRendererProps> = ({
  content,
  preview = false,
  maxPreviewLength,
  className = ''
}) => {
  const formattedContent = preview 
    ? formatBlogContentPreview(content, maxPreviewLength)
    : formatBlogContent(content);

  return (
    <div 
      className={`prose ${preview ? 'prose-sm' : 'prose-lg'} max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

/**
 * Simple text preview component for blog content
 */
interface BlogTextPreviewProps {
  content: string;
  maxLength?: number;
  className?: string;
}

export const BlogTextPreview: React.FC<BlogTextPreviewProps> = ({
  content,
  maxLength = 200,
  className = ''
}) => {
  const preview = getContentPreview(content, maxLength);
  
  return (
    <p className={`text-gray-600 dark:text-gray-400 ${className}`}>
      {preview}
    </p>
  );
};

export default BlogContentRenderer;
