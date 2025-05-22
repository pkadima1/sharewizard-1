import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Generation {
  id: string;
  createdAt: any;
  input: {
    platform: string;
    goal: string;
    niche: string;
    tone: string;
    postIdea?: string;
  };
  isFavorite: boolean;
  posted: boolean;
  output: Array<{
    caption: string;
    cta: string;
    hashtags: string[];
    title: string;
  }>;
  downloaded_count?: number;
  shared_count?: number;
}

export function useUserGenerations(userId: string) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const fetchGenerations = async () => {
      const q = query(
        collection(db, 'users', userId, 'generations'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      setGenerations(
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Generation[]
      );
      setLoading(false);
    };
    fetchGenerations();
  }, [userId]);

  return { generations, loading };
} 