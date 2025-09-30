import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Parameters for sending an email via the Trigger Email extension
 */
export interface MailParams {
  /** Email address(es) to send to */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** HTML content of the email (optional) */
  html?: string;
  /** Plain text content of the email (optional) */
  text?: string;
  /** Reply-to email address (optional) */
  replyTo?: string;
  /** CC email address(es) (optional) */
  cc?: string | string[];
  /** BCC email address(es) (optional) */
  bcc?: string | string[];
  /** Locale for internationalization (optional) */
  locale?: string;
  /** Template data for dynamic content (optional) */
  data?: Record<string, any>;
}

/**
 * Sends an email by writing to the Firestore mail collection
 * The Trigger Email extension will process this document and send the actual email
 * 
 * @param params - Email parameters including recipient, subject, and content
 * @returns Promise<string> - The ID of the created mail document for traceability
 * 
 * @example
 * ```typescript
 * const mailId = await sendMail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<p>Hello {{name}}!</p>',
 *   text: 'Hello {{name}}!',
 *   data: { name: 'John' }
 * });
 * ```
 */
export async function sendMail(params: MailParams): Promise<string> {
  // Validate required fields
  if (!params.to || (Array.isArray(params.to) && params.to.length === 0)) {
    throw new Error('Email recipient (to) is required');
  }
  
  if (!params.subject || params.subject.trim() === '') {
    throw new Error('Email subject is required');
  }
  
  if (!params.html && !params.text) {
    throw new Error('Either HTML or text content is required');
  }

  // Prepare the mail document
  const mailDoc = {
    to: params.to,
    replyTo: params.replyTo,
    cc: params.cc,
    bcc: params.bcc,
    message: {
      subject: params.subject,
      html: params.html,
      text: params.text
    },
    locale: params.locale,
    data: params.data,
    createdAt: new Date()
  };

  try {
    // Add document to mail collection
    const docRef = await db.collection('mail').add(mailDoc);
    
    // Log for traceability
    console.log(`📧 Email queued for sending: ${docRef.id}`, {
      to: params.to,
      subject: params.subject,
      locale: params.locale
    });
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to queue email:', error);
    throw new Error(`Failed to queue email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
