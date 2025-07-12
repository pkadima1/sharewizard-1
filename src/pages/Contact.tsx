import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, MessageCircle, Users, Zap } from 'lucide-react';
import { createSupportEmail, sendContactEmail } from '@/lib/emailUtils';
import { toast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: t('contact.error'),
        description: t('contact.fillRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Store contact form data in Firestore first
      const contactFormData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        company: formData.company.trim() || null,
        message: formData.message.trim(),
        submittedAt: serverTimestamp(),
        source: 'contact_page',
        userAgent: navigator.userAgent,
        currentUrl: window.location.href
      };

      // Add to Firestore EngPcontactForm collection
      await addDoc(collection(db, 'EngPcontactForm'), contactFormData);

      // Also send email notification (existing functionality)
      const contactEmail = createSupportEmail(
        formData.message,
        {
          fullName: formData.fullName,
          email: formData.email,
          company: formData.company,
          formType: 'contact_page'
        }
      );

      // Override the email data with form data
      const emailData = {
        ...contactEmail,
        email: formData.email,
        subject: `Contact Form Submission from ${formData.fullName}`,
        message: `
Contact Form Submission

Name: ${formData.fullName}
Email: ${formData.email}
Company: ${formData.company || 'Not provided'}

Message:
${formData.message}

---
Submitted from: ${window.location.href}
Timestamp: ${new Date().toLocaleString()}
        `.trim()
      };

      const emailSuccess = await sendContactEmail(emailData);
      
      // Success notification with WhatsApp suggestion
      toast({
        title: "✅ " + t('contact.success'),
        description: t('contact.successWithWhatsApp'),
        duration: 8000, // Longer duration for the WhatsApp message
      });
      
      // Additional WhatsApp suggestion toast after a delay
      setTimeout(() => {
        toast({
          title: "💬 " + t('contact.whatsappSuggestion.title'),
          description: (
            <div className="flex flex-col space-y-2">
              <p>{t('contact.whatsappSuggestion.description')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://wa.me/447799936260?text=Hi%2C%20I%20need%20help%20with%20EngagePerfect', '_blank')}
                className="w-fit"
              >
                {t('contact.whatsappSuggestion.button')}
              </Button>
            </div>
          ),
          duration: 10000,
        });
      }, 3000);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        company: '',
        message: ''
      });

    } catch (error) {
      console.error('Contact form error:', error);
      
      // Check if it's a Firestore error or email error
      if (error instanceof Error && error.message.includes('firestore')) {
        toast({
          title: "❌ " + t('contact.error'),
          description: t('contact.errorMessage') + " " + t('contact.fillRequired'),
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ " + t('contact.error'), 
          description: t('contact.errorMessage'),
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('contact.getInTouch.title.get')} <span className="text-primary">{t('contact.getInTouch.title.touch')}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('contact.getInTouch.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t('contact.form.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('contact.form.fullName')}
                  </label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder={t('contact.form.fullNamePlaceholder')}
                    className="w-full"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('contact.form.emailAddress')}
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('contact.form.emailPlaceholder')}
                    className="w-full"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('contact.form.company')}
                  </label>
                  <Input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder={t('contact.form.companyPlaceholder')}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('contact.form.message')}
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t('contact.form.messagePlaceholder')}
                    className="w-full min-h-[120px] resize-none"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('contact.form.sending') : t('contact.form.sendMessage')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('contact.info.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
               {/* <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('contact.info.email')}
                    </p>
                    <a 
                      href="mailto:hello@nodematics.com" 
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      hello@nodematics.com
                    </a>
                  </div>
                </div>*/}

                {/* UK Office */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {t('contact.info.ukOffice')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      2, Main Court Cambrian, Main Court<br />
                      Liverpool, England, L1K 25A<br />
                    </p>
                    <p className="text-sm text-primary mt-1">
                      {t('contact.info.phone')}: <a href="tel:+447799936260" className="hover:text-primary/80">+44 7799 936260</a>
                    </p>
                  </div>
                </div>

                {/* EU Office */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {t('contact.info.euOffice')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Astra 14, 9 North Station Street<br />
                      Tallinn, Harju County 10312<br />
                    </p>
                    <p className="text-sm text-primary mt-1">
                      {t('contact.info.phone')}: <a href="tel:+37253448842" className="hover:text-primary/80">+372 5344 8842</a>
                    </p>
                  </div>
                </div>

                {/* WhatsApp Support */}
                <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mt-1">
                    <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      💬 {t('contact.info.whatsapp.title')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {t('contact.info.whatsapp.description')}
                    </p>
                    <Button
                      onClick={() => window.open('https://wa.me/447799936260?text=Hi%2C%20I%20need%20help%20with%20EngagePerfect', '_blank')}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-auto"
                      size="sm"
                    >
                      {t('contact.info.whatsapp.button')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  {t('contact.hours.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('contact.hours.mondayFriday')}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    9:00 AM - 4:00 PM GMT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('contact.hours.saturday')}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    10:00 AM - 2:00 PM GMT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('contact.hours.sunday')}
                  </span>
                  <span className="text-sm text-red-500 dark:text-red-400">
                    {t('contact.hours.closed')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Response Time Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('contact.response.title.well')} <span className="text-primary">{t('contact.response.title.quickly')}</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('contact.response.subtitle')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  &lt; {t('contact.response.times.twoHours')}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('contact.response.types.sales')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  &lt; {t('contact.response.times.fourHours')}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('contact.response.types.general')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  &lt; {t('contact.response.times.twentyFourHours')}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('contact.response.types.technical')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
