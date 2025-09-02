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

// Constants
const COMMISSION_RATE_OPTIONS = [0.4, 0.5, 0.6, 0.7];
const DEFAULT_COMMISSION_RATE = 0.6;

interface FormErrors {
  displayName?: string;
  website?: string;
  description?: string;
}

const PartnerRegistration: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = usePartnerTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    companyName: '',
    website: '',
    commissionRate: DEFAULT_COMMISSION_RATE,
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

  // Validation functions
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
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
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
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

  const isFormValid = () => {
    return formData.displayName.trim() && 
           !errors.displayName && 
           !errors.website && 
           !errors.description;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(field => {
      if (field !== 'companyName' && field !== 'marketingPreferences') {
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) newErrors[field as keyof FormErrors] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    setLoading(true);

    try {
      const registerPartner = httpsCallable(functions, 'registerPartner');
      const result = await registerPartner({
        email: currentUser.email,
        displayName: formData.displayName,
        companyName: formData.companyName,
        website: formData.website,
        commissionRate: formData.commissionRate,
        description: formData.description,
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
    <Card className="max-w-3xl mx-auto shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <UserPlus className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('registration.form.title')}
        </CardTitle>
        <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
          {t('registration.form.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-base font-semibold">
              {t('registration.form.displayName')} *
            </Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              onBlur={() => handleBlur('displayName')}
              placeholder={t('registration.form.displayNamePlaceholder')}
              className={`h-12 text-base ${errors.displayName && touched.displayName ? 'border-red-500 focus:border-red-500' : ''}`}
              required
              minLength={2}
              maxLength={100}
            />
            {errors.displayName && touched.displayName && (
              <div className="flex items-center text-red-500 text-sm mt-1">
                <X className="h-4 w-4 mr-1" />
                {errors.displayName}
              </div>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-base font-semibold">
              {t('registration.form.companyName')}
            </Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder={t('registration.form.companyNamePlaceholder')}
              className="h-12 text-base"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-base font-semibold">
              {t('registration.form.website')}
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              onBlur={() => handleBlur('website')}
              placeholder={t('registration.form.websitePlaceholder')}
              className={`h-12 text-base ${errors.website && touched.website ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.website && touched.website && (
              <div className="flex items-center text-red-500 text-sm mt-1">
                <X className="h-4 w-4 mr-1" />
                {errors.website}
              </div>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-3">
            <Label htmlFor="commissionRate" className="text-base font-semibold">
              {t('registration.form.commissionRate')}
            </Label>
            <div className="relative">
              <select
                id="commissionRate"
                value={formData.commissionRate}
                onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                className="w-full h-12 text-base px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {COMMISSION_RATE_OPTIONS.map((rate) => (
                  <option key={rate} value={rate}>
                    {(rate * 100).toFixed(0)}% {rate === DEFAULT_COMMISSION_RATE && `(${t('registration.form.default')})`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('registration.form.commissionHelp')}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-base font-semibold">
              {t('registration.form.description')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder={t('registration.form.descriptionPlaceholder')}
              rows={4}
              className={`text-base ${errors.description && touched.description ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.description && touched.description && (
              <div className="flex items-center text-red-500 text-sm mt-1">
                <X className="h-4 w-4 mr-1" />
                {errors.description}
              </div>
            )}
            <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Info className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('registration.form.descriptionHelp')}
              </p>
            </div>
          </div>

          {/* Marketing Preferences */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t('registration.form.marketingPreferences')}</Label>
            <div className="grid gap-3">
              <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.marketingPreferences.emailMarketing}
                  onChange={(e) => handleMarketingPreferenceChange('emailMarketing', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 dark:text-gray-300">{t('registration.form.emailMarketing')}</span>
              </label>
              <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.marketingPreferences.smsMarketing}
                  onChange={(e) => handleMarketingPreferenceChange('smsMarketing', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 dark:text-gray-300">{t('registration.form.smsMarketing')}</span>
              </label>
              <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.marketingPreferences.partnerNewsletter}
                  onChange={(e) => handleMarketingPreferenceChange('partnerNewsletter', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700 dark:text-gray-300">{t('registration.form.partnerNewsletter')}</span>
              </label>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('registration.back')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {t('registration.submitting')}
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-3" />
                  {t('registration.submit')}
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
