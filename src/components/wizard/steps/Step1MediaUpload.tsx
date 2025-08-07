import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, UploadCloud, Image, RotateCcw, Save } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave, getDraftInfo } from '@/hooks/useAutoSave';
import TopicSuggestionEngine from '@/components/wizard/smart/TopicSuggestionEngine';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const Step1MediaUpload = ({ formData, updateFormData }) => {
  const { t } = useTranslation('longform');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Auto-save functionality for this step
  const { hasSavedDraft, lastSaved, lastSavedFormatted, restoreDraft, clearDraft, saveNow } = useAutoSave(formData, {
    key: 'step1-media-topic-draft',
    debounceMs: 1500,
    autoSaveIntervalMs: 20000,
    showToast: false // We'll handle toast notifications manually
  });

  // Initialize component with formData if it exists
  useEffect(() => {
    if (formData.mediaFiles && Array.isArray(formData.mediaFiles)) {
      // Ensure files have the correct structure
      const normalizedFiles = formData.mediaFiles.map(file => ({
        ...file,
        id: file.id || file.name,
        mediaPlacement: file.mediaPlacement || file.metadata?.mediaPlacement || 'inline',
        mediaCaption: file.mediaCaption || file.metadata?.mediaCaption || '',
        uploadedAt: file.uploadedAt || new Date().toISOString()
      }));
      setFiles(normalizedFiles);
    }
  }, [formData.mediaFiles]);

  // Update parent form when files change
  useEffect(() => {
    updateFormData('mediaFiles', files);
  }, [files]);

  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      updateFormData('topic', restoredData.topic || '');
      updateFormData('wordCount', restoredData.wordCount || 800);
      if (restoredData.mediaFiles) {
        setFiles(restoredData.mediaFiles);
      }
      toast({
        title: t('step2.actions.draftRestored'),
        description: t('step2.success.draftRestoredDesc'),
      });
    }
  };

  // Manual save function
  const handleManualSave = () => {
    saveNow();
    toast({
      title: t('step2.actions.draftSavedAuto'),
      description: t('step2.actions.progressSavedDesc'),
    });
  };

  // Character count helper
  const getCharacterCount = () => {
    return formData.topic ? formData.topic.length : 0;
  };

  // Character count status
  const getCharacterStatus = () => {
    const count = getCharacterCount();
    if (count < 10) return { status: 'too-short', color: 'text-red-500' };
    if (count >= 10 && count <= 200) return { status: 'optimal', color: 'text-green-600' };
    return { status: 'too-long', color: 'text-yellow-600' };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: t('step2.errors.tooManyFiles'),
        description: t('step2.errors.maxFilesMsg', { count: MAX_FILES }),
        variant: "destructive"
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = selectedFiles.filter((file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('step2.errors.invalidFileType'),
          description: t('step2.errors.invalidFileTypeDesc'),
          variant: "destructive"
        });
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t('step2.errors.fileTooLargeTitle'),
          description: t('step2.errors.fileTooLargeDesc', { maxSize: 5 }),
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Upload files to Firebase
    uploadFiles(validFiles);
  };

  const uploadFiles = async (filesToUpload) => {
    if (!currentUser) {
      toast({
        title: t('step2.errors.authRequired'),
        description: t('step2.errors.authRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newProgress = { ...uploadProgress };
    
    const uploadPromises = filesToUpload.map(file => {
      return new Promise((resolve, reject) => {
        // Create a unique filename
        const timestamp = new Date().getTime();
        const fileName = `${currentUser.uid}_${timestamp}_${file.name}`;
        const storageRef = ref(storage, `longform-images/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Initialize progress for this file
        newProgress[fileName] = 0;
        setUploadProgress(newProgress);

        // Monitor upload progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            const updatedProgress = { ...newProgress };
            updatedProgress[fileName] = progress;
            setUploadProgress(updatedProgress);
          },
          (error) => {
            console.error("Upload error:", error);
            toast({
              title: t('step2.errors.uploadFailed'),
              description: t('step2.errors.uploadFailedDesc'),
              variant: "destructive"
            });
            reject(error);
          },
          async () => {
            try {
              // Upload completed successfully
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Create metadata object with direct properties for compatibility
              const newFile = {
                id: fileName,
                name: file.name,
                size: file.size,
                type: file.type,
                url: downloadURL,
                storagePath: `longform-images/${fileName}`,
                uploadedAt: new Date().toISOString(),
                // Direct properties for compatibility with Step2MediaVisuals
                mediaPlacement: 'inline', // Default value, can be changed by user
                mediaCaption: '',          // Empty by default, can be filled by user
                // Keep metadata for backward compatibility
                metadata: {
                  mediaPlacement: 'inline',
                  mediaCaption: '',
                  format: file.type
                }
              };

              resolve(newFile);
            } catch (error) {
              console.error("Error getting download URL:", error);
              toast({
                title: t('step2.errors.processingError'),
                description: t('step2.errors.processingErrorDesc'),
                variant: "destructive"
              });
              reject(error);
            }
          }
        );
      });
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
      toast({
        title: t('step2.success.uploadComplete'),
        description: t('step2.success.uploadSuccessDesc', { count: uploadedFiles.length }),
      });
    } catch (error) {
      console.error("Error during upload:", error);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleMetadataChange = (index, field, value) => {
    const newFiles = [...files];
    // Update both direct property and metadata for compatibility
    newFiles[index][field] = value;
    if (newFiles[index].metadata) {
      newFiles[index].metadata[field] = value;
    }
    setFiles(newFiles);
  };

  const handleWordCountChange = (value) => {
    updateFormData('wordCount', value[0]);
  };
  return (
    <div className="space-y-6">
      {/* Draft restoration banner */}
      {hasSavedDraft && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Draft Available
                </p>                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Last saved: {lastSavedFormatted || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreDraft}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Restore Draft
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDraft}
                className="text-blue-600"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Topic Input Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">What would you like to write about?</h2>
            <p className="text-muted-foreground mt-1">
              Enter a clear topic or title for your long-form content. Be specific and engaging.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            className="flex items-center gap-1"
          >
            <Save className="h-3 w-3" />
            Save Draft
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Topic Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">
                Content Topic *
              </Label>
              <div className="relative">
                <Textarea
                  id="topic"
                  className="w-full min-h-[120px] pr-20"
                  placeholder="Examples:
• 10 Proven Marketing Strategies That Drive Real Results
• The Ultimate Guide to Remote Work Productivity 
• How AI is Transforming Small Business Operations
• 5 Critical Mistakes Entrepreneurs Make (And How to Avoid Them)"
                  value={formData.topic || ''}
                  onChange={(e) => updateFormData('topic', e.target.value)}
                />
                <div className="absolute top-2 right-2">
                  <QualityIndicator 
                    input={formData.topic || ''}
                    type="topic"
                    suggestions={[]}
                  />
                </div>
              </div>
              
              {/* Character Counter */}
              <div className="flex items-center justify-between text-xs">
                <div className={getCharacterStatus().color}>
                  {getCharacterCount()} characters
                  {getCharacterCount() < 10 && ' (minimum 10)'}
                  {getCharacterCount() > 200 && ' (recommended under 200)'}
                </div>
                <div className="text-muted-foreground">
                  Optimal: 10-200 characters
                </div>
              </div>
              
              {/* Character count indicator bar */}
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    getCharacterStatus().status === 'optimal' ? 'bg-green-500' :
                    getCharacterStatus().status === 'too-short' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ 
                    width: `${Math.min((getCharacterCount() / 200) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Topic Suggestions */}
          <div>
            <TopicSuggestionEngine
              industry={formData.industry || ''}
              audience={formData.audience || ''}
              currentTopic={formData.topic || ''}
              onTopicSelect={(topic) => updateFormData('topic', topic)}
            />
          </div>
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Media Upload (Optional)</h3>
          <p className="text-muted-foreground">
            Add up to 5 images to include in your content. These will help illustrate your points and increase engagement.
          </p>
        </div>

        {/* Word count slider */}
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Target Word Count: {formData.wordCount || 800}
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm">500</span>
              <Slider
                defaultValue={[formData.wordCount || 800]}
                min={500}
                max={2500}
                step={100}
                onValueChange={handleWordCountChange}
                className="flex-1"
              />
              <span className="text-sm">2500</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formData.wordCount < 800 ? 'Short form content' : 
               formData.wordCount < 1500 ? 'Medium form content' : 'Long form content'}
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50">
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Drag and drop images or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Maximum 5 images, 5MB each
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading || files.length >= MAX_FILES}
          />
          <Button
            onClick={() => document.getElementById('file-upload').click()}
            variant="outline"
            disabled={uploading || files.length >= MAX_FILES}
          >
            <Image className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploading...</h3>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{fileName.split('_').slice(2).join('_')}</span>
                <span>{progress as number}%</span>
              </div>
              <Progress value={progress as number} className="h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Uploaded Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="relative">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-40 object-cover rounded-md mb-2"
                  />
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  
                  {/* Media placement selection */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Placement</label>
                    <select
                      value={file.metadata.mediaPlacement}
                      onChange={(e) => handleMetadataChange(index, 'mediaPlacement', e.target.value)}
                      className="w-full text-xs p-1 border rounded"
                    >
                      <option value="inline">In-line with text</option>
                      <option value="header">Header image</option>
                      <option value="gallery">Image gallery</option>
                      <option value="sidebar">Sidebar</option>
                    </select>
                  </div>
                  
                  {/* Media caption */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Caption</label>
                    <input
                      type="text"
                      value={file.metadata.mediaCaption}
                      onChange={(e) => handleMetadataChange(index, 'mediaCaption', e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full text-xs p-1 border rounded"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1MediaUpload;
