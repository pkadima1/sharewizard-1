
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Edit } from 'lucide-react';
import { toast } from "sonner";
import { GeneratedCaption } from '@/services/openaiService';
import CaptionEditForm from './CaptionEditForm';
import { MediaType } from '@/types/mediaTypes';
import { stripMarkdownFormatting } from '@/utils/textFormatters';

interface CaptionEditorProps {
  selectedMedia: File | null;
  previewUrl: string | null;
  captions: GeneratedCaption[];
  selectedCaption: number;
  setCaptions: React.Dispatch<React.SetStateAction<GeneratedCaption[]>>;
  isTextOnly?: boolean;
  captionOverlayMode?: 'overlay' | 'below';
  onCaptionOverlayModeChange?: (mode: 'overlay' | 'below') => void;
  mediaType?: MediaType;
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
  mediaType
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
      toast.success("Légende mise à jour avec succès !");
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
        <div className="bg-gray-50 dark:bg-gray-800/90 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">Modifier la Légende</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Modifier"
                onClick={handleEditCaption}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {!isTextOnly && mediaType !== 'video' && (
            <div className="mt-4 flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Légende en bas</span>
                <Switch 
                  checked={captionOverlayMode === 'overlay'}
                  onCheckedChange={() => onCaptionOverlayModeChange(captionOverlayMode === 'overlay' ? 'below' : 'overlay')}
                  className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Légende superposée</span>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-50">Texte de la Légende</h3>
            <div className="p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="font-medium text-gray-900 dark:text-white">{stripMarkdownFormatting(captions[selectedCaption]?.title)}</h4>
              <p className="mt-2 text-sm whitespace-pre-line text-gray-800 dark:text-gray-200">{stripMarkdownFormatting(captions[selectedCaption]?.caption)}</p>
              <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">{stripMarkdownFormatting(captions[selectedCaption]?.cta)}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {captions[selectedCaption]?.hashtags.map((hashtag, idx) => (
                  <span key={idx} className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                    #{stripMarkdownFormatting(hashtag)}
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
