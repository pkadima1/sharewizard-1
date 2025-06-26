import { fetchAllGalleryImages } from '../services/storageService';

/**
 * Utility function to fetch gallery images
 * For the homepage carousel, it uses hardcoded images to ensure consistent display
 * For the gallery page, it fetches all images from Firebase Storage
 */
export async function fetchGalleryImages(forHomepage = false): Promise<string[]> {
  // These specific images are hardcoded for consistent display in the homepage carousel
  const specificImageUrls = [
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2FEngagePerfect1.png?alt=media&token=0d35a727-d746-45be-b902-c6dee1530e62",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2FEngagePerfectAI.png?alt=media&token=f7f5813b-7fe2-453c-9cae-5e5932a91083",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2FEngagePerfect1Jun%2024%2C%202025%2C%2011_50_28%20AM.png?alt=media&token=720ce29a-5777-4d00-a9a2-1752e75908de",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2FEngagePerfect%C3%A9.png?alt=media&token=387e924c-125f-4d70-aef9-d9393bae806e",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2FSilhouette%20at%20Dusk_%20Engaging%20Content%20Strategy.png?alt=media&token=3d060e56-d604-4b86-acef-b74982bf0829",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2Fl_univers-_-une-ia-%C3%A9clair%C3%A9e-_-1747215348694.png?alt=media&token=3d55d9d0-8bbd-4ee7-86ee-32ccfede9bc8",
    "https://firebasestorage.googleapis.com/v0/b/engperfecthlc.firebasestorage.app/o/galleryImage%2Fthe-science-of-flavor_-unlocking-deliciousness-1747418896604.png?alt=media&token=2345b7ee-bda5-447f-87f2-d6ca62cf369d"
  ];

  try {
    // For homepage carousel, use hardcoded images
    if (forHomepage) {
      console.log("Fetching specific gallery images for homepage carousel");
      return specificImageUrls;
    }
    
    // For gallery page, fetch all images from Firebase Storage
    console.log("Fetching all gallery images from Firebase Storage");
    return await fetchAllGalleryImages();
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return [];
  }
}