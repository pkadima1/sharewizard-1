/**
 * Partners.jsx - Admin Partners Console
 * 
 * Purpose: Complete admin interface for managing partner accounts
 * Features: Create, edit, view partners, generate codes, manage rates and status
 * 
 * Task 8 Implementation:
 * - Partner management table with all required columns  
 * - Forms for creating/editing partners and commission rates
 * - Code generation with invite link copying
 * - Mobile-first responsive design with Tailwind CSS
 * - Admin role guard for security
 * - Full localization support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Icons
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Eye, 
  Copy, 
  UserPlus, 
  Shield, 
  DollarSign,
  Mail,
  Calendar,
  Hash,
  Percent,
  Link,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Constants from partner system
const COMMISSION_RATE_OPTIONS = [0.4, 0.5, 0.6, 0.7];
const DEFAULT_COMMISSION_RATE = 0.6;

/**
 * Partner status utility functions
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'terminated': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'active': return <CheckCircle className="h-4 w-4" />;
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'suspended': return <XCircle className="h-4 w-4" />;
    case 'inactive': return <AlertCircle className="h-4 w-4" />;
    case 'terminated': return <XCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

/**
 * Format currency for display
 */
const formatCurrency = (amountInCents, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amountInCents / 100);
};

/**
 * Format date for display
 */
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Copy text to clipboard with feedback
 */
const copyToClipboard = async (text, toast, t) => {
  try {
    await navigator.clipboard.writeText(text);
    toast({
      title: t('admin.actions.copied'),
      description: t('admin.actions.copiedDesc'),
    });
  } catch (err) {
    toast({
      title: t('admin.errors.copyFailed'),
      description: t('admin.errors.copyFailedDesc'),
      variant: 'destructive',
    });
  }
};

/**
 * Create Partner Form Component
 */
