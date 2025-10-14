/**
 * RejectionModal.tsx - Partner Application Rejection Modal
 * 
 * Purpose: Modal for rejecting partner applications with review notes
 * Features: Required review note input, validation, confirmation
 */

import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Icons
import { XCircle, AlertTriangle, FileText } from 'lucide-react';

// Import shared types
import { PartnerApplication } from '@/types/partnerApplication';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: PartnerApplication;
  onSubmit: (reviewNote: string) => void;
  loading: boolean;
  t: any;
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  application,
  onSubmit,
  loading,
  t
}) => {
  const [reviewNote, setReviewNote] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation functions
  const validateReviewNote = (note: string): boolean => {
    return note.trim().length >= 10 && note.trim().length <= 1000;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!reviewNote.trim()) {
      newErrors.reviewNote = t('rejection.reviewNoteRequired');
    } else if (reviewNote.trim().length < 10) {
      newErrors.reviewNote = t('rejection.reviewNoteMinLength');
    } else if (reviewNote.trim().length > 1000) {
      newErrors.reviewNote = t('rejection.reviewNoteMaxLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(reviewNote.trim());
  };

  // Handle close and reset form
  const handleClose = () => {
    setReviewNote('');
    setErrors({});
    onClose();
  };

  // Character count
  const characterCount = reviewNote.length;
  const isOverLimit = characterCount > 1000;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            {t('rejection.title')}
          </DialogTitle>
          <DialogDescription>
            {t('rejection.subtitle', { name: application.displayName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Card */}
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 dark:text-red-300">
                Rejecting this application will:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                <li>• Remove partner status from the user's account</li>
                <li>• Send a notification email to the applicant</li>
                <li>• Record the rejection reason for future reference</li>
                <li>• This action cannot be undone</li>
              </ul>
            </CardContent>
          </Card>

          {/* Application Summary */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                  <p className="text-gray-600 dark:text-gray-400">{application.displayName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <p className="text-gray-600 dark:text-gray-400">{application.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Company:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {application.companyName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Submitted:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {application.createdAt.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Note Input */}
          <div className="space-y-3">
            <Label htmlFor="reviewNote" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('rejection.reviewNote')}
            </Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('rejection.reviewNoteDesc')}
            </p>
            <Textarea
              id="reviewNote"
              placeholder={t('rejection.reviewNotePlaceholder')}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className={`min-h-[120px] ${errors.reviewNote ? 'border-red-500' : ''} ${isOverLimit ? 'border-red-500' : ''}`}
              maxLength={1000}
            />
            
            {/* Character count and errors */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {errors.reviewNote && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.reviewNote}
                  </p>
                )}
              </div>
              <div className={`text-sm ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {characterCount}/1000
              </div>
            </div>

            {/* Help text */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Provide constructive feedback that explains why the application was not approved.</p>
              <p>This feedback will be shared with the applicant via email.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !reviewNote.trim() || reviewNote.trim().length < 10}
            variant="destructive"
          >
            {loading ? t('rejection.rejecting') : t('rejection.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionModal;
