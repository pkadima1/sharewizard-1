import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ServiceTypeSelectorProps {
  onServiceTypeChange: (type: 'diy' | 'dfy') => void;
  selectedServiceType: 'diy' | 'dfy';
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  onServiceTypeChange,
  selectedServiceType
}) => {
  const { t } = useTranslation('pricing');
  
  return (
    <div className="service-type-selector mb-8">
      <div className="inline-flex items-center bg-adaptive-tertiary backdrop-blur-sm rounded-full p-1 border border-adaptive">
        <button 
          className={cn(
            "py-2 px-6 rounded-full transition-colors duration-200 font-medium", 
            selectedServiceType === 'diy' 
              ? 'bg-violet-600 text-white shadow-sm' 
              : 'text-adaptive-secondary hover:text-adaptive-primary'
          )}
          onClick={() => onServiceTypeChange('diy')}
        >
          {t('serviceType.diy.title', 'DIY Service')}
          <span className="block text-xs opacity-80 mt-1 font-normal">
            {t('serviceType.diy.description', 'Do It Yourself - Self-service platform')}
          </span>
        </button>
        <button 
          className={cn(
            "py-2 px-6 rounded-full transition-colors duration-200 font-medium", 
            selectedServiceType === 'dfy' 
              ? 'bg-violet-600 text-white shadow-sm' 
              : 'text-adaptive-secondary hover:text-adaptive-primary'
          )}
          onClick={() => onServiceTypeChange('dfy')}
        >
          {t('serviceType.dfy.title', 'DFY Service')}
          <span className="block text-xs opacity-80 mt-1 font-normal">
            {t('serviceType.dfy.description', 'Done For You - Managed service')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ServiceTypeSelector;
