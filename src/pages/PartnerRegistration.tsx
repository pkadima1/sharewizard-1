/**
 * PartnerRegistration.tsx - Enhanced Public Partner Registration Page
 * 
 * Purpose: Allow users to register themselves as partners with perfect UX
 * Features: Self-registration form, validation, approval workflow, enhanced UI
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePartnerTranslation } from '@/hooks/use-partner-translation';
import { Navigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Icons
import { 
  Users, 
  UserPlus, 
  Mail, 
  Building, 
  Globe, 
  FileText, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  Star,
  TrendingUp,
  Headphones,
  Gift,
  Clock,
  Check,
  X,
  Info
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Constants - Industry options for DFY content services using translation keys
const INDUSTRY_OPTIONS = [
  { value: 'coaching', key: 'industries.coaching' },
  { value: 'fitness', key: 'industries.fitness' },
  { value: 'ecommerce', key: 'industries.ecommerce' },
  { value: 'tech', key: 'industries.tech' },
  { value: 'realestate', key: 'industries.realestate' },
  { value: 'finance', key: 'industries.finance' },
  { value: 'beauty', key: 'industries.beauty' },
  { value: 'food', key: 'industries.food' },
  { value: 'education', key: 'industries.education' },
  { value: 'other', key: 'industries.other' }
];

// Content skills for DFY services
const CONTENT_SKILLS = [
  { id: 'social-media', key: 'registration.form.enhanced.socialMedia', icon: '📱', dfyCore: true },
  { id: 'blog-writing', key: 'registration.form.enhanced.blogWriting', icon: '✍️', dfyCore: true },
  { id: 'graphic-design', key: 'registration.form.enhanced.graphicDesign', icon: '🎨', dfyCore: false },
  { id: 'video-editing', key: 'registration.form.enhanced.videoEditing', icon: '🎬', dfyCore: false },
  { id: 'community-mgmt', key: 'registration.form.enhanced.communityMgmt', icon: '👥', dfyCore: true },
  { id: 'learning', key: 'registration.form.enhanced.justLearning', icon: '🌱', dfyCore: false }
];

// Experience levels
const EXPERIENCE_LEVELS = [
  { value: 'beginner', labelKey: 'registration.form.enhanced.beginner', descKey: 'registration.form.enhanced.beginnerDesc', icon: '🌱' },
  { value: 'intermediate', labelKey: 'registration.form.enhanced.intermediate', descKey: 'registration.form.enhanced.intermediateDesc', icon: '🌿' },
  { value: 'advanced', labelKey: 'registration.form.enhanced.advanced', descKey: 'registration.form.enhanced.advancedDesc', icon: '🌳' }
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'English', key: 'registration.form.enhanced.languageOptions.english' },
  { value: 'French', key: 'registration.form.enhanced.languageOptions.french' },
  { value: 'Spanish', key: 'registration.form.enhanced.languageOptions.spanish' },
  { value: 'German', key: 'registration.form.enhanced.languageOptions.german' },
  { value: 'Portuguese', key: 'registration.form.enhanced.languageOptions.portuguese' },
  { value: 'Italian', key: 'registration.form.enhanced.languageOptions.italian' },
  { value: 'Other', key: 'registration.form.enhanced.languageOptions.other' }
];

const LANGUAGE_LEVELS = [
  { value: 'Native', key: 'registration.form.enhanced.native' },
  { value: 'Fluent', key: 'registration.form.enhanced.fluent' }, 
  { value: 'Conversational', key: 'registration.form.enhanced.conversational' }
];

// Availability options
const AVAILABILITY_OPTIONS = [
  { value: 'weekday-morning', key: 'registration.form.enhanced.weekdayMorning' },
  { value: 'weekday-afternoon', key: 'registration.form.enhanced.weekdayAfternoon' },
  { value: 'weekday-evening', key: 'registration.form.enhanced.weekdayEvening' },
  { value: 'weekend-morning', key: 'registration.form.enhanced.weekendMorning' },
  { value: 'weekend-afternoon', key: 'registration.form.enhanced.weekendAfternoon' },
  { value: 'flexible', key: 'registration.form.enhanced.flexible' }
];

interface Language {
  language: string;
  level: string;
}

interface CommissionTier {
  tier: 'basic' | 'standard' | 'certified';
  partnerSourced: { rate: number; label: string };
  epSourced: { rate: number; label: string };
  canReceiveEPLeads: boolean;
  tierName: string;
  tierColor: 'bronze' | 'silver' | 'gold';
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  industry?: string;
  contentSkills?: string;
  experienceLevel?: string;
  expectedClients?: string;
  availability?: string;
  languages?: string;
  portfolioSamples?: string;
}

const PartnerRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = usePartnerTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    phone: '',
    industry: '',
    
    // Skills & Experience
    contentSkills: [] as string[],
    languages: [{ language: 'English', level: 'Native' }] as Language[],
    experienceLevel: '' as 'beginner' | 'intermediate' | 'advanced' | '',
    
    // Capacity & Portfolio
    expectedClients: 5,
    availability: '',
    portfolioSamples: '',
    
    // Legacy fields (keeping for backward compatibility)
    displayName: '',
    companyName: '',
    website: '',
    description: '',
    marketingPreferences: {
      emailMarketing: true,
      smsMarketing: false,
      partnerNewsletter: true
    }
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect if not authenticated
  if (!currentUser) {
    return <Navigate to="/login?redirect=partner-registration" replace />;
  }

  // Smart Commission Calculation based on user's two-tier strategy
  const calculateCommissionTier = (): CommissionTier => {
    const { experienceLevel, contentSkills, expectedClients, portfolioSamples } = formData;
    
    let qualificationScore = 0;
    
    // Experience scoring (40% of total score)
    if (experienceLevel === 'beginner') qualificationScore += 20;
    if (experienceLevel === 'intermediate') qualificationScore += 40;
    if (experienceLevel === 'advanced') qualificationScore += 60;
    
    // Skills scoring - prioritize DFY core skills (30% of total score)
    const dfySkills = contentSkills.filter(skill => {
      const skillInfo = CONTENT_SKILLS.find(s => s.id === skill);
      return skillInfo?.dfyCore === true;
    });
    qualificationScore += Math.min(dfySkills.length * 10, 30);
    
    // Capacity scoring (20% of total score)
    if (expectedClients >= 5) qualificationScore += 10;
    if (expectedClients >= 10) qualificationScore += 20;
    
    // Portfolio bonus (10% of total score)
    if (portfolioSamples && portfolioSamples.trim()) qualificationScore += 10;
    
    // Determine tier based on score
    if (qualificationScore >= 85) {
      return {
        tier: 'certified',
        partnerSourced: { rate: 0.70, label: '70%' },
        epSourced: { rate: 0.60, label: '60%' },
        canReceiveEPLeads: true,
        tierName: 'Certified Partner',
        tierColor: 'gold'
      };
    } else if (qualificationScore >= 65) {
      return {
        tier: 'standard',
        partnerSourced: { rate: 0.70, label: '70%' },
        epSourced: { rate: 0.55, label: '55%' },
        canReceiveEPLeads: true,
        tierName: 'Standard Partner',
        tierColor: 'silver'
      };
    } else {
      return {
        tier: 'basic',
        partnerSourced: { rate: 0.70, label: '70%' },
        epSourced: { rate: 0.0, label: t('registration.form.enhanced.leadSources.notEligible') },
        canReceiveEPLeads: false,
        tierName: 'Basic Partner',
        tierColor: 'bronze'
      };
    }
  };

  // Redirect if not authenticated
  if (!currentUser) {
    return <Navigate to="/login?redirect=partner-registration" replace />;
  }

  // Enhanced validation functions for new form structure
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value || !value.trim()) return t('validation.required');
        if (value.trim().length < 2) return t('validation.minLength', { min: 2 });
        if (value.trim().length > 50) return t('validation.maxLength', { max: 50 });
        break;
      case 'phone': {
        if (!value || !value.trim()) return t('validation.required');
        // Basic phone validation - allow international formats
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
        const cleanPhone = value.replace(/[\s\-()]/g, '');
        if (!phoneRegex.test(cleanPhone)) return t('validation.invalidPhone');
        break;
      }
      case 'industry':
        if (!value || !value.trim()) return t('validation.selectIndustry');
        break;
      case 'contentSkills':
        if (!value || value.length === 0) return t('validation.selectSkills');
        break;
      case 'experienceLevel':
        if (!value || !value.trim()) return t('validation.selectExperience');
        break;
      case 'availability':
        if (!value || !value.trim()) return t('validation.selectAvailability');
        break;
      case 'portfolioSamples':
        if (value && value.trim()) {
          try {
            new URL(value);
          } catch {
            return t('validation.invalidUrl');
          }
        }
        break;
      // Legacy field validations
      case 'displayName':
        if (!value.trim()) return t('validation.required');
        if (value.trim().length < 2) return t('validation.minLength', { min: 2 });
        if (value.trim().length > 100) return t('validation.maxLength', { max: 100 });
        break;
      case 'website':
        if (value && value.trim()) {
          try {
            new URL(value);
          } catch {
            return t('validation.invalidUrl');
          }
        }
        break;
      case 'description':
        if (value && value.trim().length > 500) return t('validation.maxLength', { max: 500 });
        break;
    }
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldValue = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], formData)
      : formData[field as keyof typeof formData];
    const error = validateField(field, fieldValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // Handle nested fields like marketingPreferences.emailMarketing
      const keys = field.split('.');
      setFormData(prev => {
        const parentKey = keys[0] as keyof typeof prev;
        const currentParent = prev[parentKey];
        
        // Ensure the parent is an object before spreading
        if (typeof currentParent === 'object' && currentParent !== null) {
          return {
            ...prev,
            [parentKey]: {
              ...(currentParent as Record<string, any>),
              [keys[1]]: value
            }
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Helper functions for form interactions
  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      contentSkills: prev.contentSkills.includes(skillId)
        ? prev.contentSkills.filter(s => s !== skillId)
        : [...prev.contentSkills, skillId]
    }));
    
    // Clear skills error if any skill is selected
    if (formData.contentSkills.length > 0 || !formData.contentSkills.includes(skillId)) {
      setErrors(prev => ({ ...prev, contentSkills: undefined }));
    }
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', level: 'Conversational' }]
    }));
  };

  const updateLanguage = (index: number, field: 'language' | 'level', value: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => 
        i === index ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const removeLanguage = (index: number) => {
    if (formData.languages.length > 1) {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index)
      }));
    }
  };

  const handleMarketingPreferenceChange = (preference: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      marketingPreferences: {
        ...prev.marketingPreferences,
        [preference]: value
      }
    }));
  };

  // Enhanced form validation for new structure
  const isFormValid = () => {
    const requiredFields = {
      fullName: formData.fullName?.trim(),
      phone: formData.phone?.trim(),
      industry: formData.industry?.trim(),
      contentSkills: formData.contentSkills?.length > 0,
      experienceLevel: formData.experienceLevel?.trim(),
      availability: formData.availability?.trim()
    };

    const hasRequiredFields = Object.values(requiredFields).every(Boolean);
    const hasNoErrors = Object.values(errors).every(error => !error);
    
    return hasRequiredFields && hasNoErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields for new structure
    const requiredFields = ['fullName', 'phone', 'industry', 'experienceLevel', 'availability'];
    const newErrors: FormErrors = {};
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field as keyof FormErrors] = error;
    });

    // Validate content skills
    if (formData.contentSkills.length === 0) {
      newErrors.contentSkills = t('validation.selectSkills');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(newErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      toast({
        title: t('registration.errors.title'),
        description: t('registration.errors.invalidData'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const registerPartner = httpsCallable(functions, 'registerPartner');
      const tierInfo = calculateCommissionTier();
      
      const result = await registerPartner({
        // User identification
        email: currentUser.email,
        uid: currentUser.uid,
        
        // New enhanced partner data
        fullName: formData.fullName,
        phone: formData.phone,
        industry: formData.industry,
        contentSkills: formData.contentSkills,
        languages: formData.languages,
        experienceLevel: formData.experienceLevel,
        expectedClients: formData.expectedClients,
        availability: formData.availability,
        portfolioSamples: formData.portfolioSamples,
        
        // Commission structure
        commissionTier: tierInfo.tier,
        partnerSourcedRate: tierInfo.partnerSourced.rate,
        epSourcedRate: tierInfo.epSourced.rate,
        canReceiveEPLeads: tierInfo.canReceiveEPLeads,
        
        // Legacy fields for backward compatibility
        displayName: formData.fullName, // Use fullName as displayName
        companyName: formData.companyName || '',
        website: formData.portfolioSamples || '',
        description: `Industry: ${formData.industry}, Skills: ${formData.contentSkills.join(', ')}, Experience: ${formData.experienceLevel}`,
        marketingPreferences: formData.marketingPreferences
      });

      toast({
        title: t('registration.success.title'),
        description: t('registration.success.subtitle'),
      });

      setStep(3);
    } catch (error: any) {
      console.error('Partner registration error:', error);
      
      let errorMessage = error.message || t('registration.errors.general');
      
      if (error.code === 'functions/already-exists') {
        errorMessage = t('registration.errors.alreadyExists');
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = t('registration.errors.invalidData');
      }
      
      toast({
        title: t('registration.errors.title'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Commission Structure Display Component
  const renderCommissionStructure = () => {
    const tierInfo = calculateCommissionTier();
    
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold">{t('registration.form.enhanced.commissionStructure')}</Label>
        
        {/* Tier Display */}
        <div className={`p-6 rounded-xl border-2 ${
          tierInfo.tierColor === 'gold' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
          tierInfo.tierColor === 'silver' ? 'border-gray-400 bg-gray-50 dark:bg-gray-800' :
          'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              {t(`registration.form.enhanced.commissionTier.${tierInfo.tier}`)}
            </h4>
            <Badge variant={tierInfo.tierColor === 'gold' ? 'default' : 'secondary'}>
              {tierInfo.tier.toUpperCase()}
            </Badge>
          </div>
          
          {/* Commission Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Model A: Partner-sourced */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-semibold text-green-800 dark:text-green-200">
                  {t('registration.form.enhanced.leadSources.yourLeads')}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {tierInfo.partnerSourced.label}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t('registration.form.enhanced.leadSources.yourLeadsDesc')}
              </p>
            </div>
            
            {/* Model B: EP-sourced */}
            <div className={`p-4 rounded-lg border ${
              tierInfo.canReceiveEPLeads 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  tierInfo.canReceiveEPLeads ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
                <span className={`font-semibold ${
                  tierInfo.canReceiveEPLeads ? 'text-blue-800 dark:text-blue-200' : 'text-gray-600'
                }`}>
                  {t('registration.form.enhanced.leadSources.ourLeads')}
                </span>
              </div>
              <div className={`text-2xl font-bold mb-1 flex items-center gap-2 ${
                tierInfo.canReceiveEPLeads ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {tierInfo.epSourced.label}
                {!tierInfo.canReceiveEPLeads && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{t('registration.form.enhanced.leadSources.notEligibleTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className={`text-sm ${
                tierInfo.canReceiveEPLeads ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'
              }`}>
                {tierInfo.canReceiveEPLeads 
                  ? t('registration.form.enhanced.leadSources.ourLeadsDesc')
                  : t('registration.form.enhanced.leadSources.notEligible')
                }
              </p>
            </div>
          </div>
          
          {/* Service Requirements */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">
              {t('registration.form.enhanced.dfyRequirements')}
            </h5>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• {t('registration.form.enhanced.requirements.weeklyCall')}</li>
              <li>• {t('registration.form.enhanced.requirements.dailyCaptions')}</li>
              <li>• {t('registration.form.enhanced.requirements.blogPosts')}</li>
              <li>• {t('registration.form.enhanced.requirements.satisfaction')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="text-center pb-8">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Users className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t('registration.title')}
        </CardTitle>
        <CardDescription className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('registration.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
            <h4 className="font-bold text-xl text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              {t('registration.benefits.title')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-blue-800 dark:text-blue-200">{t('registration.benefits.commission')}</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-blue-800 dark:text-blue-200">{t('registration.benefits.tracking')}</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-blue-800 dark:text-blue-200">{t('registration.benefits.support')}</span>
              </li>
            </ul>
          </div>

          {/* Process Section */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-800/30 p-6 rounded-2xl border border-amber-200 dark:border-amber-700">
            <h4 className="font-bold text-xl text-amber-900 dark:text-amber-100 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-600" />
              {t('registration.process.title')}
            </h4>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              {t('registration.process.description')}
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => setStep(2)} 
            className="w-full md:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            {t('registration.start')}
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <UserPlus className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('registration.form.enhanced.title')}
        </CardTitle>
        <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
          {t('registration.form.enhanced.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Info Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
            <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-3 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              {t('registration.form.userInfo')}
            </h4>
            <div className="flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {currentUser.email}
              </span>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              1. {t('registration.form.enhanced.basicInfo')}
            </h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-base font-semibold">
                  {t('registration.form.enhanced.fullName')} *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder={t('registration.form.enhanced.fullNamePlaceholder')}
                  className={`h-12 text-base ${errors.fullName && touched.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
                {errors.fullName && touched.fullName && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <X className="h-4 w-4 mr-1" />
                    {errors.fullName}
                  </div>
                )}
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-semibold">
                  {t('registration.form.enhanced.phone')} *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder={t('registration.form.enhanced.phonePlaceholder')}
                  className={`h-12 text-base ${errors.phone && touched.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
                {errors.phone && touched.phone && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <X className="h-4 w-4 mr-1" />
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>
            
            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-base font-semibold">
                {t('registration.form.enhanced.industry')} *
              </Label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                onBlur={() => handleBlur('industry')}
                className={`w-full h-12 px-4 border rounded-lg text-base bg-white dark:bg-gray-800 ${errors.industry && touched.industry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
              >
                <option value="">{t('registration.form.enhanced.industryPlaceholder')}</option>
                {INDUSTRY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.key)}
                  </option>
                ))}
              </select>
              {errors.industry && touched.industry && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <X className="h-4 w-4 mr-1" />
                  {errors.industry}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Skills & Experience */}
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              2. {t('registration.form.enhanced.skillsExperience')}
            </h4>
            
            {/* Content Skills */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t('registration.form.enhanced.contentSkills')} *
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONTENT_SKILLS.map(skill => (
                  <label 
                    key={skill.id} 
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      formData.contentSkills.includes(skill.id) 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.contentSkills.includes(skill.id)}
                      onChange={() => handleSkillToggle(skill.id)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{skill.icon}</span>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">{t(skill.key)}</span>
                      {skill.dfyCore && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('registration.form.enhanced.dfyCore')}</div>
                      )}
                    </div>
                    {formData.contentSkills.includes(skill.id) && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
              {errors.contentSkills && touched.contentSkills && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <X className="h-4 w-4 mr-1" />
                  {errors.contentSkills}
                </div>
              )}
            </div>
            
            {/* Languages */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('registration.form.enhanced.languages')}</Label>
              <div className="space-y-3">
                {formData.languages.map((lang, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <select
                      value={lang.language}
                      onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="">{t('registration.form.enhanced.selectLanguage')}</option>
                      {LANGUAGE_OPTIONS.map(language => (
                        <option key={language.value} value={language.value}>{t(language.key)}</option>
                      ))}
                    </select>
                    <select
                      value={lang.level}
                      onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                      className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      {LANGUAGE_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{t(level.key)}</option>
                      ))}
                    </select>
                    {formData.languages.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLanguage(index)}
                        className="h-10 w-10 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLanguage}
                  className="w-full"
                >
                  {t('registration.form.enhanced.addLanguage')}
                </Button>
              </div>
            </div>
            
            {/* Experience Level */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('registration.form.enhanced.experienceLevel')} *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXPERIENCE_LEVELS.map(level => (
                  <label key={level.value} className="text-center">
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={level.value}
                      checked={formData.experienceLevel === level.value}
                      onChange={(e) => handleChange('experienceLevel', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.experienceLevel === level.value 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}>
                      <div className="text-3xl mb-3">{level.icon}</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{t(level.labelKey)}</div>
                      <div className="text-sm text-gray-500">{t(level.descKey)}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.experienceLevel && touched.experienceLevel && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <X className="h-4 w-4 mr-1" />
                  {errors.experienceLevel}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Capacity & Portfolio */}
          <div className="space-y-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              3. {t('registration.form.enhanced.availability')}
            </h4>
            
            {/* Expected Clients */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t('registration.form.enhanced.expectedClients')} *
              </Label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={formData.expectedClients}
                  onChange={(e) => handleChange('expectedClients', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{t('registration.form.enhanced.oneClient')}</span>
                  <span className="font-bold text-blue-600 text-lg">{formData.expectedClients} {t('registration.form.enhanced.clients')}</span>
                  <span>{t('registration.form.enhanced.twentyClients')}</span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {formData.expectedClients <= 5 && t('registration.form.enhanced.capacityLow')}
                    {formData.expectedClients > 5 && formData.expectedClients <= 10 && t('registration.form.enhanced.capacityMedium')}
                    {formData.expectedClients > 10 && t('registration.form.enhanced.capacityHigh')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Availability */}
            <div className="space-y-2">
              <Label htmlFor="availability" className="text-base font-semibold">
                {t('registration.form.enhanced.availabilityField')} *
              </Label>
              <select
                id="availability"
                value={formData.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
                onBlur={() => handleBlur('availability')}
                className={`w-full h-12 px-4 border rounded-lg text-base bg-white dark:bg-gray-800 ${errors.availability && touched.availability ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
              >
                <option value="">{t('registration.form.enhanced.availabilityPlaceholder')}</option>
                {AVAILABILITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {t(option.key)}
                  </option>
                ))}
              </select>
              {errors.availability && touched.availability && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <X className="h-4 w-4 mr-1" />
                  {errors.availability}
                </div>
              )}
            </div>
            
            {/* Portfolio Samples */}
            <div className="space-y-2">
              <Label htmlFor="portfolioSamples" className="text-base font-semibold">
                {t('registration.form.enhanced.portfolioSamples')}
              </Label>
              <Input
                id="portfolioSamples"
                type="url"
                value={formData.portfolioSamples}
                onChange={(e) => handleChange('portfolioSamples', e.target.value)}
                onBlur={() => handleBlur('portfolioSamples')}
                placeholder={t('registration.form.enhanced.portfolioPlaceholder')}
                className={`h-12 text-base ${errors.portfolioSamples && touched.portfolioSamples ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {errors.portfolioSamples && touched.portfolioSamples && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <X className="h-4 w-4 mr-1" />
                  {errors.portfolioSamples}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Share any examples of your content work - website, Instagram, writing samples, etc.
              </p>
            </div>
          </div>

          {/* Commission Structure Display */}
          {renderCommissionStructure()}

          <Separator className="my-8" />

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('registration.form.enhanced.back')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {t('registration.form.enhanced.submitting')}
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-3" />
                  {t('registration.form.enhanced.submitApplication')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900">
      <CardHeader className="text-center pb-8">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <CardTitle className="text-4xl font-bold text-green-900 dark:text-green-100">
          {t('registration.success.title')}
        </CardTitle>
        <CardDescription className="text-xl text-green-700 dark:text-green-300 max-w-2xl mx-auto">
          {t('registration.success.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 p-6 rounded-2xl border border-green-200 dark:border-green-700">
            <h4 className="font-bold text-xl text-green-900 dark:text-green-100 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              {t('registration.success.nextSteps')}
            </h4>
            <ul className="space-y-3 text-green-800 dark:text-green-200">
              <li className="flex items-start">
                <div className="w-6 h-6 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
                </div>
                <span>{t('registration.success.review')}</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
                </div>
                <span>{t('registration.success.approval')}</span>
              </li>
              <li className="flex items-start">
                <div className="w-6 h-6 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Check className="h-3 w-3 text-green-700 dark:text-green-300" />
                </div>
                <span>{t('registration.success.notification')}</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
            <h4 className="font-bold text-xl text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-blue-600" />
              {t('registration.success.whileWaiting')}
            </h4>
            <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
              {t('registration.success.whileWaitingDesc')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 max-w-xs"
          >
            {t('registration.success.goToDashboard')}
          </Button>
          <Button
            onClick={() => window.location.href = '/pricing'}
            className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 max-w-xs"
          >
            {t('registration.success.viewPricing')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl mt-20  md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('registration.pageTitle')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('registration.pageDescription')}
          </p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="flex items-center space-x-2 md:space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-sm md:text-lg font-bold transition-all duration-300 ${
                  step >= stepNumber 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircle className="h-6 w-6 md:h-8 md:w-8" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-8 md:w-16 h-1 mx-2 md:mx-4 rounded-full transition-all duration-300 ${
                    step > stepNumber ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default PartnerRegistration;
