import { onCall, HttpsError } from "firebase-functions/v2/https";
import { sendMail } from '../lib/sendMail.js';

// Internal helper functions for use within other Cloud Functions
export async function sendPartnerApprovedEmail(params: PartnerApprovedParams): Promise<string> {
  const { email, displayName, code, origin } = params;
  
  const subject = '✅ You\'re approved — EngagePerfect Partner';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Welcome to EngagePerfect!</h2>
      
      <p>Hi <strong>${displayName}</strong>,</p>
      
      <p>Great news! Your Partner account has been <strong>approved</strong> and you're now ready to start earning commissions.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Your Partner Details:</h3>
        <p><strong>Referral Code:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${code}</code></p>
        <p><strong>Referral Link:</strong> <a href="${origin}/signup?ref=${code}" style="color: #3b82f6; text-decoration: none;">${origin}/signup?ref=${code}</a></p>
      </div>
      
      <p>Start sharing your referral link and earn commissions for every new customer you bring to EngagePerfect!</p>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Welcome aboard! 🚀</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        This email was sent from EngagePerfect Partner Program.<br>
        If you have any questions, please contact support.
      </p>
    </div>
  `;
  
  const text = `Hi ${displayName},

Great news! Your Partner account has been approved and you're now ready to start earning commissions.

Your Partner Details:
- Referral Code: ${code}
- Referral Link: ${origin}/signup?ref=${code}

Start sharing your referral link and earn commissions for every new customer you bring to EngagePerfect!

If you have any questions, feel free to reach out to our support team.

Welcome aboard!

---
This email was sent from EngagePerfect Partner Program.
If you have any questions, please contact support.`;

  const mailId = await sendMail({
    to: email,
    subject,
    html,
    text,
    replyTo: 'support@engageperfect.com',
    locale: 'en' // Default to English, can be enhanced with i18n later
  });
  
  console.log(`📧 Partner approval email sent: ${mailId} to ${email}`);
  return mailId;
}

export async function sendPartnerRejectedEmail(params: PartnerRejectedParams): Promise<string> {
  const { email, displayName, reviewNote } = params;
  
  const subject = 'Your EngagePerfect Partner application';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #374151; margin-bottom: 20px;">Application Update</h2>
      
      <p>Hi <strong>${displayName}</strong>,</p>
      
      <p>Thank you for your interest in becoming an EngagePerfect Partner and for taking the time to apply.</p>
      
      <p>After careful review of your application, we regret to inform you that we are unable to approve your partner application at this time.</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #dc2626;">Review Feedback:</h3>
        <p style="color: #7f1d1d; margin-bottom: 0;">${reviewNote}</p>
      </div>
      
      <p><strong>What's next?</strong></p>
      <ul>
        <li>You may re-apply in <strong>60 days</strong> from the date of this email</li>
        <li>Consider addressing the feedback provided above</li>
        <li>Feel free to reach out if you have any questions</li>
      </ul>
      
      <p>We appreciate your interest in EngagePerfect and wish you the best of luck in your future endeavors.</p>
      
      <p>Best regards,<br>The EngagePerfect Team</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        This email was sent from EngagePerfect Partner Program.<br>
        If you have any questions, please contact support.
      </p>
    </div>
  `;
  
  const text = `Hi ${displayName},

Thank you for your interest in becoming an EngagePerfect Partner and for taking the time to apply.

After careful review of your application, we regret to inform you that we are unable to approve your partner application at this time.

Review Feedback:
${reviewNote}

What's next?
- You may re-apply in 60 days from the date of this email
- Consider addressing the feedback provided above
- Feel free to reach out if you have any questions

We appreciate your interest in EngagePerfect and wish you the best of luck in your future endeavors.

Best regards,
The EngagePerfect Team

---
This email was sent from EngagePerfect Partner Program.
If you have any questions, please contact support.`;

  const mailId = await sendMail({
    to: email,
    subject,
    html,
    text,
    replyTo: 'support@engageperfect.com',
    locale: 'en' // Default to English, can be enhanced with i18n later
  });
  
  console.log(`📧 Partner rejection email sent: ${mailId} to ${email}`);
  return mailId;
}

/**
 * Parameters for sending partner approval notification
 */
export interface PartnerApprovedParams {
  /** Partner's email address */
  email: string;
  /** Partner's display name */
  displayName: string;
  /** Generated referral code */
  code: string;
  /** Application origin URL */
  origin: string;
}

/**
 * Parameters for sending partner rejection notification
 */
export interface PartnerRejectedParams {
  /** Partner's email address */
  email: string;
  /** Partner's display name */
  displayName: string;
  /** Review note explaining rejection */
  reviewNote: string;
}

/**
 * Sends approval notification email to a newly approved partner
 * 
 * @param params - Partner approval details
 * @returns Promise<string> - Mail document ID for traceability
 * 
 * @example
 * ```typescript
 * const mailId = await notifyPartnerApproved({
 *   email: 'partner@example.com',
 *   displayName: 'John Doe',
 *   code: 'JOHN123',
 *   origin: 'https://engageperfect.com'
 * });
 * ```
 */
