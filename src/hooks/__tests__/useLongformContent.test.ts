import { renderHook, waitFor } from '@testing-library/react';
import { useLongformContent } from '../useLongformContent';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;

describe('useLongformContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockGetDocs.mockResolvedValue({
      docs: [],
    } as any);

    const { result } = renderHook(() => useLongformContent('test-user-id'));

    expect(result.current.loading).toBe(true);
    expect(result.current.longformContent).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should fetch longform content successfully', async () => {
    const mockContent = {
      id: 'test-doc-id',
      uid: 'test-user-id',
      moduleType: 'longform',
      inputs: {
        topic: 'Test Topic',
        audience: 'Test Audience',
        industry: 'Test Industry',
        keywords: ['test', 'keywords'],
        contentTone: 'professional',
        contentType: 'blog-article',
        structureFormat: 'intro-points-cta',
        wordCount: 1000,
        includeStats: false,
        ctaType: 'none',
        mediaUrls: [],
        mediaCaptions: [],
        structureNotes: '',
        outputFormat: 'markdown',
      },
      outline: {},
      content: 'Test content here...',
      metadata: {
        actualWordCount: 1000,
        estimatedReadingTime: 5,
        generatedAt: { toDate: () => new Date() },
        generationTime: 10000,
        outlineGenerationTime: 2000,
        contentGenerationTime: 8000,
        version: '2.2.0',
        contentQuality: {
          hasEmotionalElements: true,
          hasActionableContent: true,
          seoOptimized: true,
          structureComplexity: 5,
        },
      },
      status: 'completed',
    };

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'test-doc-id',
          data: () => mockContent,
        },
      ],
    } as any);

    const { result } = renderHook(() => useLongformContent('test-user-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.longformContent).toHaveLength(1);
    expect(result.current.longformContent[0]).toEqual({
      id: 'test-doc-id',
      ...mockContent,
    });
    expect(result.current.error).toBe(null);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Firestore error');
    mockGetDocs.mockRejectedValue(mockError);

    const { result } = renderHook(() => useLongformContent('test-user-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.longformContent).toEqual([]);
    expect(result.current.error).toBe('Failed to load content');
  });

  it('should not fetch when userId is empty', () => {
    const { result } = renderHook(() => useLongformContent(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.longformContent).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});
