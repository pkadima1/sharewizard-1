import React, { useEffect, useState } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath: string; // e.g. "EngPerfectPartnerMedia/header Image.png"
  fallbackSrc?: string; // local/public fallback
}

const StorageImage: React.FC<StorageImageProps> = ({ storagePath, fallbackSrc, alt, ...rest }) => {
  const [src, setSrc] = useState<string | undefined>(fallbackSrc); // Start with fallback
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const url = await getDownloadURL(ref(storage, storagePath));
        if (mounted) {
          setSrc(url);
          setLoading(false);
        }
      } catch (e) {
        console.warn(`StorageImage: failed to load ${storagePath}`, e);
        // Keep fallback if already set
        if (mounted) {
          if (fallbackSrc && src !== fallbackSrc) setSrc(fallbackSrc);
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [storagePath, fallbackSrc]);

  return (
    <img
      loading="lazy"
      src={src}
      alt={alt}
      onError={() => {
        if (fallbackSrc && src !== fallbackSrc) setSrc(fallbackSrc);
      }}
      style={{ 
        opacity: loading && !fallbackSrc ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out',
        ...rest.style
      }}
      {...rest}
    />
  );
};

export default StorageImage;
