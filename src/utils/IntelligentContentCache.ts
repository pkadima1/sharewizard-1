/**
 * IntelligentContentCache - Type-safe content caching system
 * 
 * Features:
 * - Generic type safety for different content types
 * - TTL-based expiration
 * - LRU eviction
 * - Cache warming
 * - Usage statistics
 * - Runtime validation
 * 
 * @template OutlineT - Type for cached outlines (defaults to OutlineData)
 * @template ContentT - Type for cached content (defaults to ContentData)
 */

// Core interfaces for type safety
export interface OutlineSection {
  title: string;
  wordCount?: number;
  keyPoints?: string[];
  tone?: string;
  humanElements?: {
    storyOpportunity?: string;
    emotionalConnection?: string;
    practicalValue?: string;
  };
  subsections?: Array<{
    subtitle: string;
    focusArea: string;
    wordCount: number;
  }>;
}

export interface OutlineData {
  title: string;
  introduction?: string;
  sections: OutlineSection[];
  conclusion?: string;
  meta?: {
    estimatedReadingTime?: string;
    primaryEmotion?: string;
    keyValueProposition?: string;
    authorityLevel?: string;
    geographicScope?: string;
    trustFactors?: string[];
  };
  hookOptions?: string[];
  seoStrategy?: {
    metaDescription?: string;
    primaryKeyword?: string;
    geographicKeywords?: string[];
    authorityKeywords?: string[];
  };
  eevatOptimization?: {
    experienceSignals?: string[];
    expertiseMarkers?: string[];
    authorityIndicators?: string[];
    trustworthinessElements?: string[];
    geographicRelevance?: string[];
  };
}

export interface ContentData {
  title: string;
  htmlBody: string;
  seoScore?: number;
  readingTime?: string;
  keywords?: string[];
  metaDescription?: string;
  estimatedReadingTime?: string;
  primaryEmotion?: string;
  authorityLevel?: string;
  geographicScope?: string;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  key: string;
  size?: number; // Memory usage estimation
}

export interface CacheStats {
  totalItems: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  averageAccessCount: number;
  oldestItem: number;
  newestItem: number;
  memoryUsage: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  enableStats?: boolean;
  enableWarming?: boolean;
  evictionPolicy?: 'lru' | 'ttl' | 'hybrid';
}

/**
 * Type-safe content cache with generic support
 */
export class IntelligentContentCache<OutlineT = OutlineData, ContentT = ContentData> {
  private outlineCache: Map<string, CacheItem<OutlineT>>;
  private contentCache: Map<string, CacheItem<ContentT>>;
  private stats: {
    outlineHits: number;
    outlineMisses: number;
    contentHits: number;
    contentMisses: number;
    totalEvictions: number;
  };
  private config: Required<CacheConfig>;
  
  // TTL constants (in milliseconds)
  private readonly OUTLINE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly CONTENT_TTL = 60 * 60 * 1000; // 1 hour
  private readonly WARMING_TTL = 5 * 60 * 1000; // 5 minutes
  
  constructor(config: CacheConfig = {}) {
    this.outlineCache = new Map();
    this.contentCache = new Map();
    this.stats = {
      outlineHits: 0,
      outlineMisses: 0,
      contentHits: 0,
      contentMisses: 0,
      totalEvictions: 0
    };
    
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 30 * 60 * 1000,
      enableStats: config.enableStats !== false,
      enableWarming: config.enableWarming !== false,
      evictionPolicy: config.evictionPolicy || 'hybrid'
    };
    
