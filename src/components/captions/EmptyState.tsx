
import React from 'react';
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onGenerateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onGenerateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">      <h3 className="text-xl font-semibold text-adaptive-primary mb-2">Aucune Légende Générée</h3>
      <p className="text-adaptive-secondary mb-6">Cliquez sur le bouton ci-dessous pour générer des légendes pour votre contenu.</p>
      <Button onClick={onGenerateClick}>Générer des Légendes</Button>
    </div>
  );
};

export default EmptyState;
