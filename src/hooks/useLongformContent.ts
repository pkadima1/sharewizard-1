import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface LongformContent {
  id: string;
  uid: string;
  moduleType: string;  inputs: {
    topic: string;
    audience: string;
    industry: string;
    keywords: string[];
    contentTone: string;
    contentType: string;
    structureFormat: string;
    wordCount: number;
    includeStats: boolean;
    ctaType: string;    mediaUrls: string[];
    mediaCaptions: string[];
    mediaAnalysis: string[]; // AI-analyzed descriptions of uploaded images
    mediaPlacementStrategy: string; // auto, manual, or semantic
    structureNotes: string;
    outputFormat: string;
    // New enhanced input fields
    writingPersonality?: string;
    readingLevel?: string;
    includeReferences?: boolean;
    tocRequired?: boolean;
    summaryRequired?: boolean;
    structuredData?: boolean;
    enableMetadataBlock?: boolean;
  };
  outline: any;
  content: string;  metadata: {
    actualWordCount: number;
    estimatedReadingTime: number;
    generatedAt: any;
    generationTime: number;
    outlineGenerationTime: number;
    contentGenerationTime: number;
    version: string;
    // New enhanced metadata fields
    readingLevel: string;
    hasReferences: boolean;
    contentPersonality: string;
    contentEmotion: string;
    topics: string[];
    metaTitle: string;
    metaDescription: string;
    contentQuality: {
      hasEmotionalElements: boolean;
      hasActionableContent: boolean;
      seoOptimized: boolean;
      structureComplexity: number;
    };
  };
  status: string;
}

export function useLongformContent(userId: string) {
  const [longformContent, setLongformContent] = useState<LongformContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const fetchLongformContent = async () => {
      try {
        const q = query(
          collection(db, 'users', userId, 'longform-content'),
          orderBy('metadata.generatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const content = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LongformContent[];
        
        setLongformContent(content);
      } catch (err) {
        console.error('Error fetching longform content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchLongformContent();
  }, [userId]);

  return { longformContent, loading, error };
}
