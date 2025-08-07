import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  GraduationCap, 
  Palette, 
  Settings,
  Download,
  Eye
} from 'lucide-react';
import { PDFTemplate, PDFGenerationOptions, getTemplateKeyFromDisplayName } from '@/utils/pdfGenerator';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface PDFTemplateSelectorProps {
  onGenerate: (options: PDFGenerationOptions) => void;
  onPreview?: (template: string) => void;
  availableTemplates: PDFTemplate[];
  defaultTemplate?: string;
}

const PDFTemplateSelector: React.FC<PDFTemplateSelectorProps> = ({
  onGenerate,
  onPreview,
  availableTemplates,
  defaultTemplate = 'business'
}) => {
  const { t, i18n } = useAppTranslation('longform');
  

  
  // Enhanced fallback translation function for critical UI elements
  const getTranslation = (key: string, fallback: string) => {
    const translation = t(key);
    // If translation returns the key itself, it means the translation wasn't found
    if (translation === key) {
      console.warn(`⚠️ Translation not found for key: ${key}, using fallback: ${fallback}`);
      return fallback;
    }
    return translation;
  };



  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [options, setOptions] = useState<PDFGenerationOptions>({
    template: defaultTemplate,
    includeHeader: true,
    includeFooter: true,
    includeMetadata: true,
    pageNumbers: true,
    includeTableOfContents: false,
    // Revolutionary options
    enhancedReadability: true,
    smartPageBreaks: true,
    optimizedTypography: true,
    contentFlowOptimization: true
  });

  // Helper function to get template name from template key
  const getTemplateName = (templateKey: string): string => {
    const template = availableTemplates.find(t => getTemplateKeyFromDisplayName(t.name) === templateKey);
    const translatedName = t(`pdf.templates.${templateKey}.name`);
    // Check if translation was found (not just the key returned)
    if (translatedName !== `pdf.templates.${templateKey}.name`) {
      return translatedName;
    }
    // Fallback to original template name
    return template?.name || 'Business Professional';
  };

  // Helper function to get template description from template key
  const getTemplateDescription = (templateKey: string): string => {
    const template = availableTemplates.find(t => getTemplateKeyFromDisplayName(t.name) === templateKey);
    const translatedDesc = t(`pdf.templates.${templateKey}.description`);
    // Check if translation was found (not just the key returned)
    if (translatedDesc !== `pdf.templates.${templateKey}.description`) {
      return translatedDesc;
    }
    // Fallback to original template description
    return template?.description || '';
  };

  const handleTemplateChange = (templateName: string) => {
    const templateKey = getTemplateKeyFromDisplayName(templateName);
    setSelectedTemplate(templateKey);
    setOptions(prev => ({ ...prev, template: templateKey }));
  };

  const handleOptionChange = (key: keyof PDFGenerationOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const getTemplateIcon = (templateName: string) => {
    const templateKey = getTemplateKeyFromDisplayName(templateName);
    switch (templateKey) {
      case 'business':
        return <FileText className="h-5 w-5" />;
      case 'academic':
        return <GraduationCap className="h-5 w-5" />;
      case 'creative':
        return <Palette className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTemplateColor = (templateName: string) => {
    const templateKey = getTemplateKeyFromDisplayName(templateName);
    switch (templateKey) {
      case 'business':
        return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300';
      case 'academic':
        return 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300';
      case 'creative':
        return 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {getTranslation('pdf.templateSelector.title', 'Choose PDF Template')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableTemplates.map((template) => {
            const templateKey = getTemplateKeyFromDisplayName(template.name);
            return (
              <Card
                key={template.name}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedTemplate === templateKey
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
                onClick={() => handleTemplateChange(template.name)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {getTemplateIcon(template.name)}
                    <div>
                      <h4 className="font-semibold text-sm">{getTemplateName(templateKey)}</h4>
                      <Badge variant="outline" className={`text-xs ${getTemplateColor(template.name)}`}>
                        {template.fontFamily.split(',')[0]}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {getTemplateDescription(templateKey)}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    <div>{getTranslation('pdf.technicalSpecs.font', 'Font')}: {template.fontFamily.split(',')[0]}</div>
                <div>{getTranslation('pdf.technicalSpecs.size', 'Size')}: {template.fontSize}{getTranslation('pdf.technicalSpecs.points', 'pt')}</div>
                <div>{getTranslation('pdf.technicalSpecs.lineHeight', 'Line Height')}: {template.lineHeight}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* PDF Options */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {getTranslation('pdf.templateSelector.pdfOptions', 'PDF Options')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">{getTranslation('pdf.templateSelector.documentStructure', 'Document Structure')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeader"
                  checked={options.includeHeader}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeHeader', checked as boolean)
                  }
                />
                <Label htmlFor="includeHeader" className="text-sm">
                  {getTranslation('pdf.templateSelector.includeHeader', 'Include Document Header')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFooter"
                  checked={options.includeFooter}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeFooter', checked as boolean)
                  }
                />
                <Label htmlFor="includeFooter" className="text-sm">
                  {getTranslation('pdf.templateSelector.includeFooter', 'Include Footer with Attribution')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pageNumbers"
                  checked={options.pageNumbers}
                  onCheckedChange={(checked) => 
                    handleOptionChange('pageNumbers', checked as boolean)
                  }
                />
                <Label htmlFor="pageNumbers" className="text-sm">
                  {getTranslation('pdf.templateSelector.includePageNumbers', 'Include Page Numbers')}
                </Label>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">{getTranslation('pdf.templateSelector.contentOptions', 'Content Options')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeMetadata', checked as boolean)
                  }
                />
                <Label htmlFor="includeMetadata" className="text-sm">
                  {getTranslation('pdf.templateSelector.includeMetadata', 'Include Metadata Section')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTableOfContents"
                  checked={options.includeTableOfContents}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeTableOfContents', checked as boolean)
                  }
                />
                <Label htmlFor="includeTableOfContents" className="text-sm">
                  {getTranslation('pdf.templateSelector.includeTableOfContents', 'Include Table of Contents')}
                </Label>
              </div>
            </div>
          </Card>

          {/* Revolutionary PDF Options */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">{getTranslation('pdf.templateSelector.revolutionaryEnhancements', 'Revolutionary Enhancements')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enhancedReadability"
                  checked={options.enhancedReadability}
                  onCheckedChange={(checked) => 
                    handleOptionChange('enhancedReadability', checked as boolean)
                  }
                />
                <Label htmlFor="enhancedReadability" className="text-sm">
                  {getTranslation('pdf.templateSelector.enhancedReadability', 'Enhanced Readability')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smartPageBreaks"
                  checked={options.smartPageBreaks}
                  onCheckedChange={(checked) => 
                    handleOptionChange('smartPageBreaks', checked as boolean)
                  }
                />
                <Label htmlFor="smartPageBreaks" className="text-sm">
                  {getTranslation('pdf.templateSelector.smartPageBreaks', 'Smart Page Breaks')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optimizedTypography"
                  checked={options.optimizedTypography}
                  onCheckedChange={(checked) => 
                    handleOptionChange('optimizedTypography', checked as boolean)
                  }
                />
                <Label htmlFor="optimizedTypography" className="text-sm">
                  {getTranslation('pdf.templateSelector.optimizedTypography', 'Optimized Typography')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contentFlowOptimization"
                  checked={options.contentFlowOptimization}
                  onCheckedChange={(checked) => 
                    handleOptionChange('contentFlowOptimization', checked as boolean)
                  }
                />
                <Label htmlFor="contentFlowOptimization" className="text-sm">
                  {getTranslation('pdf.templateSelector.contentFlowOptimization', 'Content Flow Optimization')}
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => onGenerate(options)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          {getTranslation('pdf.templateSelector.generateButton', 'Generate Professional PDF')}
        </Button>
        {onPreview && (
          <Button
            variant="outline"
            onClick={() => onPreview(selectedTemplate)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {getTranslation('pdf.templateSelector.previewButton', 'Preview Template')}
          </Button>
        )}
      </div>

      {/* Template Preview Info */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-900">
        <h4 className="font-medium mb-2">{getTranslation('pdf.templateSelector.selectedTemplate', 'Selected Template')}: {getTemplateName(selectedTemplate)}</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>{t('pdf.templateSelector.templateFeatures.revolutionaryTypography', { font: availableTemplates.find(t => getTemplateKeyFromDisplayName(t.name) === selectedTemplate)?.fontFamily.split(',')[0] || 'Arial' }) || getTranslation('pdf.templateSelector.templateFeatures.revolutionaryTypography', '• Revolutionary typography with ' + (availableTemplates.find(t => getTemplateKeyFromDisplayName(t.name) === selectedTemplate)?.fontFamily.split(',')[0] || 'Arial') + ' font').replace('{{font}}', availableTemplates.find(t => getTemplateKeyFromDisplayName(t.name) === selectedTemplate)?.fontFamily.split(',')[0] || 'Arial')}</p>
          <p>{getTranslation('pdf.templateSelector.templateFeatures.perfectContentFlow', '• Perfect content flow with optimized spacing and page breaks')}</p>
          <p>{getTranslation('pdf.templateSelector.templateFeatures.enhancedReadability', '• Enhanced readability with professional contrast ratios')}</p>
          <p>{getTranslation('pdf.templateSelector.templateFeatures.productionReady', '• Production-ready formatting with ultra-high quality output')}</p>
          <p>{getTranslation('pdf.templateSelector.templateFeatures.smartOptimization', '• Smart content optimization for flawless structure')}</p>
        </div>
      </Card>
    </div>
  );
};

export default PDFTemplateSelector; 