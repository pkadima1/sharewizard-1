/**
 * BlogPost.tsx - Individual Blog Post Reading Page
 * 
 * Purpose: Display individual blog posts with unique shareable URLs
 * Features: Full content view, SEO optimization, social sharing, navigation
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp,
  Share2,
  FileText,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  ExternalLink,
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { formatBlogContent, getContentPreview } from '@/utils/contentFormatter';

// User ID for afribudget@gmail.com
const BLOG_USER_ID = 'CMJHcwlYKyOmxnQpDajZMb31lHG3';

interface BlogPost {
  id: string;
  uid: string;
  inputs: {
    topic: string;
    audience: string;
    industry: string;
    keywords: string[];
    contentTone: string;
    contentType: string;
    wordCount: number;
  };
  content: string;
  metadata: {
    actualWordCount: number;
    estimatedReadingTime: number;
    generatedAt: any;
    contentQuality: {
      hasEmotionalElements: boolean;
      hasActionableContent: boolean;
      seoOptimized: boolean;
      structureComplexity: number;
    };
  };
  status: string;
}

const BlogPost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [nextPost, setNextPost] = useState<BlogPost | null>(null);
  const [prevPost, setPrevPost] = useState<BlogPost | null>(null);

  // Fetch individual blog post
  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!postId) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching blog post:', postId);
        
        // Fetch the specific post
        const postDoc = await getDoc(
          doc(db, 'users', BLOG_USER_ID, 'longform-content', postId)
        );
        
        if (!postDoc.exists()) {
          setError('Blog post not found');
          setLoading(false);
          return;
        }

        const postData = { id: postDoc.id, ...postDoc.data() } as BlogPost;
        
        // Validate post
        if (postData.status !== 'completed' || !postData.inputs?.topic || !postData.content) {
          setError('Blog post is not available');
          setLoading(false);
          return;
        }

        setPost(postData);

        // Fetch related posts and navigation posts
        await Promise.all([
          fetchRelatedPosts(postData),
          fetchNavigationPosts(postData)
        ]);

      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post. Please try again later.');
        toast({
          title: "Error Loading Post",
          description: "Unable to fetch the blog post. Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [postId, toast]);

  // Fetch related posts based on industry/keywords
  const fetchRelatedPosts = async (currentPost: BlogPost) => {
    try {
      const q = query(
        collection(db, 'users', BLOG_USER_ID, 'longform-content'),
        where('status', '==', 'completed'),
        orderBy('metadata.generatedAt', 'desc'),
        limit(6)
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
        .filter(p => 
          p.id !== currentPost.id && 
          p.inputs?.topic && 
          (p.inputs.industry === currentPost.inputs.industry ||
           p.inputs.keywords.some(keyword => 
             currentPost.inputs.keywords.includes(keyword)
           ))
        )
        .slice(0, 3);
      
      setRelatedPosts(posts);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  // Fetch next and previous posts for navigation
  const fetchNavigationPosts = async (currentPost: BlogPost) => {
    try {
      const currentDate = currentPost.metadata?.generatedAt?.toDate?.() || new Date(currentPost.metadata?.generatedAt || 0);
      
      // Fetch all posts to find next/prev
      const q = query(
        collection(db, 'users', BLOG_USER_ID, 'longform-content'),
        where('status', '==', 'completed')
      );
      
      const querySnapshot = await getDocs(q);
      const allPosts = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
        .filter(p => p.inputs?.topic && p.id !== currentPost.id)
        .sort((a, b) => {
          const dateA = a.metadata?.generatedAt?.toDate?.() || new Date(a.metadata?.generatedAt || 0);
          const dateB = b.metadata?.generatedAt?.toDate?.() || new Date(b.metadata?.generatedAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

      const currentIndex = allPosts.findIndex(p => {
        const postDate = p.metadata?.generatedAt?.toDate?.() || new Date(p.metadata?.generatedAt || 0);
        return postDate.getTime() === currentDate.getTime();
      });

      if (currentIndex > 0) {
        setNextPost(allPosts[currentIndex - 1]); // Newer post
      }
      if (currentIndex < allPosts.length - 1) {
        setPrevPost(allPosts[currentIndex + 1]); // Older post
      }
      
    } catch (error) {
      console.error('Error fetching navigation posts:', error);
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get content type color
  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'blog-article': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'how-to-guide': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'list-article': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'case-study': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'news-analysis': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  // Share functionality
  const sharePost = async () => {
    const shareData = {
      title: post?.inputs.topic || 'Blog Post',
      text: getContentPreview(post?.content || '', 150),
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Article link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Create SEO-friendly slug for URLs
  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading article...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the content</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Article Not Found</h2>
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => navigate('/blog')}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.inputs.topic} | EngagePerfect Blog</title>
        <meta name="description" content={getContentPreview(post.content, 160)} />
        <meta name="keywords" content={post.inputs.keywords.join(', ')} />
        <meta property="og:title" content={post.inputs.topic} />
        <meta property="og:description" content={getContentPreview(post.content, 160)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.inputs.topic} />
        <meta name="twitter:description" content={getContentPreview(post.content, 160)} />
        <link rel="canonical" href={window.location.href} />
        <meta property="article:published_time" content={post.metadata.generatedAt?.toDate?.()?.toISOString() || ''} />
        <meta property="article:author" content="EngagePerfect AI" />
        <meta property="article:section" content={post.inputs.industry} />
        {post.inputs.keywords.map((keyword, index) => (
          <meta key={index} property="article:tag" content={keyword} />
        ))}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header with navigation */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/blog">Blog</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    {post.inputs.topic}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sharePost}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Article content */}
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Article header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={getContentTypeColor(post.inputs.contentType)}>
                {post.inputs.contentType.replace('-', ' ')}
              </Badge>
              {post.metadata?.contentQuality?.seoOptimized && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-2 w-2" />
                  SEO Optimized
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {post.inputs.topic}
            </h1>

            {/* Article meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.metadata.generatedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.metadata?.estimatedReadingTime || 'Unknown'} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{post.metadata?.actualWordCount?.toLocaleString() || 'Unknown'} words</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>EngagePerfect AI</span>
              </div>
            </div>

            {/* Keywords */}
            {post.inputs.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.inputs.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            {/* Article meta info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-8">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Target Audience: </span>
                  <span className="text-gray-600 dark:text-gray-400">{post.inputs.audience}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Industry: </span>
                  <span className="text-gray-600 dark:text-gray-400">{post.inputs.industry}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Tone: </span>
                  <span className="text-gray-600 dark:text-gray-400">{post.inputs.contentTone}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Article content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{
                __html: formatBlogContent(post.content)
              }}
            />
          </div>

          {/* Article footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={sharePost}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Article
              </Button>
              
              <Link to="/blog" className="text-primary hover:underline flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                More Articles
              </Link>
            </div>
          </footer>
        </article>

        {/* Navigation to next/previous posts */}
        {(nextPost || prevPost) && (
          <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prevPost && (
                  <Link
                    to={`/blog/${prevPost.id}`}
                    className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Previous Article</p>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                        {prevPost.inputs.topic}
                      </h3>
                    </div>
                  </Link>
                )}
                
                {nextPost && (
                  <Link
                    to={`/blog/${nextPost.id}`}
                    className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors md:justify-end text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Article</p>
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                        {nextPost.inputs.topic}
                      </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <section className="bg-gray-50 dark:bg-gray-900/50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Related Articles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.id}`}
                    className="group block bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all duration-300"
                  >
                    <div className="mb-3">
                      <Badge className={getContentTypeColor(relatedPost.inputs.contentType)}>
                        {relatedPost.inputs.contentType.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {relatedPost.inputs.topic}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {getContentPreview(relatedPost.content)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(relatedPost.metadata.generatedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relatedPost.metadata?.estimatedReadingTime || 'Unknown'} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default BlogPost;
