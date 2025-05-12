
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit, Share, Download } from 'lucide-react';
import { toast } from "sonner";
import { GeneratedCaption } from '@/services/openaiService';
import CaptionEditForm from './CaptionEditForm';

interface CaptionEditorProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  captions: GeneratedCaption[];
  selectedCaption: number;
  setCaptions: React.Dispatch<React.SetStateAction<GeneratedCaption[]>>;
  isTextOnly?: boolean;
  captionOverlayMode?: 'overlay' | 'below';
  onCaptionOverlayModeChange?: (mode: 'overlay' | 'below') => void;
  onShareClick: () => void;
  onDownloadClick: () => void;
  isSharing: boolean;
  isDownloading: boolean;
}

const CaptionEditor: React.FC<CaptionEditorProps> = ({
  selectedMedia,
  previewUrl,
  captions,
  selectedCaption,
  setCaptions,
  isTextOnly = false,
  captionOverlayMode = 'below',
  onCaptionOverlayModeChange,
  onShareClick,
  onDownloadClick,
  isSharing,
  isDownloading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCaption, setEditingCaption] = useState<GeneratedCaption | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleEditCaption = () => {
    if (captions[selectedCaption]) {
      setEditingCaption({ ...captions[selectedCaption] });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingCaption) {
      const updatedCaptions = [...captions];
      updatedCaptions[selectedCaption] = editingCaption;
      setCaptions(updatedCaptions);
      setIsEditing(false);
      toast.success("Caption updated successfully!");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCaption(null);
  };
  return (
    <div className="space-y-4">
      {isEditing ? (
        <CaptionEditForm 
          editingCaption={editingCaption!}
          setEditingCaption={setEditingCaption}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium dark:text-white">Edit Caption</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit"
                onClick={handleEditCaption}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Share"
                onClick={onShareClick}
                disabled={isSharing}
              >
                {isSharing ? (
                  <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <Share className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Download"
                onClick={onDownloadClick}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <div className="h-4 w-4 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {!isTextOnly && (
            <div className="mt-4 flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Caption below</span>
                <Switch 
                  checked={captionOverlayMode === 'overlay'} 
                  onCheckedChange={() => onCaptionOverlayModeChange(captionOverlayMode === 'overlay' ? 'below' : 'overlay')} 
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">Caption overlay</span>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Caption Text</h3>
            <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
              <h4 className="font-medium">{captions[selectedCaption]?.title}</h4>
              <p className="mt-2 text-sm whitespace-pre-line">{captions[selectedCaption]?.caption}</p>
              <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">{captions[selectedCaption]?.cta}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {captions[selectedCaption]?.hashtags.map((hashtag, idx) => (
                  <span key={idx} className="text-blue-500 text-xs">
                    #{hashtag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptionEditor;
