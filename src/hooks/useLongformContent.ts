import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface LongformContent {
  id: string;
  uid: string;
  moduleType: string;
  inputs: {
    topic: string;
    audience: string;
    industry: string;
    keywords: string[];
    contentTone: string;
    contentType: string;
    structureFormat: string;
    wordCount: number;
    includeStats: boolean;
    ctaType: string;
    mediaUrls: string[];
    mediaCaptions: string[];
    structureNotes: string;
    outputFormat: string;
  };
  outline: any;
  content: string;
  metadata: {
    actualWordCount: number;
    estimatedReadingTime: number;
    generatedAt: any;
    generationTime: number;
    outlineGenerationTime: number;
    contentGenerationTime: number;
    version: string;
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
