import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { useTranslation } from 'react-i18next';

const ForgotPassword: React.FC = () => {  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = t('auth:errors.requiredField');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth:errors.invalidEmail');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {      await resetPassword(email);
      setMessage(t('auth:forgotPassword.success', 'Check your email for password reset instructions'));
      toast({
        title: t('auth:forgotPassword.emailSent', 'Email sent'),
        description: t('auth:forgotPassword.success', 'Check your email for password reset instructions'),
        variant: "default",
      });
    } catch (error: any) {      let errorMessage = t('auth:forgotPassword.failed', 'Failed to reset password.');
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth:forgotPassword.noAccount', 'No account found with this email address.');
      }
      setMessage('');
      toast({
        title: t('common:error', 'Error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
          <div className="w-full max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <img 
                src="/lovable-uploads/23327aae-0892-407a-a483-66a3aff1f9e7.png" 
                alt="AI Star" 
                className="w-16 h-16 mb-4"
              />              <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{t('auth:forgotPassword.title')}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('auth:forgotPassword.enterEmail', 'Enter your email address and we\'ll send you a link to reset your password.')}
              </p>
            </div>

            <div className="mt-8">
              {message && (
                <div className="mb-4 p-4 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  <p>{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth:forgotPassword.email')}
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}                      className="block w-full pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      placeholder={t('auth:forgotPassword.email')}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <button
                    type="submit"
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-900"
                    disabled={loading}
                  >
                    {loading ? t('auth:sending', 'Sending...') : t('auth:forgotPassword.submit')}
                  </button>
                </div>
              </form>              <div className="mt-6 text-center">
                <Link to="/login" className="font-medium text-primary hover:text-primary/90">
                  {t('auth:forgotPassword.backToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex-1 hidden w-0 lg:block">
          <div className="absolute inset-0 object-cover w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
            <div className="text-center text-white p-8 max-w-md">              <h1 className="text-5xl font-bold mb-6">{t('auth:forgotPassword.title')}</h1>
              <p className="text-xl mb-8">{t('auth:forgotPassword.enterEmail')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