const CreatePartnerForm = ({ isOpen, onClose, onSuccess, t }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    displayName: '',
    companyName: '',
    website: '',
    commissionRate: DEFAULT_COMMISSION_RATE,
    description: '',
    password: '', // New field for creating users
    createUser: false // New field to toggle user creation
  });

  // Email lookup function
  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) return;
    
    setCheckingEmail(true);
    try {
      // Create a callable function to check if user exists by email
      const checkUserByEmail = httpsCallable(functions, 'checkUserByEmail');
      const result = await checkUserByEmail({ email: email.toLowerCase() });
      
      if (result.data.exists) {
        setEmailExists(true);
        setFormData(prev => ({
          ...prev,
          uid: result.data.uid,
          createUser: false
        }));
      } else {
        setEmailExists(false);
        setFormData(prev => ({
          ...prev,
          uid: '',
          createUser: true
        }));
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkEmailExists(formData.email);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const resetForm = () => {
    setFormData({
      uid: '',
      email: '',
      displayName: '',
      companyName: '',
      website: '',
      commissionRate: DEFAULT_COMMISSION_RATE,
      description: '',
      password: '',
      createUser: false
    });
    setEmailExists(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalFormData = { ...formData };
      
      // If creating a new user, we need password but not UID
      if (formData.createUser) {
        delete finalFormData.uid;
        // Keep password for new user creation
        delete finalFormData.createUser;
      } else {
        // If using existing user, validate UID is provided
        if (!formData.uid.trim()) {
          toast({
            title: t('admin.errors.createFailed'),
            description: 'Firebase Auth UID is required when not creating a new user.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        delete finalFormData.password;
        delete finalFormData.createUser;
      }

      const createPartner = httpsCallable(functions, 'createPartner');
      const result = await createPartner(finalFormData);
      
      toast({
        title: t('admin.messages.partnerCreated'),
        description: t('admin.messages.partnerCreatedDesc', { name: formData.displayName }),
      });
      
      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating partner:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || t('admin.errors.createFailedDesc');
      
      if (error.code === 'functions/not-found') {
        errorMessage = 'The Firebase Auth user with this UID does not exist. Please create the user first or use the "Create New User" option.';
      } else if (error.code === 'functions/already-exists') {
        errorMessage = 'A partner with this email already exists.';
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = 'Please check all required fields and ensure the email format is valid.';
      }
      
      toast({
        title: t('admin.errors.createFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.forms.createPartner.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.forms.createPartner.subtitle')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field with Auto-Detection */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('admin.forms.createPartner.email')} *</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('admin.forms.createPartner.emailPlaceholder')}
                required
                className={checkingEmail ? 'pr-10' : ''}
              />
              {checkingEmail && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Email Status Indicator */}
            {formData.email && !checkingEmail && (
              <div className={`text-sm p-2 rounded-md ${
                emailExists 
                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {emailExists ? (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{t('partners.form.emailDetection.userFound')}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>{t('partners.form.emailDetection.newUser')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Creation Toggle - Only show when email is entered */}
          {formData.email && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="createUser"
                  checked={formData.createUser}
                  onCheckedChange={(checked) => handleChange('createUser', checked)}
                />
                <Label htmlFor="createUser" className="text-sm font-medium">
                  {emailExists ? t('partners.form.emailDetection.overrideCreate') : 'Create New Firebase Auth User'}
                </Label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {emailExists 
                  ? t('partners.form.emailDetection.overrideDescription')
                  : formData.createUser 
                    ? "This will create a new Firebase Auth user and partner account simultaneously."
                    : "Use an existing Firebase Auth user UID to create a partner account."
                }
              </p>
            </div>
          )}

          {/* UID Field - Only show when not creating new user */}
          {!formData.createUser && (
            <div className="space-y-2">
              <Label htmlFor="uid">{t('admin.forms.createPartner.uid')} *</Label>
              <Input
                id="uid"
                type="text"
                value={formData.uid}
                onChange={(e) => handleChange('uid', e.target.value)}
                placeholder={emailExists ? "Auto-detected from email" : t('admin.forms.createPartner.uidPlaceholder')}
                required={!formData.createUser}
                className={emailExists ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' : ''}
                readOnly={emailExists}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {emailExists 
                  ? t('partners.form.emailDetection.autoDetected')
                  : t('admin.forms.createPartner.uidHelp')
                }
              </p>
            </div>
          )}

          {/* Password Field - Only show when creating new user */}
          {formData.createUser && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter password for new user"
                required={formData.createUser}
                minLength={6}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Minimum 6 characters. The user will be able to sign in with this email and password.
              </p>
            </div>
          )}



          {/* Display Name Field */}
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('admin.forms.createPartner.displayName')} *</Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder={t('admin.forms.createPartner.displayNamePlaceholder')}
              required
            />
          </div>

          {/* Company Name Field */}
          <div className="space-y-2">
            <Label htmlFor="companyName">{t('admin.forms.createPartner.companyName')}</Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder={t('admin.forms.createPartner.companyNamePlaceholder')}
            />
          </div>

          {/* Website Field */}
          <div className="space-y-2">
            <Label htmlFor="website">{t('admin.forms.createPartner.website')}</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder={t('admin.forms.createPartner.websitePlaceholder')}
            />
          </div>

          {/* Commission Rate Field */}
          <div className="space-y-2">
            <Label htmlFor="commissionRate">{t('admin.forms.createPartner.commissionRate')}</Label>
            <Select 
              value={formData.commissionRate.toString()} 
              onValueChange={(value) => handleChange('commissionRate', parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_RATE_OPTIONS.map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {(rate * 100).toFixed(0)}% {rate === DEFAULT_COMMISSION_RATE && `(${t('admin.forms.default')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('admin.forms.createPartner.notes')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('admin.forms.createPartner.notesPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              {t('admin.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.actions.creating')}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {formData.createUser ? 'Create User & Partner' : t('admin.actions.createPartner')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Edit Partner Commission Form Component
 */
const EditPartnerForm = ({ isOpen, onClose, partner, onSuccess, t }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState(partner?.commissionRate || DEFAULT_COMMISSION_RATE);

  useEffect(() => {
    if (partner) {
      setCommissionRate(partner.commissionRate || DEFAULT_COMMISSION_RATE);
    }
  }, [partner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partner) return;
    
    setLoading(true);

    try {
      const partnerRef = doc(db, 'partners', partner.id);
      await updateDoc(partnerRef, {
        commissionRate: commissionRate,
        updatedAt: new Date()
      });
      
      toast({
        title: t('admin.messages.partnerUpdated'),
        description: t('admin.messages.partnerUpdatedDesc', { name: partner.displayName }),
      });
      
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: t('admin.errors.updateFailed'),
        description: error.message || t('admin.errors.updateFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('admin.forms.editPartner.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.forms.editPartner.description', { name: partner.displayName })}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Partner Info Display */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <div><strong>{t('admin.columns.name')}:</strong> {partner.displayName}</div>
            <div><strong>{t('admin.columns.email')}:</strong> {partner.email}</div>
            {partner.companyName && <div><strong>{t('admin.columns.company')}:</strong> {partner.companyName}</div>}
          </div>

          {/* Commission Rate Field */}
          <div className="space-y-2">
            <Label htmlFor="commissionRate">{t('admin.forms.editPartner.commissionRate')}</Label>
            <Select 
              value={commissionRate.toString()} 
              onValueChange={(value) => setCommissionRate(parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_RATE_OPTIONS.map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {(rate * 100).toFixed(0)}% {rate === DEFAULT_COMMISSION_RATE && `(${t('admin.forms.default')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('admin.forms.editPartner.commissionHelp')}
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              {t('admin.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.actions.updating')}
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('admin.actions.updateRate')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Generate Partner Code Form Component
 */
const GenerateCodeForm = ({ isOpen, onClose, partner, onSuccess, t }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [codeData, setCodeData] = useState({
    desiredCode: '',
    description: '',
    maxUses: '',
    expiresAt: '',
    customCommissionRate: 'default'
  });

  const resetForm = () => {
    setCodeData({
      desiredCode: '',
      description: '',
      maxUses: '',
      expiresAt: '',
      customCommissionRate: 'default'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!partner) return;
    
    setLoading(true);

    try {
      const createPartnerCode = httpsCallable(functions, 'createPartnerCode');
      const payload = {
        partnerId: partner.id,
        ...(codeData.desiredCode && { desiredCode: codeData.desiredCode.toUpperCase() }),
        ...(codeData.description && { description: codeData.description }),
        ...(codeData.maxUses && { maxUses: parseInt(codeData.maxUses) }),
        ...(codeData.expiresAt && { expiresAt: new Date(codeData.expiresAt) }),
        ...(codeData.customCommissionRate && codeData.customCommissionRate !== "default" && { 
          customCommissionRate: parseFloat(codeData.customCommissionRate) 
        })
      };
      
      const result = await createPartnerCode(payload);
      
      toast({
        title: t('admin.messages.codeGenerated'),
        description: t('admin.messages.codeGeneratedDesc', { code: result.data.code }),
      });
      
      resetForm();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: t('admin.errors.codeFailed'),
        description: error.message || t('admin.errors.codeFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setCodeData(prev => ({ ...prev, [field]: value }));
  };

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.forms.generateCode.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.forms.generateCode.subtitle', { name: partner.displayName })}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Partner Info Display */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <div><strong>{t('admin.columns.name')}:</strong> {partner.displayName}</div>
            <div><strong>{t('admin.columns.email')}:</strong> {partner.email}</div>
          </div>

          {/* Desired Code Field */}
          <div className="space-y-2">
            <Label htmlFor="desiredCode">{t('admin.forms.generateCode.desiredCode')}</Label>
            <Input
              id="desiredCode"
              type="text"
              value={codeData.desiredCode}
              onChange={(e) => handleChange('desiredCode', e.target.value.toUpperCase())}
              placeholder={t('admin.forms.generateCode.desiredCodePlaceholder')}
              pattern="[A-Z0-9]+"
              title={t('admin.forms.generateCode.codeFormat')}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('admin.forms.generateCode.codeHelp')}
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('admin.forms.generateCode.notes')}</Label>
            <Input
              id="description"
              type="text"
              value={codeData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('admin.forms.generateCode.notesPlaceholder')}
            />
          </div>

          {/* Optional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="maxUses">{t('admin.forms.generateCode.maxUses')}</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={codeData.maxUses}
                onChange={(e) => handleChange('maxUses', e.target.value)}
                placeholder={t('admin.forms.generateCode.unlimited')}
              />
            </div>

            {/* Expires At */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">{t('admin.forms.generateCode.expiresAt')}</Label>
              <Input
                id="expiresAt"
                type="date"
                value={codeData.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Custom Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="customCommissionRate">{t('admin.forms.generateCode.customRate')}</Label>
            <Select 
              value={codeData.customCommissionRate || "default"} 
              onValueChange={(value) => handleChange('customCommissionRate', value === "default" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.forms.generateCode.useDefault')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('admin.forms.generateCode.useDefault')}</SelectItem>
                {COMMISSION_RATE_OPTIONS.map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {(rate * 100).toFixed(0)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              {t('admin.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.actions.generating')}
                </>
              ) : (
                <>
                  <Hash className="mr-2 h-4 w-4" />
                  {t('admin.actions.generateCode')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Partner Details Modal Component
 */
const PartnerDetailsModal = ({ isOpen, onClose, partner, partnerCodes, t }) => {
  const { toast } = useToast();

  const generateInviteLink = (code) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${code}`;
  };

  const copyInviteLink = async (code) => {
    const link = generateInviteLink(code);
    await copyToClipboard(link, toast, t);
  };

  if (!partner) return null;

  const partnerCodesForThisPartner = partnerCodes.filter(code => code.partnerId === partner.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.details.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.details.subtitle', { name: partner.displayName })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Partner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.details.information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('admin.columns.name')}
                  </Label>
                  <p className="text-sm">{partner.displayName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('admin.columns.email')}
                  </Label>
                  <p className="text-sm">{partner.email}</p>
                </div>
                {partner.companyName && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('admin.columns.company')}
                    </Label>
                    <p className="text-sm">{partner.companyName}</p>
                  </div>
                )}
                {partner.website && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('admin.details.website')}
                    </Label>
                    <a 
                      href={partner.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      {partner.website}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('admin.columns.status')}
                  </Label>
                  <Badge className={getStatusColor(partner.status)}>
                    {getStatusIcon(partner.status)}
                    <span className="ml-1">{t(`admin.status.${partner.status}`)}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('admin.columns.commission')}
                  </Label>
                  <p className="text-sm">{(partner.commissionRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('admin.columns.joined')}
                  </Label>
                  <p className="text-sm">{formatDate(partner.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.details.statistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {partner.stats?.totalReferrals || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.columns.referrals')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {partner.stats?.totalConversions || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.details.conversions')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(partner.stats?.totalCommissionEarned || 0)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.columns.earned')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(partner.stats?.totalCommissionPaid || 0)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.details.paid')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.details.codes')}</CardTitle>
            </CardHeader>
            <CardContent>
              {partnerCodesForThisPartner.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('admin.details.noCodes')}
                </p>
              ) : (
                <div className="space-y-3">
                  {partnerCodesForThisPartner.map((code) => (
                    <div 
                      key={code.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="font-mono">
                            {code.code}
                          </Badge>
                          {!code.active && (
                            <Badge variant="secondary">{t('admin.status.inactive')}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {code.description || t('admin.details.noDescription')}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {t('admin.details.uses')}: {code.uses || 0}
                          {code.maxUses && ` / ${code.maxUses}`}
                          {code.expiresAt && (
                            <span className="ml-2">
                              {t('admin.details.expires')}: {formatDate(code.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(code.code)}
                        className="ml-3"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {t('admin.actions.copyLink')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            {t('admin.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Main Partners Admin Component
 */
const Partners = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('partners');
  
  // State management
  const [partners, setPartners] = useState([]);
  const [partnerCodes, setPartnerCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Admin check - exact match with backend logic
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com' || 
                  currentUser?.uid === 'admin-uid-here';

  // Fetch partners and codes
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Fetch partners
      const partnersQuery = query(
        collection(db, 'partners'),
        orderBy('createdAt', 'desc')
      );
      
      // Fetch partner codes
      const codesQuery = query(
        collection(db, 'partnerCodes'),
        orderBy('createdAt', 'desc')
      );

      const [partnersSnapshot, codesSnapshot] = await Promise.all([
        getDocs(partnersQuery),
        getDocs(codesQuery)
      ]);

      const partnersData = partnersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const codesData = codesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPartners(partnersData);
      setPartnerCodes(codesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('admin.errors.fetchFailed'),
        description: error.message || t('admin.errors.fetchFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast, t]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribePartners = onSnapshot(
      query(collection(db, 'partners'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const partnersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPartners(partnersData);
      },
      (error) => {
        console.error('Error listening to partners:', error);
      }
    );

    const unsubscribeCodes = onSnapshot(
      query(collection(db, 'partnerCodes'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const codesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPartnerCodes(codesData);
      },
      (error) => {
        console.error('Error listening to codes:', error);
      }
    );

    return () => {
      unsubscribePartners();
      unsubscribeCodes();
    };
  }, [isAdmin]);

  // Filter partners based on search and status
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = !searchTerm || 
      partner.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Toggle partner status
  const togglePartnerStatus = async (partner) => {
    try {
      const newStatus = partner.status === 'active' ? 'inactive' : 'active';
      const partnerRef = doc(db, 'partners', partner.id);
      await updateDoc(partnerRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      toast({
        title: t('admin.messages.statusUpdated'),
        description: t('admin.messages.statusUpdatedDesc', { 
          name: partner.displayName,
          status: t(`admin.status.${newStatus}`)
        }),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('admin.errors.statusFailed'),
        description: error.message || t('admin.errors.statusFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  // Delete partner
  const deletePartner = async (partner) => {
    if (!confirm(t('admin.messages.confirmDelete', { name: partner.displayName }))) {
      return;
    }

    try {
      // Delete partner document
      const partnerRef = doc(db, 'partners', partner.id);
      await deleteDoc(partnerRef);
      
      // Delete associated partner codes
      const partnerCodesQuery = query(
        collection(db, 'partnerCodes'),
        where('partnerId', '==', partner.id)
      );
      const codesSnapshot = await getDocs(partnerCodesQuery);
      
      const deletePromises = codesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      toast({
        title: t('admin.messages.partnerDeleted'),
        description: t('admin.messages.partnerDeletedDesc', { name: partner.displayName }),
      });
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: t('admin.errors.deleteFailed'),
        description: error.message || t('admin.errors.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  // Admin route guard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('admin.title')}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {partners.length} {t('admin.totalPartners')}
              </span>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('admin.actions.createPartner')}</span>
                <span className="sm:hidden">{t('admin.actions.create')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('admin.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.filters.allStatus')}</SelectItem>
                  <SelectItem value="active">{t('admin.status.active')}</SelectItem>
                  <SelectItem value="pending">{t('admin.status.pending')}</SelectItem>
                  <SelectItem value="suspended">{t('admin.status.suspended')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.status.inactive')}</SelectItem>
                  <SelectItem value="terminated">{t('admin.status.terminated')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh Button */}
              <Button 
                variant="outline" 
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">{t('admin.actions.refresh')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('admin.partners.title')}</CardTitle>
                <CardDescription>
                  {t('admin.partners.description')}
                  {searchTerm && (
                    <span className="ml-2">
                      {t('admin.search.results', { count: filteredPartners.length })}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.actions.createPartner')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {t('admin.loading')}
                </span>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? t('admin.noResults') : t('admin.noPartners')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm 
                    ? t('admin.noResultsDesc') 
                    : t('admin.noPartnersDesc')
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('admin.actions.createFirst')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.columns.name')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('admin.columns.email')}</TableHead>
                      <TableHead>{t('admin.columns.status')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('admin.columns.commission')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('admin.columns.referrals')}</TableHead>
                      <TableHead className="hidden xl:table-cell">{t('admin.columns.earned')}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('admin.columns.joined')}</TableHead>
                      <TableHead>{t('admin.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartners.map((partner) => (
                      <TableRow key={partner.id}>
                        {/* Name */}
                        <TableCell>
                          <div>
                            <div className="font-medium">{partner.displayName}</div>
                            {partner.companyName && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {partner.companyName}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">{partner.email}</div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={getStatusColor(partner.status)}>
                            {getStatusIcon(partner.status)}
                            <span className="ml-1">{t(`admin.status.${partner.status}`)}</span>
                          </Badge>
                        </TableCell>

                        {/* Commission Rate */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 mr-1 text-gray-400" />
                            {(partner.commissionRate * 100).toFixed(0)}%
                          </div>
                        </TableCell>

                        {/* Referrals */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-center">
                            {partner.stats?.totalReferrals || 0}
                          </div>
                        </TableCell>

                        {/* Total Earned */}
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                            {formatCurrency(partner.stats?.totalCommissionEarned || 0)}
                          </div>
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(partner.createdAt)}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              <DropdownMenuLabel>{t('admin.actions.title')}</DropdownMenuLabel>
                              
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('admin.actions.viewDetails')}
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setShowEditForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('admin.actions.editRate')}
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setShowCodeForm(true);
                                }}
                              >
                                <Hash className="mr-2 h-4 w-4" />
                                {t('admin.actions.generateCode')}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem 
                                onClick={() => togglePartnerStatus(partner)}
                              >
                                {partner.status === 'active' ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {t('admin.actions.deactivate')}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t('admin.actions.activate')}
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem 
                                onClick={() => deletePartner(partner)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                {t('admin.actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for Create Partner */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg"
          size="lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Modals */}
      <CreatePartnerForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={fetchData}
        t={t}
      />

      <EditPartnerForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedPartner(null);
        }}
        partner={selectedPartner}
        onSuccess={fetchData}
        t={t}
      />

      <GenerateCodeForm
        isOpen={showCodeForm}
        onClose={() => {
          setShowCodeForm(false);
          setSelectedPartner(null);
        }}
        partner={selectedPartner}
        onSuccess={fetchData}
        t={t}
      />

      <PartnerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPartner(null);
        }}
        partner={selectedPartner}
        partnerCodes={partnerCodes}
        t={t}
      />
    </div>
  );
};

export default Partners;
