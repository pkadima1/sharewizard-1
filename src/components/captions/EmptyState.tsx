import React from 'react';
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  onGenerateClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onGenerateClick }) => {
  const { t } = useTranslation(['common', 'wizard']);
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">      
      <h3 className="text-xl font-semibold text-adaptive-primary mb-2">{t('wizard:captions.noGenerated', 'No Captions Generated')}</h3>
      <p className="text-adaptive-secondary mb-6">{t('wizard:captions.clickToGenerate', 'Click the button below to generate captions for your content.')}</p>
      <Button onClick={onGenerateClick}>{t('wizard:generate', 'Generate Captions')}</Button>
    </div>
  );
};

export default EmptyState;
