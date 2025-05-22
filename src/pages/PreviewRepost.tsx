import React, { useRef, useState, useEffect } from 'react';
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
import { sharePreview, downloadPreview, createCaptionedVideo } from '../utils/sharingUtils';
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

  const [processedVideoFile, setProcessedVideoFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  // Auto-process video with caption when video is added or caption changes
  useEffect(() => {
    if (mediaFile && mediaFile.type.startsWith('video')) {
      setProcessing(true);
      setProcessedVideoFile(null);
      setTimeout(async () => {
        const video = document.querySelector('#preview-video');
        if (video) {
          try {
            const captionedBlob = await createCaptionedVideo(video as HTMLVideoElement, currentCaption, 'modern');
            const file = new File([captionedBlob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
            setProcessedVideoFile(file);
          } catch (err) {
            toast.error('Failed to process video with caption.');
          } finally {
            setProcessing(false);
          }
        } else {
          setProcessing(false);
        }
      }, 500); // Give time for video to render
    }
  }, [mediaFile, currentCaption]);

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

  const handleShareOrDownload = async (action: 'share' | 'download', userEvent?: React.MouseEvent) => {
    const targetUserId = currentUser?.uid || gen.userId;
    if (!targetUserId) {
      toast.error("User ID is not available for operation.");
      console.error("User ID is not available for operation.");
      return;
    }

    try {
      const genRef = doc(db, 'users', targetUserId, 'generations', gen.id);
      const isVideo = mediaFile && mediaFile.type.startsWith('video');
      if (action === 'share') {
        const mediaType: MediaType = isVideo ? 'video' : (mediaFile ? 'image' : 'text-only');
        if (isVideo) {
          if (processing) {
            toast.info('Video is still processing. Please wait.');
            return;
          }
          if (!processedVideoFile) {
            toast.error('Processed video not available.');
            return;
          }
          // Use Web Share API directly with processed video file
          try {
            await navigator.share({
              files: [processedVideoFile],
              title: currentCaption.title,
              text: currentCaption.caption,
            });
            const updateData: any = {
              share_count: (gen.share_count || 0) + 1,
              posted: true,
            };
            await updateDoc(genRef, updateData);
            toast.success('Video shared successfully!');
          } catch (error) {
            toast.error('Sharing failed.');
          }
          return;
        }
        const result = await sharePreview(
          previewRef,
          currentCaption,
          mediaType,
          userEvent
        );
        if (result.status === 'shared') {
          const updateData: any = {
            share_count: (gen.share_count || 0) + 1,
            posted: true, // Mark as posted if shared
          };
          await updateDoc(genRef, updateData);
        } else if (result.status === 'cancelled') {
          toast.info('Sharing cancelled.');
        } else if (result.status === 'fallback') {
          const updateData: any = {
            share_count: (gen.share_count || 0) + 1,
            posted: true, // Mark as posted if shared
          };
          await updateDoc(genRef, updateData);
        }
      } else if (action === 'download') {
        const mediaType: MediaType = isVideo ? 'video' : (mediaFile ? 'image' : 'text-only');
        if (isVideo) {
          if (processing) {
            toast.info('Video is still processing. Please wait.');
            return;
          }
          if (!processedVideoFile) {
            toast.error('Processed video not available.');
            return;
          }
          // Download the processed video file
          const url = URL.createObjectURL(processedVideoFile);
          const a = document.createElement('a');
          a.href = url;
          a.download = processedVideoFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Downloaded successfully!');
          const updateData: any = {
            download_count: (gen.download_count || 0) + 1,
            posted: true,
          };
          await updateDoc(genRef, updateData);
          return;
        }
        await downloadPreview(
          previewRef,
          mediaType,
          currentCaption,
          mediaFile?.name // Pass original filename hint
        );
        const updateData: any = {
          download_count: (gen.download_count || 0) + 1,
          posted: true, // Mark as posted if downloaded
        };
        await updateDoc(genRef, updateData);
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
    <div className="container mx-auto p-4 mt-20">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => navigate(-1)} variant="outline">Back</Button>
        <h1 className="text-2xl font-bold">Preview Post</h1>
        <div></div> {/* Placeholder for alignment */}
      </div>

      {/* Sharable content area */}
      <div ref={previewRef} id="sharable-content" className="relative w-full max-w-md mx-auto bg-background rounded-4xl overflow-hidden shadow-lg">
        {/* Media Preview (Image or Video) */}
        {mediaFile && mediaFile.type.startsWith('image') && (
          <div className="w-full max-w-md mx-auto">
            <div className="relative w-full">
              <img
                src={URL.createObjectURL(mediaFile)}
                alt="Preview"
                className="w-full h-auto"
                id="preview-image"
              />
              {showCaptionOverlay && !isEditingText ? (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/[.7] to-transparent text-white p-4 rounded-b-lg"
                  style={{ width: '100%' }}
                >
                  <h2 className="font-bold text-2xl mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.title}</h2>
                  <div className="text-lg mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.caption}</div>
                  <div className="text-base text-gray-300 font-medium" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}</div>
                </div>
              ) : null}
              {!showCaptionOverlay && !isEditingText ? (
                <div className="w-full bg-card text-card-foreground p-4 rounded-lg shadow-md mt-2">
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
              ) : null}
            </div>
          </div>
        )}
        {mediaFile && mediaFile.type.startsWith('video') && (
          <div className="relative w-full">
            <video
              id="preview-video"
              src={URL.createObjectURL(mediaFile)}
              controls
              className="w-full h-auto"
            />
            {/* Always show caption overlay for video */}
            {!isEditingText && (
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/[.7] to-transparent text-white p-4 rounded-b-lg">
                <h2 className="font-bold text-2xl mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.title}</h2>
                <div className="text-lg mb-2" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.caption}</div>
                <div className="text-base text-gray-300 font-medium" style={{ whiteSpace: 'pre-wrap' }}>{currentCaption.hashtags.map(tag => `#${tag}`).join(' ')}</div>
              </div>
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-10">
                <span className="text-white text-lg font-semibold">Processing video...</span>
              </div>
            )}
          </div>
        )}

        {/* Text-only post display or Edit mode */}
        {!mediaFile && (
          <div className={`mx-auto my-8 max-w-lg p-6 rounded-2xl shadow-lg bg-card text-card-foreground preview-caption-card ${isEditingText ? '' : ''}`}>
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
                {/* Action buttons only in preview, not in processed card */}
                {!processing && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textParts = [
                          currentCaption.title,
                          currentCaption.caption,
                          currentCaption.cta,
                          currentCaption.hashtags && currentCaption.hashtags.length > 0
                            ? currentCaption.hashtags.map(tag => `#${tag}`).join(' ')
                            : ''
                        ].filter(Boolean);
                        const textContent = textParts.join('\n\n').trim();
                        navigator.clipboard.writeText(textContent)
                          .then(() => toast.success('Caption copied!'))
                          .catch(err => toast.error('Failed to copy caption.', err));
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleEditClick}>Edit</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-background py-2 z-10">
        <Button className="flex-1" disabled={processing || (mediaFile && mediaFile.type.startsWith('video') && !processedVideoFile)} onClick={(e) => handleShareOrDownload('share', e)}>Share</Button>
        <Button className="flex-1" disabled={processing || (mediaFile && mediaFile.type.startsWith('video') && !processedVideoFile)} onClick={() => handleShareOrDownload('download')}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
        <Button className="flex-1" variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>

       {/* Caption Overlay Toggle (only for images) */}
       {mediaFile && mediaFile.type.startsWith('image') && (
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