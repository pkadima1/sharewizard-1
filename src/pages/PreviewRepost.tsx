import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext';
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Copy } from 'lucide-react';
import { sharePreview, downloadPreview } from '../utils/sharingUtils';
import { MediaType } from '@/types/mediaTypes';

const PreviewRepost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { caption: initialCaption, gen, mediaFile } = location.state || {};
  
  const [currentCaption, setCurrentCaption] = useState(initialCaption);

  const { currentUser } = useAuth();

  // Initialize showCaptionOverlay to true if mediaFile is an image or video
  const [showCaptionOverlay, setShowCaptionOverlay] = useState(mediaFile && (mediaFile.type.startsWith('image') || mediaFile.type.startsWith('video')));
  const [isEditingText, setIsEditingText] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  if (!currentCaption || !gen) {
    return <div className="p-4">Invalid preview data.</div>;
  }

  // Helper to render caption text on image for download/sharing
  const renderImageWithOverlay = async () => {
    return new Promise<Blob | null>((resolve) => {
      if (!mediaFile || !mediaFile.type.startsWith('image') || !showCaptionOverlay) return resolve(mediaFile);
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        
        const text = currentCaption.caption;
        
        const maxWidth = canvas.width * 0.8;
        const lineHeight = Math.floor(canvas.height / 20);
        let y = canvas.height * 0.85;

        ctx.font = `${lineHeight * 1.2}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;

        const words = text.split(' ');
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                ctx.fillText(currentLine, canvas.width / 2, y);
                currentLine = word;
                y += lineHeight;
            }
        }
        ctx.fillText(currentLine, canvas.width / 2, y);

        canvas.toBlob(blob => resolve(blob), mediaFile.type);
      };
      img.src = URL.createObjectURL(mediaFile);
    });
  };

  const handleShareOrDownload = async (action: 'share' | 'download') => {
    const targetUserId = currentUser?.uid || gen.userId;
    if (!targetUserId) {
      toast.error("User ID is not available for operation.");
      console.error("User ID is not available for operation.");
      return;
    }

    try {
      const genRef = doc(db, 'users', targetUserId, 'generations', gen.id);

      if (action === 'share') {
        // Use the sharePreview utility for Web Share API
        const mediaType: MediaType = mediaFile ? (mediaFile.type.startsWith('video') ? 'video' : 'image') : 'text-only';
        const result = await sharePreview(
          previewRef,
          currentCaption,
          mediaType
        );

        if (result.status === 'shared') {
          // Update share count in Firebase upon successful share (including fallbacks)
          const updateData: any = {
            share_count: (gen.share_count || 0) + 1,
            posted: true, // Mark as posted if shared
          };
           await updateDoc(genRef, updateData);
           // sharePreview already shows success toast
        } else if (result.status === 'cancelled') {
          toast.info('Sharing cancelled.');
        } else if (result.status === 'fallback') {
           // sharePreview already shows fallback toast and handles clipboard copy
           // Optionally update share count for fallback too
           const updateData: any = {
            share_count: (gen.share_count || 0) + 1,
            posted: true, // Mark as posted if shared
          };
           await updateDoc(genRef, updateData);
        }
        // Do NOT navigate to profile page here, stay on preview

      } else if (action === 'download') {
        // Keep existing download logic, now using the downloadPreview utility
        const mediaType: MediaType = mediaFile ? (mediaFile.type.startsWith('video') ? 'video' : 'image') : 'text-only';
         // downloadPreview utility handles the download process and success toast
         await downloadPreview(
          previewRef,
          mediaType,
          currentCaption,
          mediaFile?.name // Pass original filename hint
         );

        // Update download count in Firebase upon successful download
        const updateData: any = {
          download_count: (gen.download_count || 0) + 1,
          posted: true, // Mark as posted if downloaded
        };
        await updateDoc(genRef, updateData);

        // Optional: navigate to profile after download? Keeping the navigation for download for now.
        // navigate('/profile');
      }

    } catch (error: any) {
      console.error('Operation error:', error);
      toast.error(`Operation failed: ${error.message}`);
    }
  };

  // For download, trigger browser download
  const handleDownload = async () => {
    let fileToDownload = mediaFile;
    if (mediaFile && mediaFile.type.startsWith('image')) {
      fileToDownload = await renderImageWithOverlay();
    }
    if (fileToDownload) {
      const url = URL.createObjectURL(fileToDownload);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded successfully!');
    }
  };

  // Handle saving edited text
  const handleSaveEdit = () => {
    setIsEditingText(false);
    toast.success('Caption saved!');
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setCurrentCaption(initialCaption);
    setIsEditingText(false);
    toast.info('Edit canceled.');
  };

  // Handler to toggle edit mode
  const handleEditClick = () => {
    setIsEditingText(true);
  };

  // Handler to save edited text (basic for now, will need actual saving logic)
  const handleSaveClick = () => {
    setIsEditingText(false);
    // Add logic here to actually save the edited text if needed
  };

  // Handler to cancel editing
  const handleCancelClick = () => {
    setCurrentCaption(initialCaption);
    setIsEditingText(false);
    toast.info('Edit canceled.');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => navigate(-1)} variant="outline">Back</Button>
        <h1 className="text-2xl font-bold">Preview Post</h1>
        <div></div> {/* Placeholder for alignment */}
      </div>

      {/* Sharable content area */}
      <div ref={previewRef} id="sharable-content" className="relative w-full max-w-md mx-auto bg-background rounded-lg overflow-hidden shadow-lg">
        {/* Media Preview (Image or Video) */}
        {mediaFile && mediaFile.type.startsWith('image') && (
          <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full h-auto" />
        )}
        {mediaFile && mediaFile.type.startsWith('video') && (
          <video
            ref={(videoElement) => {
              // You might want to store a reference to the video element if needed elsewhere
              // videoRef.current = videoElement;
            }}
            src={URL.createObjectURL(mediaFile)}
            controls
            className="w-full h-auto"
          />
        )}

        {/* Caption Overlay (for images or videos with overlay enabled, and not editing text) */}
        {mediaFile && (mediaFile.type.startsWith('image') || mediaFile.type.startsWith('video')) && showCaptionOverlay && !isEditingText && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/[.7] to-transparent text-white p-4 rounded-b-lg">
            <h2 className="font-bold text-2xl mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.title}</h2>
            <div className="text-lg mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.caption}</div>
            <div className="text-base text-gray-300 font-medium" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}</div>
          </div>
        )}

        {/* Text-only post display or Edit mode */}
        {!mediaFile && (
          <div className="w-full max-w-md mx-auto mb-4 bg-card text-card-foreground p-4 rounded-lg shadow-md">
            {isEditingText ? (
              // Edit mode UI for text-only
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    id="edit-title"
                    value={currentCaption.title}
                    onChange={e => setCurrentCaption({ ...currentCaption, title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-caption" className="block text-sm font-medium mb-1">Caption</label>
                  <Textarea
                    id="edit-caption"
                    value={currentCaption.caption}
                    onChange={e => setCurrentCaption({ ...currentCaption, caption: e.target.value })}
                    rows={6}
                  />
                </div>
                <div>
                  <label htmlFor="edit-cta" className="block text-sm font-medium mb-1">Call to Action</label>
                  <Input
                    id="edit-cta"
                    value={currentCaption.cta}
                    onChange={e => setCurrentCaption({ ...currentCaption, cta: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-hashtags" className="block text-sm font-medium mb-1">Hashtags (space separated)</label>
                  <Input
                    id="edit-hashtags"
                    value={currentCaption.hashtags.join(' ')}
                    onChange={e => setCurrentCaption({ ...currentCaption, hashtags: e.target.value.split(' ').filter(tag => tag.trim() !== '') })}
                    placeholder="Enter hashtags space separated"
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleCancelClick}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveClick}>Save</Button>
                </div>
              </div>
            ) : (
              // View mode UI for text-only
              <div>
                {currentCaption.title && <h2 className="text-xl font-bold mb-2">{currentCaption.title}</h2>}
                <p className="whitespace-pre-wrap text-base mb-2">
                  {currentCaption.caption}
                </p>
                {currentCaption.cta && <p className="text-sm text-muted-foreground mb-2">{currentCaption.cta}</p>}
                {currentCaption.hashtags && currentCaption.hashtags.length > 0 && (
                  <p className="text-sm text-blue-400 font-medium">
                    {currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}
                  </p>
                )}
                <div className="flex justify-end space-x-2 mt-4">
                   {/* Copy button for text-only */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const textContent = `${currentCaption.title ? currentCaption.title + '\n\n' : ''}${currentCaption.caption}${currentCaption.cta ? '\n\n' + currentCaption.cta : ''}${currentCaption.hashtags && currentCaption.hashtags.length > 0 ? '\n' + currentCaption.hashtags.map(tag => `#${tag}`).join(' ') : ''}`.trim();
                      navigator.clipboard.writeText(textContent)
                        .then(() => toast.success('Caption copied!'))
                        .catch(err => toast.error('Failed to copy caption.', err));
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEditClick}>Edit</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Always visible caption text below media if no overlay OR if media is present but overlay is NOT enabled, and not editing text */}
        {((!mediaFile) || (mediaFile && (mediaFile.type.startsWith('image') || mediaFile.type.startsWith('video')) && !showCaptionOverlay)) && !isEditingText && (
          <div className="w-full max-w-md mx-auto mb-4 bg-card text-card-foreground p-4 rounded-lg shadow-md">
            {currentCaption.title && <h2 className="text-xl font-bold mb-2">{currentCaption.title}</h2>}
            <p className="whitespace-pre-wrap text-base mb-2">
              {currentCaption.caption}
            </p>
            {currentCaption.cta && <p className="text-sm text-muted-foreground mb-2">{currentCaption.cta}</p>}
            {currentCaption.hashtags && currentCaption.hashtags.length > 0 && (
              <p className="text-sm text-blue-400 font-medium">
                {currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-background py-2 z-10">
        <Button className="flex-1" onClick={() => handleShareOrDownload('share')}>Share</Button>
        <Button className="flex-1" onClick={() => handleShareOrDownload('download')}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
        <Button className="flex-1" variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>

       {/* Caption Overlay Toggle (only for images and videos) */}
       {mediaFile && (mediaFile.type.startsWith('image') || mediaFile.type.startsWith('video')) && (
         <div className="flex items-center justify-center space-x-2 mt-4 mb-8">
           <Switch checked={showCaptionOverlay} onCheckedChange={setShowCaptionOverlay} id="caption-overlay-toggle" />
           <label htmlFor="caption-overlay-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
             Show Caption Over Media
           </label>
          </div>
        )}

    </div>
  );
};

export default PreviewRepost; 