export const notifyPartnerApproved = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "128MiB",
  maxInstances: 10
}, async (request): Promise<string> => {
  try {
    const params = request.data as PartnerApprovedParams;
    
    // Validate required fields
    if (!params.email || !params.displayName || !params.code || !params.origin) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: email, displayName, code, origin"
      );
    }
  const { email, displayName, code, origin } = params;
  
  const subject = '✅ You\'re approved — EngagePerfect Partner';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Welcome to EngagePerfect!</h2>
      
      <p>Hi <strong>${displayName}</strong>,</p>
      
      <p>Great news! Your Partner account has been <strong>approved</strong> and you're now ready to start earning commissions.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Your Partner Details:</h3>
        <p><strong>Referral Code:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${code}</code></p>
        <p><strong>Referral Link:</strong> <a href="${origin}/signup?ref=${code}" style="color: #3b82f6; text-decoration: none;">${origin}/signup?ref=${code}</a></p>
      </div>
      
      <p>Start sharing your referral link and earn commissions for every new customer you bring to EngagePerfect!</p>
      
      <p>If you have any questions, feel free to reach out to our support team.</p>
      
      <p>Welcome aboard! 🚀</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        This email was sent from EngagePerfect Partner Program.<br>
        If you have any questions, please contact support.
      </p>
    </div>
  `;
  
  const text = `Hi ${displayName},

Great news! Your Partner account has been approved and you're now ready to start earning commissions.

Your Partner Details:
- Referral Code: ${code}
- Referral Link: ${origin}/signup?ref=${code}

Start sharing your referral link and earn commissions for every new customer you bring to EngagePerfect!

If you have any questions, feel free to reach out to our support team.

Welcome aboard!

---
This email was sent from EngagePerfect Partner Program.
If you have any questions, please contact support.`;

    const mailId = await sendMail({
      to: email,
      subject,
      html,
      text,
      replyTo: 'support@engageperfect.com',
      locale: 'en' // Default to English, can be enhanced with i18n later
    });
    
    console.log(`📧 Partner approval email sent: ${mailId} to ${email}`);
    return mailId;
  } catch (error) {
    console.error('❌ Failed to send partner approval email:', error);
    throw new HttpsError(
      "internal",
      `Failed to send partner approval email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

/**
 * Sends rejection notification email to a partner whose application was rejected
 * 
 * @param params - Partner rejection details
 * @returns Promise<string> - Mail document ID for traceability
 * 
 * @example
 * ```typescript
 * const mailId = await notifyPartnerRejected({
 *   email: 'partner@example.com',
 *   displayName: 'John Doe',
 *   reviewNote: 'We need more experience in digital marketing'
 * });
 * ```
 */
export const notifyPartnerRejected = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "128MiB",
  maxInstances: 10
}, async (request): Promise<string> => {
  try {
    const params = request.data as PartnerRejectedParams;
    
    // Validate required fields
    if (!params.email || !params.displayName || !params.reviewNote) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: email, displayName, reviewNote"
      );
    }
  const { email, displayName, reviewNote } = params;
  
  const subject = 'Your EngagePerfect Partner application';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #374151; margin-bottom: 20px;">Application Update</h2>
      
      <p>Hi <strong>${displayName}</strong>,</p>
      
      <p>Thank you for your interest in becoming an EngagePerfect Partner and for taking the time to apply.</p>
      
      <p>After careful review of your application, we regret to inform you that we are unable to approve your partner application at this time.</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #dc2626;">Review Feedback:</h3>
        <p style="color: #7f1d1d; margin-bottom: 0;">${reviewNote}</p>
      </div>
      
      <p><strong>What's next?</strong></p>
      <ul>
        <li>You may re-apply in <strong>60 days</strong> from the date of this email</li>
        <li>Consider addressing the feedback provided above</li>
        <li>Feel free to reach out if you have any questions</li>
      </ul>
      
      <p>We appreciate your interest in EngagePerfect and wish you the best of luck in your future endeavors.</p>
      
      <p>Best regards,<br>The EngagePerfect Team</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        This email was sent from EngagePerfect Partner Program.<br>
        If you have any questions, please contact support.
      </p>
    </div>
  `;
  
  const text = `Hi ${displayName},

Thank you for your interest in becoming an EngagePerfect Partner and for taking the time to apply.

After careful review of your application, we regret to inform you that we are unable to approve your partner application at this time.

Review Feedback:
${reviewNote}

What's next?
- You may re-apply in 60 days from the date of this email
- Consider addressing the feedback provided above
- Feel free to reach out if you have any questions

We appreciate your interest in EngagePerfect and wish you the best of luck in your future endeavors.

Best regards,
The EngagePerfect Team

---
This email was sent from EngagePerfect Partner Program.
If you have any questions, please contact support.`;

    const mailId = await sendMail({
      to: email,
      subject,
      html,
      text,
      replyTo: 'support@engageperfect.com',
      locale: 'en' // Default to English, can be enhanced with i18n later
    });
    
    console.log(`📧 Partner rejection email sent: ${mailId} to ${email}`);
    return mailId;
  } catch (error) {
    console.error('❌ Failed to send partner rejection email:', error);
    throw new HttpsError(
      "internal",
      `Failed to send partner rejection email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});
