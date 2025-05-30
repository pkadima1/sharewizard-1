import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Image, RotateCcw, Save, FileImage, Video, File } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave, getDraftInfo } from '@/hooks/useAutoSave';
import QualityIndicator from '@/components/wizard/smart/QualityIndicator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const Step2MediaVisuals = ({ formData, updateFormData }) => {
  const [files, setFiles] = useState(formData.mediaFiles || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [includeImages, setIncludeImages] = useState(formData.includeImages || false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Auto-save functionality for this step
  const { hasSavedDraft, lastSaved, lastSavedFormatted, restoreDraft, clearDraft, saveNow } = useAutoSave(formData, {
    key: 'step2-media-visuals-draft',
    debounceMs: 1500,
    autoSaveIntervalMs: 20000,
    showToast: false
  });

  // Update parent form when files change
  useEffect(() => {
    updateFormData('mediaFiles', files);
  }, [files]);

  // Update parent form when includeImages changes
  useEffect(() => {
    updateFormData('includeImages', includeImages);
  }, [includeImages]);

  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setFiles(restoredData.mediaFiles || []);
      setIncludeImages(restoredData.includeImages || false);
      toast({
        title: "Draft Restored",
        description: "Your saved media settings have been restored.",
      });
    }
  };

  // Handle manual save
  const handleManualSave = () => {
    saveNow();
    toast({
      title: "Progress Saved",
      description: "Your media settings have been saved.",
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []) as File[];
    
    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${MAX_FILES} files.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes and types
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    selectedFiles.forEach((file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (too large)`);
      } else if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        invalidFiles.push(`${file.name} (invalid type)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: `The following files were skipped: ${invalidFiles.join(', ')}`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  // Upload files to Firebase
  const uploadFiles = async (filesToUpload) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadPromises = filesToUpload.map(file => uploadSingleFile(file));
    
    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...uploadedFiles]);
      toast({
        title: "Upload successful",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Some files could not be uploaded. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Upload single file
  const uploadSingleFile = (file) => {
    return new Promise((resolve, reject) => {
      const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const storageRef = ref(storage, `wizard-media/${currentUser.uid}/${fileId}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: progress
          }));
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const fileData = {
              id: fileId,
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString()
            };
            resolve(fileData);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Calculate completion score
  const completionScore = () => {
    let score = 50; // Base score for visiting this step
    if (includeImages) score += 25;
    if (files.length > 0) score += 25;
    return Math.min(score, 100);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Media & Visuals
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Upload images, videos, or other media to enhance your content
          </p>
        </div>

        {/* Draft Restoration */}
        {hasSavedDraft && (
          <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  Found saved draft from {getDraftInfo('step2-media-visuals-draft').timestamp?.toLocaleString() || 'unknown time'}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRestoreDraft}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Restore
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearDraft}
                  className="text-amber-700 hover:bg-amber-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </Card>
        )}        {/* Progress Indicator */}
        <QualityIndicator 
          input={`${files.length} files uploaded, ${includeImages ? 'images enabled' : 'images disabled'}`}
          type="topic"
          suggestions={[
            'Enable image suggestions for enhanced content',
            'Upload media files to include in your content'
          ]}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Image className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Visual Content Settings</h3>
              </div>

              {/* Include Images Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="include-images" className="text-sm font-medium">
                    Include Image Suggestions
                  </Label>
                  <p className="text-sm text-gray-500">
                    Generate suggestions for relevant images to include in your content
                  </p>
                </div>
                <Switch
                  id="include-images"
                  checked={includeImages}
                  onCheckedChange={setIncludeImages}
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-4">
                <h4 className="font-medium">Upload Media Files (Optional)</h4>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports images and videos up to {formatFileSize(MAX_FILE_SIZE)} each
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Maximum {MAX_FILES} files
                    </p>
                  </label>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Uploading files...</p>
                    {Object.entries(uploadProgress).map(([fileId, progress]) => (
                      <Progress key={fileId} value={progress as number} className="w-full" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Right Column - Uploaded Files */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Uploaded Files</h3>
                <span className="text-sm text-gray-500">
                  {files.length} / {MAX_FILES} files
                </span>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileImage className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No files uploaded yet</p>
                  <p className="text-sm">Upload some media to enhance your content</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.type.startsWith('image/') && (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(file.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Manual Save Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleManualSave}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Progress</span>
          </Button>
        </div>        {/* Auto-save indicator */}
        {lastSavedFormatted && (
          <div className="text-center text-sm text-gray-500">
            Auto-saved {lastSavedFormatted}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Step2MediaVisuals;
