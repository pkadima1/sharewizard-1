/**
 * ChatUserInfoForm.tsx - v1.0.0
 * 
 * Purpose: User information form for chat initialization
 * Features: Collects user's first name, email, and help topic before starting chat
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { ChatUserInfo } from '@/contexts/ChatContext';

interface ChatUserInfoFormProps {
  onSubmit: (userInfo: ChatUserInfo) => void;
  isSubmitting?: boolean;
}

interface FormData {
  firstName: string;
  email: string;
  topic: string;
}

const ChatUserInfoForm: React.FC<ChatUserInfoFormProps> = ({ onSubmit, isSubmitting = false }) => {
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormData>();

  const handleFormSubmit = (data: FormData) => {
    const userInfo: ChatUserInfo = {
      firstName: data.firstName.trim(),
      email: data.email.trim(),
      topic: selectedTopic || data.topic
    };
    onSubmit(userInfo);
  };

  const helpTopics = [
    { value: 'account_setup', label: t('support.topics.accountSetup', 'Account Setup') },
    { value: 'subscription_billing', label: t('support.topics.subscriptionBilling', 'Subscription & Billing') },
    { value: 'caption_generator', label: t('support.topics.captionGenerator', 'Caption Generator Help') },
    { value: 'longform_content', label: t('support.topics.longformContent', 'Long-form Content Help') },
    { value: 'technical_issue', label: t('support.topics.technicalIssue', 'Technical Issue') },
    { value: 'feature_request', label: t('support.topics.featureRequest', 'Feature Request') },
    { value: 'general_question', label: t('support.topics.generalQuestion', 'General Question') },
    { value: 'other', label: t('support.topics.other', 'Other') }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('support.userInfo.title', 'Let\'s Get Started')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('support.userInfo.subtitle', 'Please provide some basic information so we can help you better.')}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* First Name */}
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('support.userInfo.firstName', 'First Name')} *
          </Label>
          <Input
            id="firstName"
            type="text"
            disabled={isSubmitting}
            className="mt-1"
            placeholder={t('support.userInfo.firstNamePlaceholder', 'Enter your first name')}
            {...register('firstName', { 
              required: t('support.userInfo.firstNameRequired', 'First name is required'),
              minLength: {
                value: 2,
                message: t('support.userInfo.firstNameMinLength', 'First name must be at least 2 characters')
              }
            })}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('support.userInfo.email', 'Email Address')} *
          </Label>
          <Input
            id="email"
            type="email"
            disabled={isSubmitting}
            className="mt-1"
            placeholder={t('support.userInfo.emailPlaceholder', 'Enter your email address')}
            {...register('email', { 
              required: t('support.userInfo.emailRequired', 'Email is required'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('support.userInfo.emailInvalid', 'Please enter a valid email address')
              }
            })}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Topic */}
        <div>
          <Label htmlFor="topic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('support.userInfo.topic', 'What do you need help with?')} *
          </Label>
          <Select 
            value={selectedTopic} 
            onValueChange={(value) => {
              setSelectedTopic(value);
              setValue('topic', value);
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('support.userInfo.topicPlaceholder', 'Select a topic')} />
            </SelectTrigger>
            <SelectContent>
              {helpTopics.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedTopic && errors.topic && (
            <p className="text-red-500 text-xs mt-1">
              {t('support.userInfo.topicRequired', 'Please select a topic')}
            </p>
          )}
        </div>

        {/* Hidden field for topic validation */}
        <input 
          type="hidden" 
          {...register('topic', { 
            required: !selectedTopic ? t('support.userInfo.topicRequired', 'Please select a topic') : false 
          })}
          value={selectedTopic}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? t('support.userInfo.starting', 'Starting Chat...') 
            : t('support.userInfo.startChat', 'Start Chat')
          }
        </Button>
      </form>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('support.userInfo.privacy', 'Your information is used only to provide better support and is kept confidential.')}
      </p>
    </div>
  );
};

export default ChatUserInfoForm;
