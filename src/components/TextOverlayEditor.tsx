import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { X, Type, SmilePlus, Move } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { cn } from '@/lib/utils';

interface TextOverlayEditorProps {
  onTextChange: (text: string) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onRotationChange: (rotation: number) => void;
  onClose: () => void;
  initialText?: string;
  initialColor?: string;
  initialSize?: number;
  initialRotation?: number;
}

export const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  onTextChange,
  onColorChange,
  onSizeChange,
  onRotationChange,
  onClose,
  initialText = '',
  initialColor = '#ffffff',
  initialSize = 24,
  initialRotation = 0
}) => {
  const [textOverlay, setTextOverlay] = useState(initialText);
  const [textColor, setTextColor] = useState(initialColor);
  const [textSize, setTextSize] = useState(initialSize);
  const [textRotation, setTextRotation] = useState(initialRotation);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: { native: string }) => {
    const newText = textOverlay + emoji.native;
    setTextOverlay(newText);
    onTextChange(newText);
    setShowEmojiPicker(false);
  };

  // Update parent on changes
  useEffect(() => {
    onTextChange(textOverlay);
  }, [textOverlay, onTextChange]);

  useEffect(() => {
    onColorChange(textColor);
  }, [textColor, onColorChange]);

  useEffect(() => {
    onSizeChange(textSize);
  }, [textSize, onSizeChange]);

  useEffect(() => {
    onRotationChange(textRotation);
  }, [textRotation, onRotationChange]);

  return (
    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium flex items-center">
          <Type className="h-4 w-4 mr-1.5 text-primary" />
          Superposition de Texte Personnalisé
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex relative">
          <textarea
            value={textOverlay}
            onChange={(e) => setTextOverlay(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 bg-white text-black text-base sm:text-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder-gray-400 shadow-sm"
            placeholder="Entrez votre texte personnalisé..."
            rows={2}
            style={{ minHeight: '48px', maxHeight: '120px', resize: 'vertical' }}
          />
          <button
            className="absolute right-2 bottom-2 text-gray-500 hover:text-primary"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <SmilePlus className="h-4 w-4" />
          </button>
        </div>
        
        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="relative z-20">
            <div className="absolute right-0 top-0 w-[320px] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
              <div className="absolute top-2 right-2 z-10">
                <button 
                  className="bg-gray-300/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 rounded-full p-1"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                set="native"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Couleur du Texte
          </label>
          <div className="flex gap-2 mt-1 items-center">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 p-0 border rounded cursor-pointer"
            />
            <button
              type="button"
              className="ml-2 px-2 py-1 rounded border text-xs bg-black text-white border-gray-300 hover:bg-gray-800"
              onClick={() => setTextColor('#000000')}
              title="Définir la couleur du texte en noir"
            >
              Noir
            </button>
          </div>
        </div>
        
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Taille du Texte: {textSize}px
          </label>
          <Slider
            value={[textSize]}
            min={12}
            max={72}
            step={1}
            onValueChange={(value) => setTextSize(value[0])}
            className="py-1.5"
          />
        </div>
      </div>
      
      {/* Text rotation slider */}
      <div className="mt-2">
        <label className="text-xs text-gray-600 dark:text-gray-400">
          Rotation du Texte: {textRotation}&deg;
        </label>
        <Slider
          value={[textRotation]}
          min={-180}
          max={180}
          step={1}
          onValueChange={(value) => setTextRotation(value[0])}
          className="py-1.5"
        />
      </div>
      
      {/* Draggable indicator */}
      <div className="flex items-center text-xs text-primary-500 mt-2 bg-primary-50 dark:bg-primary-900/20 p-2 rounded-md">
        <Move className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
        <span>Cliquez et faites glisser le texte sur l'image pour le positionner</span>
      </div>
    </div>
  );
};
