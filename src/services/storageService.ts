import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface StorageItem {
  url: string;
  fullPath: string;
  name: string;
}

/**
 * Fetches all images from the galleryImage folder in Firebase Storage
 */
export async function fetchAllGalleryImages(): Promise<string[]> {
  try {
    console.log("Fetching all gallery images from Firebase Storage");
    
    // Reference to the galleryImage folder
    const galleryRef = ref(storage, 'galleryImage');
    
    // List all items in the gallery folder
    const result = await listAll(galleryRef);
    
    // Get download URLs for all items
    const urlPromises = result.items.map(async (itemRef) => {
      try {
        return await getDownloadURL(itemRef);
      } catch (error) {
        console.error(`Error getting download URL for ${itemRef.fullPath}:`, error);
        return null;
      }
    });
    
    const urls = await Promise.all(urlPromises);
    
    // Filter out any null values (failed downloads)
    const validUrls = urls.filter(url => url !== null) as string[];
    
    console.log(`Fetched ${validUrls.length} gallery images`);
    return validUrls;
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    throw error;
  }
}

/**
 * Fetches all images from the galleryImage folder with additional metadata
 */
export async function fetchAllGalleryItemsWithMetadata(): Promise<StorageItem[]> {
  try {
    console.log("Fetching all gallery items with metadata");
    
    // Reference to the galleryImage folder
    const galleryRef = ref(storage, 'galleryImage');
    
    // List all items in the gallery folder
    const result = await listAll(galleryRef);
    
    // Get download URLs and metadata for all items
    const itemPromises = result.items.map(async (itemRef) => {
      try {
        const url = await getDownloadURL(itemRef);
        return {
          url,
          fullPath: itemRef.fullPath,
          name: itemRef.name
        };
      } catch (error) {
        console.error(`Error getting download URL for ${itemRef.fullPath}:`, error);
        return null;
      }
    });
    
    const items = await Promise.all(itemPromises);
    
    // Filter out any null values (failed downloads)
    const validItems = items.filter(item => item !== null) as StorageItem[];
    
    console.log(`Fetched ${validItems.length} gallery items with metadata`);
    return validItems;
  } catch (error) {
    console.error("Error fetching gallery items with metadata:", error);
    throw error;
  }
}
