// NicheSelector.tsx - IMPROVED VERSION
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Predefined niches with icons - kept the same for consistency
const PREDEFINED_NICHES = [
  { icon: "👔", name: "Business" },
  { icon: "📱", name: "Technology" },
  { icon: "🎨", name: "Art & Design" },
  { icon: "🔍", name: "SEO & Marketing" },
  { icon: "🏋️", name: "Fitness" },
  { icon: "🍳", name: "Food & Cooking" },
  { icon: "✈️", name: "Travel" },
  { icon: "📚", name: "Education" },
  { icon: "🛍️", name: "Fashion" },
  { icon: "🎮", name: "Gaming" },
  { icon: "📷", name: "Photography" },
  { icon: "🎬", name: "Entertainment" }
];

interface NicheSelectorProps {
  selectedNiche: string;
  onNicheChange: (niche: string) => void;
}

const NicheSelector: React.FC<NicheSelectorProps> = ({ selectedNiche, onNicheChange }) => {
  // Initialize custom niche with selected niche if available
  const [customNiche, setCustomNiche] = useState<string>(selectedNiche || '');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Auto-focus effect for better mobile experience when this step is active
  useEffect(() => {
    // Small delay to ensure the input is rendered before focusing
    const timer = setTimeout(() => {
      const inputElement = document.getElementById('niche-input');
      if (inputElement && !customNiche) {
        inputElement.focus();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [customNiche]);

  // Handle custom niche input change
  const handleCustomNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.length > 100) {
      setError('Maximum 100 characters allowed');
      value = value.slice(0, 100);
    } else {
      setError(null);
    }
    setCustomNiche(value);
    onNicheChange(value);
  };

  // Handle predefined niche selection
  const handleNicheSelect = (niche: string) => {
    setCustomNiche(niche);
    onNicheChange(niche);
    
    // Optional: Focus the input after selection for easy editing
    const inputElement = document.getElementById('niche-input');
    if (inputElement) {
      inputElement.focus();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Input Section - Improved spacing and prominence */}
      <div className="space-y-3">
        <Label 
          htmlFor="niche-input" 
          className="block text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100"
        >
          Enter your content niche
        </Label>
        
        {/* Description text to help users understand what to do */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Describe your content area, topic, or industry to help generate relevant captions
        </p>
        
        {/* Improved input with better styling, animation and focus states */}
        <div className={`
          relative transition-all duration-200 rounded-xl
          ${isFocused ? 'shadow-lg ring-2 ring-primary/30' : 'shadow'}
        `}>
          <Input
            id="niche-input"
            placeholder="Type in anything you can think of in your language (Specify the language e.g. in Spanish)"
            className={`
              w-full px-5 py-5 rounded-xl border-8 text-base sm:text-lg
              bg-white dark:bg-gray-900 text-gray-900 dark:text-white
              transition-colors duration-200 h-auto
              ${isFocused || customNiche 
                ? 'border-primary' 
                : 'border-gray-300 dark:border-gray-700'}
              ${error ? 'border-red-500' : ''}
            `}
            value={customNiche}
            onChange={handleCustomNicheChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={100}
            autoComplete="off"
          />
        </div>
        
        {/* Character count and error message */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${
            customNiche.length >= 90 
              ? customNiche.length >= 100 
                ? 'text-red-500 font-semibold' 
                : 'text-amber-500' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {customNiche.length}/100 characters
          </span>
          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
      </div>

      {/* Predefined niches section */}
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-800"></div>
          <p className="px-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
            Or quickly select from common niches
          </p>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-800"></div>
        </div>
        
        {/* Improved grid with better responsive design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PREDEFINED_NICHES.map((niche) => (
            <Button
              key={niche.name}
              type="button"
              variant={selectedNiche === niche.name ? "default" : "outline"}
              className={`
                justify-start transition-all h-auto py-3 px-4 rounded-xl text-base font-medium
                ${selectedNiche === niche.name 
                  ? 'border-primary bg-primary/10 text-primary-700 dark:bg-primary/20 shadow-md' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'}
                ${niche.name === 'Photography' || niche.name === 'Entertainment' 
                  ? 'sm:col-span-1' 
                  : ''}
              `}
              onClick={() => handleNicheSelect(niche.name)}
            >
              <span className="mr-2 text-lg">{niche.icon}</span>
              <span className="truncate">{niche.name}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Helper tip at the bottom for better guidance */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
        <span className="font-medium text-blue-600 dark:text-blue-400">💡 Tip:</span> Being specific with your niche helps generate more relevant and engaging captions
      </div>
    </div>
  );
};

export default NicheSelector;