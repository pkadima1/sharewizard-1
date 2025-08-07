/**
 * Blog.tsx - v1.0.0
 * 
 * Purpose: Blog page displaying all generated longform content for afribudget@gmail.com
 * Features: Mobile-first design, content filtering, search, and responsive layout
 * Follows: Current UX/UI patterns from the project
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Clock, 
  TrendingUp,
  Eye,
  Search,
  Filter,
  BookOpen,
  User,
  Globe,
  Tag,
  ArrowRight,
  Share2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { formatBlogContentPreview, getContentPreview } from '@/utils/contentFormatter';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const Blog: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching blog posts for user:', BLOG_USER_ID);
        
        // Simple query without authentication requirements - completely public
        const q = query(
          collection(db, 'users', BLOG_USER_ID, 'longform-content')
        );
        
        const querySnapshot = await getDocs(q);
        
        const allPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];
        
        console.log(`Found ${allPosts.length} total documents`);
        
        // Filter completed posts manually and ensure they have required fields
        const blogPosts = allPosts.filter(post => {
          const hasStatus = post.status === 'completed';
          const hasMetadata = post.metadata && post.metadata.generatedAt;
          const hasInputs = post.inputs && post.inputs.topic;
          
          if (!hasStatus) {
            console.log(`Post ${post.id} filtered out - status: ${post.status}`);
          }
          if (!hasMetadata) {
            console.log(`Post ${post.id} filtered out - missing metadata or generatedAt`);
          }
          if (!hasInputs) {
            console.log(`Post ${post.id} filtered out - missing inputs or topic`);
          }
          
          return hasStatus && hasMetadata && hasInputs;
        });
        
        console.log(`Found ${blogPosts.length} valid blog posts`);
        
        // Sort manually by generatedAt in descending order
        blogPosts.sort((a, b) => {
          try {
            const dateA = a.metadata?.generatedAt?.toDate?.() || new Date(a.metadata?.generatedAt || 0);
            const dateB = b.metadata?.generatedAt?.toDate?.() || new Date(b.metadata?.generatedAt || 0);
            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            console.error('Error sorting posts by date:', error);
            return 0;
          }
        });
        
        setPosts(blogPosts);
        
        if (blogPosts.length === 0) {
          console.log('No completed posts found, but found these statuses:', allPosts.map(p => p.status));
          toast({
            title: "No Content Found",
            description: "No published blog content is available at this time.",
          });
        }
        
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        toast({
          title: "Error Loading Content",
          description: "Unable to fetch blog posts. Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [toast]);

  // Get unique categories from posts
  const categories = useMemo(() => {
    const cats = new Set(posts.map(post => post.inputs.industry));
    return ['all', ...Array.from(cats)];
  }, [posts]);

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Ensure post has required fields
      if (!post.inputs?.topic || !post.inputs?.keywords || !post.inputs?.audience || !post.inputs?.industry) {
        return false;
      }

      const matchesSearch = searchTerm === '' || 
        post.inputs.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.inputs.keywords.some(keyword => 
          keyword && keyword.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        post.inputs.audience.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        post.inputs.industry === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

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
    const colors = {
      'blog-article': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'how-to-guide': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'list-article': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'case-study': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'news-analysis': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  // Open post preview
  const openPreview = (post: BlogPost) => {
    setSelectedPost(post);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('blog.loading')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('blog.subtitle')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">{t('blog.error')}</h2>
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                {t('buttons.tryAgain', 'Try Again')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                {t('blog.title')}
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
              {t('blog.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{posts.length} {t('blog.stats.articles')}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{t('blog.stats.aiPoweredContent')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>{t('blog.stats.updatedRegularly')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('blog.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('blog.filters.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? t('blog.filters.allCategories') : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {searchTerm || selectedCategory !== 'all' ? 'No articles found' : 'No articles available'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'New content will appear here as it becomes available.'}
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className="p-6">
                      {/* Content Type Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={getContentTypeColor(post.inputs.contentType)}>
                          {post.inputs.contentType.replace('-', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          {post.metadata?.estimatedReadingTime || 'Unknown'} {t('blog.article.readTime')}
                        </div>
                      </div>

                      {/* Title */}
                      <Link to={`/blog/${post.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors hover:text-primary cursor-pointer">
                          {post.inputs.topic}
                        </h3>
                      </Link>

                      {/* Content Preview */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {getContentPreview(post.content)}
                      </p>

                      {/* Keywords */}
                      {post.inputs.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.inputs.keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                          {post.inputs.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.inputs.keywords.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.metadata?.generatedAt ? formatDate(post.metadata.generatedAt) : 'Unknown Date'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {post.metadata?.actualWordCount?.toLocaleString() || 'Unknown'} {t('blog.article.words')}
                          </span>
                        </div>
                        {post.metadata?.contentQuality?.seoOptimized && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="h-2 w-2" />
                            {t('blog.article.seo')}
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 group-hover:border-primary group-hover:text-primary transition-colors"
                        >
                          <Link to={`/blog/${post.id}`} className="flex items-center justify-center">
                            <Eye className="h-4 w-4 mr-2" />
                            {t('blog.article.readArticle')}
                          </Link>
                        </Button>
                        <Button
                          onClick={() => openPreview(post)}
                          variant="ghost"
                          size="sm"
                          title="Quick preview"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/blog/${post.id}`;
                            navigator.share?.({
                              title: post.inputs.topic,
                              text: getContentPreview(post.content, 100),
                              url: shareUrl
                            }).catch(() => {
                              navigator.clipboard.writeText(shareUrl);
                              toast({
                                title: "Link Copied",
                                description: "Article link copied to clipboard",
                              });
                            });
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Article Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedPost?.inputs.topic}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {selectedPost?.metadata?.generatedAt ? formatDate(selectedPost.metadata.generatedAt) : 'Unknown Date'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedPost?.metadata?.estimatedReadingTime || 'Unknown'} {t('blog.article.readTime')}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {selectedPost?.metadata?.actualWordCount?.toLocaleString() || 'Unknown'} {t('blog.article.words')}
                </span>
                <Badge className={selectedPost ? getContentTypeColor(selectedPost.inputs.contentType) : ''}>
                  {selectedPost?.inputs.contentType.replace('-', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Target Audience:</span>
                <Badge variant="outline">{selectedPost?.inputs.audience}</Badge>
                <span className="text-sm font-medium">Industry:</span>
                <Badge variant="outline">{selectedPost?.inputs.industry}</Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            {selectedPost && (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: formatBlogContentPreview(selectedPost.content)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Blog;
