import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Predefined niches with icons
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
  const [customNiche, setCustomNiche] = useState<string>(selectedNiche || '');

  // Handle custom niche input change
  const handleCustomNicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomNiche(value);
    onNicheChange(value);
  };

  // Handle predefined niche selection
  const handleNicheSelect = (niche: string) => {
    setCustomNiche(niche);
    onNicheChange(niche);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="niche-input" className="text-sm font-medium text-gray-900 dark:text-gray-300">
          Enter your content niche
        </Label>
        <Input
          id="niche-input"
          placeholder="Enter your niche..."
          className="w-full"
          value={customNiche}
          onChange={handleCustomNicheChange}
        />
      </div>      <div className="space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Or quickly select from common niches
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {PREDEFINED_NICHES.map((niche) => (
            <Button
              key={niche.name}
              type="button"
              variant={selectedNiche === niche.name ? "default" : "outline"}
              className={`justify-start transition-all h-auto py-2 ${
                selectedNiche === niche.name 
                  ? 'border-primary/50 bg-primary/10 text-primary dark:bg-primary/20' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleNicheSelect(niche.name)}
            >
              <span className="mr-2 text-lg">{niche.icon}</span>
              <span>{niche.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NicheSelector;
