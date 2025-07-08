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
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

interface Step2Props {
  formData: any;
  updateFormData: (key: string, value: any) => void;
}

const Step2MediaVisuals: React.FC<Step2Props> = ({ formData, updateFormData }) => {
  const { t } = useTranslation('longform');
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

  // Update parent form when includeImages changes
  useEffect(() => {
    updateFormData('includeImages', includeImages);
  }, [includeImages]);
  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      // Restore files with placement and caption data
      if (restoredData.mediaFiles && Array.isArray(restoredData.mediaFiles)) {
        // Ensure all files have the required properties
        const updatedFiles = restoredData.mediaFiles.map((file, index) => ({
          ...file,
          mediaPlacement: file.mediaPlacement || restoredData.mediaPlacements?.[index] || 'inline',
          mediaCaption: file.mediaCaption || restoredData.mediaCaptions?.[index] || ''
        }));
        setFiles(updatedFiles);
      }
      
      setIncludeImages(restoredData.includeImages || false);
      
      toast({
        title: t('step2.success.draftRestored'),
        description: t('step2.success.draftRestoredDesc'),
      });
    }
  };

  // Handle manual save
  const handleManualSave = () => {
    saveNow();
    toast({
      title: t('step2.success.progressSaved'),
      description: t('step2.success.progressSavedDesc'),
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []) as File[];
    
    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: t('step2.errors.tooManyFiles'),
        description: t('step2.errors.maxFilesMsg', { count: MAX_FILES }),
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes and types
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    selectedFiles.forEach((file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (${t('step2.errors.fileTooLarge')})`);
      } else if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        invalidFiles.push(`${file.name} (${t('step2.errors.unsupportedType')})`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: t('step2.errors.invalidFiles'),
        description: t('step2.errors.invalidFilesDesc', { files: invalidFiles.join(', ') }),
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
        title: t('step2.errors.authRequired'),
        description: t('step2.errors.authRequiredDesc'),
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
        title: t('step2.success.uploadSuccess'),
        description: t('step2.success.uploadSuccessDesc', { count: uploadedFiles.length }),
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('step2.errors.uploadFailed'),
        description: t('step2.errors.uploadFailedDesc'),
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
          try {            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const fileData = {
              id: fileId,
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              // Adding required fields from schema
              mediaPlacement: 'inline', // Default to inline, can be changed by user
              mediaCaption: '', // Empty by default, can be filled by user
              storagePath: `wizard-media/${currentUser.uid}/${fileId}`
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

  // Update file metadata (placement or caption)
  const updateFileMetadata = (fileId, field, value) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, [field]: value } : file
    ));
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

  // Convert files to the required schema format for parent component
  useEffect(() => {
    // If we have files, prepare them in the required format
    if (files.length > 0) {
      const mediaFiles = files;
      const mediaUrls = files.map(file => file.url);
      const mediaTypes = files.map(file => file.type);
      const mediaPlacements = files.map(file => file.mediaPlacement);
      const mediaCaptions = files.map(file => file.mediaCaption || '');

      // Update parent form with all the structured data
      updateFormData('mediaFiles', mediaFiles);
      updateFormData('mediaUrls', mediaUrls);
      updateFormData('mediaTypes', mediaTypes);
      updateFormData('mediaPlacements', mediaPlacements);
      updateFormData('mediaCaptions', mediaCaptions);
    } else {
      // Reset all media-related fields when no files are present
      updateFormData('mediaFiles', []);
      updateFormData('mediaUrls', []);
      updateFormData('mediaTypes', []);
      updateFormData('mediaPlacements', []);
      updateFormData('mediaCaptions', []);
    }
  }, [files]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('step2.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('step2.subtitle')}
          </p>
        </div>

        {/* Draft Restoration */}
        {hasSavedDraft && (
          <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  {t('step2.draft.foundSaved', { time: getDraftInfo('step2-media-visuals-draft').timestamp?.toLocaleString() || t('step2.draft.unknownTime') })}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRestoreDraft}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {t('step2.draft.restore')}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearDraft}
                  className="text-amber-700 hover:bg-amber-100"
                >
                  {t('step2.draft.dismiss')}
                </Button>
              </div>
            </div>
          </Card>
        )}        {/* Progress Indicator */}
        <QualityIndicator 
          input={`${files.length} files uploaded, ${includeImages ? t('step2.quality.statusEnabled') : t('step2.quality.statusDisabled')}`}
          type="topic"
          suggestions={[
            t('step2.quality.suggestions.enableImages'),
            t('step2.quality.suggestions.uploadFiles')
          ]}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Image className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">{t('step2.settings.title')}</h3>
              </div>

              {/* Include Images Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">                <div className="space-y-1">
                  <Label htmlFor="include-images" className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {t('step2.settings.includeImagesLabel')}
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('step2.settings.includeImagesDesc')}
                  </p>
                </div>
                <Switch
                  id="include-images"
                  checked={includeImages}
                  onCheckedChange={setIncludeImages}
                />
              </div>              {/* File Upload Area */}
              <div className="space-y-4">                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{t('step2.settings.uploadTitle')}</h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                        <Image className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-3">                      <h5 className="font-medium mb-1">{t('step2.settings.placementGuideTitle')}</h5>
                      <ul className="text-sm space-y-1">
                        <li><strong className="font-semibold">{t('step2.placements.header')}:</strong> {t('step2.settings.placementGuide.header')}</li>
                        <li><strong className="font-semibold">{t('step2.placements.section_1')}/{t('step2.placements.section_2')}:</strong> {t('step2.settings.placementGuide.section')}</li>
                        <li><strong className="font-semibold">{t('step2.placements.inline')}:</strong> {t('step2.settings.placementGuide.inline')}</li>
                        <li><strong className="font-semibold">{t('step2.placements.end')}:</strong> {t('step2.settings.placementGuide.end')}</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                    <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t('step2.upload.dragDrop')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('step2.upload.supported', { size: formatFileSize(MAX_FILE_SIZE) })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {t('step2.upload.maxFiles', { count: MAX_FILES })}
                    </p>
                  </label>
                </div>                  {uploading && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{t('step2.upload.uploading')}</p>
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
            <div className="space-y-4">              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('step2.files.title')}</h3>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {t('step2.files.count', { current: files.length, max: MAX_FILES })}
                </span>
              </div>

              {files.length === 0 ? (                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileImage className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-700 dark:text-gray-300">{t('step2.files.noFiles')}</p>
                  <p className="text-sm">{t('step2.files.noFilesDesc')}</p>
                </div>
              ) : (                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="space-y-3 p-3 border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            {getFileIcon(file.type)}
                          </div>                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{file.name}</p>
                            <div className="flex items-center space-x-1">
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                              </p>
                              {file.mediaPlacement && (                                <span className={`text-sm px-1.5 py-0.5 rounded-full ${
                                  file.mediaPlacement === 'header' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  file.mediaPlacement === 'section_1' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  file.mediaPlacement === 'section_2' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                                  file.mediaPlacement === 'end' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {file.mediaPlacement}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
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
                      
                      {/* Media placement and caption controls */}                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <Label htmlFor={`placement-${file.id}`} className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                            {t('step2.files.placement')}
                          </Label><select
                            id={`placement-${file.id}`}
                            value={file.mediaPlacement}
                            onChange={(e) => updateFileMetadata(file.id, 'mediaPlacement', e.target.value)}
                            className="w-full text-sm p-1.5 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:text-gray-200"
                          >
                            <option value="header">{t('step2.placements.header')}</option>
                            <option value="section_1">{t('step2.placements.section_1')}</option>
                            <option value="section_2">{t('step2.placements.section_2')}</option>
                            <option value="inline">{t('step2.placements.inline')}</option>
                            <option value="end">{t('step2.placements.end')}</option>
                          </select>
                        </div>                        <div>
                          <Label htmlFor={`caption-${file.id}`} className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                            {t('step2.files.caption')}
                          </Label><input
                            id={`caption-${file.id}`}
                            type="text"
                            value={file.mediaCaption || ''}
                            onChange={(e) => updateFileMetadata(file.id, 'mediaCaption', e.target.value)}
                            placeholder={t('step2.files.captionPlaceholder')}
                            className="w-full text-sm p-1.5 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
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
            <span>{t('step2.actions.saveProgress')}</span>
          </Button>
        </div>        {/* Auto-save indicator */}
        {lastSavedFormatted && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('step2.actions.autoSaved', { time: lastSavedFormatted })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Step2MediaVisuals;
