
import React from 'react';
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onGenerateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onGenerateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">      <h3 className="text-xl font-semibold text-adaptive-primary mb-2">No Captions Generated</h3>
      <p className="text-adaptive-secondary mb-6">Click the button below to generate captions for your content.</p>
      <Button onClick={onGenerateClick}>Generate Captions</Button>
    </div>
  );
};

export default EmptyState;
