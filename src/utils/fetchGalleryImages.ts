import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

export async function fetchGalleryImages(): Promise<string[]> {
  const galleryRef = ref(storage, "galleryImage");
  const result = await listAll(galleryRef);
  const urlPromises = result.items.map((itemRef) => getDownloadURL(itemRef));
  return Promise.all(urlPromises);
} 