    // Start periodic cleanup
    this.startCleanupInterval();
  }
  
  /**
   * Runtime validation for outline data
   */
  private isOutlineValid(data: unknown): data is OutlineT {
    if (!data || typeof data !== 'object') return false;
    
    const outline = data as Record<string, unknown>;
    
    // Basic structure validation
    if (typeof outline.title !== 'string' || !Array.isArray(outline.sections)) {
      return false;
    }
    
    // Validate sections structure
    for (const section of outline.sections) {
      if (typeof section !== 'object' || typeof (section as Record<string, unknown>).title !== 'string') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Runtime validation for content data
   */
  private isContentValid(data: unknown): data is ContentT {
    if (!data || typeof data !== 'object') return false;
    
    const content = data as Record<string, unknown>;
    
    // Basic structure validation
    if (typeof content.title !== 'string' || typeof content.htmlBody !== 'string') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if cache item is still valid (not expired)
   */
  private isItemValid<T>(item: CacheItem<T>, ttl: number): boolean {
    const now = Date.now();
    return (now - item.timestamp) < ttl;
  }
  
  /**
   * Get cached outline with type safety
   */
  getCachedOutline(key: string): OutlineT | null {
    const item = this.outlineCache.get(key);
    
    if (item && this.isItemValid(item, this.OUTLINE_TTL)) {
      // Runtime validation
      if (this.isOutlineValid(item.data)) {
        // Update access statistics
        item.accessCount++;
        item.lastAccessed = Date.now();
        
        if (this.config.enableStats) {
          this.stats.outlineHits++;
        }
        
        return item.data;
      } else {
        console.warn(`Invalid structure for cached outline: ${key}`);
        this.outlineCache.delete(key);
      }
    }
    
    if (this.config.enableStats) {
      this.stats.outlineMisses++;
    }
    
    return null;
  }
  
  /**
   * Get cached content with type safety
   */
  getCachedContent(key: string): ContentT | null {
    const item = this.contentCache.get(key);
    
    if (item && this.isItemValid(item, this.CONTENT_TTL)) {
      // Runtime validation
      if (this.isContentValid(item.data)) {
        // Update access statistics
        item.accessCount++;
        item.lastAccessed = Date.now();
        
        if (this.config.enableStats) {
          this.stats.contentHits++;
        }
        
        return item.data;
      } else {
        console.warn(`Invalid structure for cached content: ${key}`);
        this.contentCache.delete(key);
      }
    }
    
    if (this.config.enableStats) {
      this.stats.contentMisses++;
    }
    
    return null;
  }
  
  /**
   * Set cached outline with type safety
   */
  setCachedOutline(key: string, outline: OutlineT): void {
    // Runtime validation before caching
    if (!this.isOutlineValid(outline)) {
      console.error(`Invalid outline structure for key: ${key}`);
      return;
    }
    
    const item: CacheItem<OutlineT> = {
      data: outline,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      key,
      size: this.estimateSize(outline)
    };
    
    this.outlineCache.set(key, item);
    this.enforceSizeLimit();
  }
  
  /**
   * Set cached content with type safety
   */
  setCachedContent(key: string, content: ContentT): void {
    // Runtime validation before caching
    if (!this.isContentValid(content)) {
      console.error(`Invalid content structure for key: ${key}`);
      return;
    }
    
    const item: CacheItem<ContentT> = {
      data: content,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      key,
      size: this.estimateSize(content)
    };
    
    this.contentCache.set(key, item);
    this.enforceSizeLimit();
  }
  
  /**
   * Warm cache with outline data
   */
  warmOutlineCache(key: string, outline: OutlineT): void {
    if (!this.config.enableWarming) return;
    
    const item: CacheItem<OutlineT> = {
      data: outline,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      key,
      size: this.estimateSize(outline)
    };
    
    // Use shorter TTL for warming
    setTimeout(() => {
      if (this.outlineCache.has(key)) {
        const cachedItem = this.outlineCache.get(key)!;
        if (cachedItem.accessCount === 0) {
          this.outlineCache.delete(key);
        }
      }
    }, this.WARMING_TTL);
    
    this.outlineCache.set(key, item);
  }
  
  /**
   * Warm cache with content data
   */
  warmContentCache(key: string, content: ContentT): void {
    if (!this.config.enableWarming) return;
    
    const item: CacheItem<ContentT> = {
      data: content,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      key,
      size: this.estimateSize(content)
    };
    
    // Use shorter TTL for warming
    setTimeout(() => {
      if (this.contentCache.has(key)) {
        const cachedItem = this.contentCache.get(key)!;
        if (cachedItem.accessCount === 0) {
          this.contentCache.delete(key);
        }
      }
    }, this.WARMING_TTL);
    
    this.contentCache.set(key, item);
  }
  
  /**
   * Remove item from outline cache
   */
  removeOutline(key: string): boolean {
    return this.outlineCache.delete(key);
  }
  
  /**
   * Remove item from content cache
   */
  removeContent(key: string): boolean {
    return this.contentCache.delete(key);
  }
  
  /**
   * Clear all caches
   */
  clear(): void {
    this.outlineCache.clear();
    this.contentCache.clear();
    this.resetStats();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalOutlineItems = this.outlineCache.size;
    const totalContentItems = this.contentCache.size;
    const totalItems = totalOutlineItems + totalContentItems;
    
    const totalHits = this.stats.outlineHits + this.stats.contentHits;
    const totalMisses = this.stats.outlineMisses + this.stats.contentMisses;
    const totalRequests = totalHits + totalMisses;
    
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    
    // Calculate average access count
    let totalAccessCount = 0;
    let itemCount = 0;
    
    for (const item of this.outlineCache.values()) {
      totalAccessCount += item.accessCount;
      itemCount++;
    }
    
    for (const item of this.contentCache.values()) {
      totalAccessCount += item.accessCount;
      itemCount++;
    }
    
    const averageAccessCount = itemCount > 0 ? totalAccessCount / itemCount : 0;
    
    // Find oldest and newest items
    let oldestItem = Date.now();
    let newestItem = 0;
    
    for (const item of this.outlineCache.values()) {
      oldestItem = Math.min(oldestItem, item.timestamp);
      newestItem = Math.max(newestItem, item.timestamp);
    }
    
    for (const item of this.contentCache.values()) {
      oldestItem = Math.min(oldestItem, item.timestamp);
      newestItem = Math.max(newestItem, item.timestamp);
    }
    
    return {
      totalItems,
      totalHits,
      totalMisses,
      hitRate,
      averageAccessCount,
      oldestItem,
      newestItem,
      memoryUsage: this.calculateMemoryUsage()
    };
  }
  
  /**
   * Estimate memory usage of cached data
   */
  private estimateSize<T>(data: T): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
  
  /**
   * Calculate total memory usage
   */
  private calculateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const item of this.outlineCache.values()) {
      totalSize += item.size || 0;
    }
    
    for (const item of this.contentCache.values()) {
      totalSize += item.size || 0;
    }
    
    return totalSize;
  }
  
  /**
   * Enforce size limits with eviction
   */
  private enforceSizeLimit(): void {
    const totalItems = this.outlineCache.size + this.contentCache.size;
    
    if (totalItems <= this.config.maxSize) return;
    
    // Determine items to evict based on policy
    const itemsToEvict = totalItems - this.config.maxSize;
    
    if (this.config.evictionPolicy === 'lru') {
      this.evictLRU(itemsToEvict);
    } else if (this.config.evictionPolicy === 'ttl') {
      this.evictExpired();
    } else {
      // Hybrid: evict expired first, then LRU
      this.evictExpired();
      const remaining = this.outlineCache.size + this.contentCache.size - this.config.maxSize;
      if (remaining > 0) {
        this.evictLRU(remaining);
      }
    }
  }
  
  /**
   * Evict least recently used items
   */
  private evictLRU(count: number): void {
    const allItems: Array<{ key: string; lastAccessed: number; type: 'outline' | 'content' }> = [];
    
    for (const [key, item] of this.outlineCache.entries()) {
      allItems.push({ key, lastAccessed: item.lastAccessed, type: 'outline' });
    }
    
    for (const [key, item] of this.contentCache.entries()) {
      allItems.push({ key, lastAccessed: item.lastAccessed, type: 'content' });
    }
    
    // Sort by last accessed time (oldest first)
    allItems.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Evict oldest items
    for (let i = 0; i < Math.min(count, allItems.length); i++) {
      const item = allItems[i];
      if (item.type === 'outline') {
        this.outlineCache.delete(item.key);
      } else {
        this.contentCache.delete(item.key);
      }
    }
    
    this.stats.totalEvictions += Math.min(count, allItems.length);
  }
  
  /**
   * Evict expired items
   */
  private evictExpired(): void {
    const now = Date.now();
    let evictedCount = 0;
    
    // Evict expired outlines
    for (const [key, item] of this.outlineCache.entries()) {
      if (!this.isItemValid(item, this.OUTLINE_TTL)) {
        this.outlineCache.delete(key);
        evictedCount++;
      }
    }
    
    // Evict expired content
    for (const [key, item] of this.contentCache.entries()) {
      if (!this.isItemValid(item, this.CONTENT_TTL)) {
        this.contentCache.delete(key);
        evictedCount++;
      }
    }
    
    this.stats.totalEvictions += evictedCount;
  }
  
  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.evictExpired();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }
  
  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      outlineHits: 0,
      outlineMisses: 0,
      contentHits: 0,
      contentMisses: 0,
      totalEvictions: 0
    };
  }
  
  /**
   * Get cache size information
   */
  getSizeInfo(): { outlineCount: number; contentCount: number; totalCount: number } {
    return {
      outlineCount: this.outlineCache.size,
      contentCount: this.contentCache.size,
      totalCount: this.outlineCache.size + this.contentCache.size
    };
  }
  
  /**
   * Check if key exists in outline cache
   */
  hasOutline(key: string): boolean {
    const item = this.outlineCache.get(key);
    return item ? this.isItemValid(item, this.OUTLINE_TTL) : false;
  }
  
  /**
   * Check if key exists in content cache
   */
  hasContent(key: string): boolean {
    const item = this.contentCache.get(key);
    return item ? this.isItemValid(item, this.CONTENT_TTL) : false;
  }
  
  /**
   * Get all outline keys
   */
  getOutlineKeys(): string[] {
    return Array.from(this.outlineCache.keys());
  }
  
  /**
   * Get all content keys
   */
  getContentKeys(): string[] {
    return Array.from(this.contentCache.keys());
  }
}

// Create default instance for backward compatibility
const contentCache = new IntelligentContentCache();

// Legacy exports for backward compatibility
export const getCachedOutline = (key: string) => contentCache.getCachedOutline(key);
export const setCachedOutline = (key: string, outline: OutlineData) => contentCache.setCachedOutline(key, outline);
export const getCachedContent = (key: string) => contentCache.getCachedContent(key);
export const setCachedContent = (key: string, content: ContentData) => contentCache.setCachedContent(key, content);
export const removeCachedOutline = (key: string) => contentCache.removeOutline(key);
export const removeCachedContent = (key: string) => contentCache.removeContent(key);
export const clearCache = () => contentCache.clear();
export const getCacheStats = () => contentCache.getStats();
export const getCacheSize = () => contentCache.getSizeInfo();

// Export the default instance for direct use
export { contentCache }; 