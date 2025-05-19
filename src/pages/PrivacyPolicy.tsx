import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">EngagePerfect – Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-6">Last updated: 14 May 2025</p>
      
      <p className="mb-6">
        This Privacy Policy explains how NodeMatics Ltd ("EngagePerfect", "we", "our") collects, uses, shares and protects your personal data when you visit engageperfect.com, 
        use our web or mobile apps, or otherwise interact with our services.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">1. Who is the Data Controller?</h2>
      <p className="mb-4">
        NodeMatics Ltd, registered in England & Wales (company no. 14190750) with its registered office at [address], is the data controller for all personal data processed through EngagePerfect.<br />
        Contact: support@engageperfect.com
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">2. What Personal Data We Collect</h2>
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Category</th>
              <th className="border border-gray-300 px-4 py-2">Examples</th>
              <th className="border border-gray-300 px-4 py-2">Collected When</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Account Data</td>
              <td className="border border-gray-300 px-4 py-2">Name, email, hashed password, Google UID (if you sign-in with Google)</td>
              <td className="border border-gray-300 px-4 py-2">Sign-up / login</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Subscription & Billing</td>
              <td className="border border-gray-300 px-4 py-2">Stripe customer ID, plan type, last 4 digits of card, VAT number (if provided)</td>
              <td className="border border-gray-300 px-4 py-2">Checkout / billing</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Content & Usage</td>
              <td className="border border-gray-300 px-4 py-2">Captions generated, tone/platform choices, upload metadata, feature clicks, session duration, IP address</td>
              <td className="border border-gray-300 px-4 py-2">Using the app</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Device & Technical</td>
              <td className="border border-gray-300 px-4 py-2">Browser, OS, device type, referring URL, cookies, local storage IDs</td>
              <td className="border border-gray-300 px-4 py-2">Visiting the site/app</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Support</td>
              <td className="border border-gray-300 px-4 py-2">Messages, attachments, contact details</td>
              <td className="border border-gray-300 px-4 py-2">When you e-mail or chat with us</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p className="mb-4">
        We do not intentionally collect special-category data (e.g., health, political views) and ask that you do not include such information in content you submit.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">3. Legal Bases for Processing (GDPR Art. 6)</h2>
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Purpose</th>
              <th className="border border-gray-300 px-4 py-2">Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Create & maintain your account</td>
              <td className="border border-gray-300 px-4 py-2">Contract (Art. 6 (1)(b))</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Provide caption generation & analytics</td>
              <td className="border border-gray-300 px-4 py-2">Contract</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Process payments & prevent fraud</td>
              <td className="border border-gray-300 px-4 py-2">Contract; Legitimate Interest</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Product improvement & analytics</td>
              <td className="border border-gray-300 px-4 py-2">Legitimate Interest</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Marketing e-mails (news, offers)</td>
              <td className="border border-gray-300 px-4 py-2">Consent (you may opt-out any time)</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Comply with legal obligations (tax, accounting)</td>
              <td className="border border-gray-300 px-4 py-2">Legal Obligation (Art. 6 (1)(c))</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">4. How We Use Your Data</h2>
      <ul className="list-disc pl-8 mb-4">
        <li>Authenticate you and keep your session secure</li>
        <li>Generate AI captions and other content tailored to your inputs</li>
        <li>Show usage statistics, remaining requests and billing status</li>
        <li>Improve features via aggregated, pseudonymised analytics</li>
        <li>Send transactional e-mails (receipts, password reset) and—only if you said yes—marketing updates</li>
        <li>Detect and prevent abuse, spam or security threats</li>
      </ul>
      <p className="mb-4">
        We never sell or rent your personal data.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">5. Who We Share Data With</h2>
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Recipient</th>
              <th className="border border-gray-300 px-4 py-2">Role</th>
              <th className="border border-gray-300 px-4 py-2">Safeguards</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Stripe Payments Europe Ltd</td>
              <td className="border border-gray-300 px-4 py-2">Payment processing & invoicing</td>
              <td className="border border-gray-300 px-4 py-2">EU servers; DPA & SCCs</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Google Firebase</td>
              <td className="border border-gray-300 px-4 py-2">Authentication, Firestore DB, hosting, analytics</td>
              <td className="border border-gray-300 px-4 py-2">EU or US; SCCs</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">OpenAI, Google Cloud AI</td>
              <td className="border border-gray-300 px-4 py-2">Caption generation & media analysis</td>
              <td className="border border-gray-300 px-4 py-2">Only prompt text and media; SCCs</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Email provider (e.g., Postmark)</td>
              <td className="border border-gray-300 px-4 py-2">Transactional e-mails</td>
              <td className="border border-gray-300 px-4 py-2">SCCs</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Professional advisors</td>
              <td className="border border-gray-300 px-4 py-2">Accounting, legal</td>
              <td className="border border-gray-300 px-4 py-2">Confidentiality agreements</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p className="mb-4">
        Transfers outside the UK/EU are protected by Standard Contractual Clauses or an adequacy decision.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">6. Cookies & Similar Technologies</h2>
      <p className="mb-2">
        We place first-party cookies and local-storage tokens to:
      </p>
      <ul className="list-disc pl-8 mb-4">
        <li>keep you logged in;</li>
        <li>remember dark/light theme;</li>
        <li>compile anonymised usage metrics via Google Analytics 4 (IP-anonymisation enabled).</li>
      </ul>
      <p className="mb-4">
        You can disable cookies in your browser; the Service may still work but some features (login persistence, analytics) will be limited.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">7. Data Retention</h2>
      <p className="mb-2">
        <strong>Active account:</strong> we keep your data until you delete your account.
      </p>
      <p className="mb-2">
        <strong>Deleted account:</strong> personal data is purged from production systems within 14 days; encrypted backups roll off after 90 days.
      </p>
      <p className="mb-4">
        <strong>Invoices & tax records:</strong> kept for 6 years (legal requirement).
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">8. Your Rights</h2>
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Right</th>
              <th className="border border-gray-300 px-4 py-2">What it Means</th>
              <th className="border border-gray-300 px-4 py-2">How to Exercise</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Access</td>
              <td className="border border-gray-300 px-4 py-2">Get a copy of the data we hold</td>
              <td className="border border-gray-300 px-4 py-2">E-mail us</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Rectification</td>
              <td className="border border-gray-300 px-4 py-2">Correct inaccurate data</td>
              <td className="border border-gray-300 px-4 py-2">Profile page or e-mail</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Erasure</td>
              <td className="border border-gray-300 px-4 py-2">"Right to be forgotten"</td>
              <td className="border border-gray-300 px-4 py-2">Delete account / e-mail</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Restrict / Object</td>
              <td className="border border-gray-300 px-4 py-2">Limit certain processing</td>
              <td className="border border-gray-300 px-4 py-2">E-mail us</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Portability</td>
              <td className="border border-gray-300 px-4 py-2">Receive data in CSV/JSON</td>
              <td className="border border-gray-300 px-4 py-2">E-mail us</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Withdraw Consent</td>
              <td className="border border-gray-300 px-4 py-2">Stop marketing e-mails</td>
              <td className="border border-gray-300 px-4 py-2">Unsubscribe link</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p className="mb-4">
        We respond within 30 days (extendable by 2 months for complex requests).
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">9. Security</h2>
      <ul className="list-disc pl-8 mb-4">
        <li>All traffic encrypted with TLS 1.2+</li>
        <li>Passwords hashed with bcrypt</li>
        <li>Principle of least privilege for staff access</li>
        <li>Continuous vulnerability scanning & regular penetration tests</li>
      </ul>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">10. Children</h2>
      <p className="mb-4">
        EngagePerfect is not directed at children under 16. We do not knowingly collect data from minors. If you believe we have, please contact us for deletion.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">11. Automated Decision-Making</h2>
      <p className="mb-4">
        Apart from usage-based request throttling (e.g., subscription limits) and AI content generation, we do not engage in profiling that produces legal or similarly significant effects on you.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">12. Changes to This Policy</h2>
      <p className="mb-4">
        We may revise this Privacy Policy from time to time. Major changes will be announced via e-mail or in-app banner at least 14 days before they take effect. The "Last updated" date at the top will always show the current version.
      </p>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">13. Contact & Complaints</h2>
      <p className="mb-2">
        Questions or concerns?<br />
        NodeMatics Ltd / EngagePerfect<br />
        Email: privacy@engageperfect.com
      </p>
      
      <p className="mb-8">
        If you are in the UK/EU and believe we have not addressed your concern, you have the right to lodge a complaint with your local supervisory authority (in the UK: the ICO).
      </p>
      
      <p className="mb-8">
        By continuing to use EngagePerfect, you acknowledge that you have read and understood this Privacy Policy.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
