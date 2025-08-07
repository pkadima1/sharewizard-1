/**
 * Email utility functions for sending contact and support emails
 */

export interface ContactEmail {
  name?: string;
  email: string;
  subject: string;
  message: string;
  userAgent?: string;
  currentPage?: string;
}

/**
 * Sends a contact email via EmailJS or another email service
 * For production use, integrate with EmailJS, SendGrid, or Firebase Functions
 */
export const sendContactEmail = async (emailData: ContactEmail): Promise<boolean> => {
  try {
    const emailPayload = {
      to: 'engageperfect@gmail.com',
      from: emailData.email,
      subject: emailData.subject,
      message: emailData.message,
      userAgent: emailData.userAgent,
      currentPage: emailData.currentPage,
      timestamp: new Date().toISOString()
    };

    // Log the email data for development
    console.log('📧 Contact Email to be sent:', emailPayload);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace with actual email service integration
    // Example with EmailJS:
    // const result = await emailjs.send(
    //   'your_service_id',
    //   'your_template_id',
    //   {
    //     to_email: 'engageperfect@gmail.com',
    //     from_email: emailData.email,
    //     subject: emailData.subject,
    //     message: emailData.message,
    //     user_agent: emailData.userAgent,
    //     current_page: emailData.currentPage
    //   },
    //   'your_public_key'
    // );
    
    // Example with Firebase Functions:
    // const sendEmail = httpsCallable(functions, 'sendContactEmail');
    // const result = await sendEmail(emailPayload);

    // For development, always return success after logging
    console.log('✅ Email would be sent to engageperfect@gmail.com');
    return true;
  } catch (error) {
    console.error('❌ Failed to send contact email:', error);
    return false;
  }
};

/**
 * Formats a support contact email with standard template
 */
export const createSupportEmail = (userMessage?: string, context?: any): ContactEmail => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  return {
    email: 'user@example.com', // This should be replaced with actual user email if available
    subject: 'ShareWizard Support Request',
    message: `
Support Request from ShareWizard Application

User Message: ${userMessage || 'No specific message provided'}

Context Information:
- Current Page: ${currentUrl}
- User Agent: ${userAgent}
- Timestamp: ${new Date().toLocaleString()}
- Context Data: ${context ? JSON.stringify(context, null, 2) : 'No additional context'}

Please respond to this support request as soon as possible.
    `.trim(),
    userAgent,
    currentPage: currentUrl
  };
};
