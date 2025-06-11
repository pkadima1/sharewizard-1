import React from 'react';

const UpgradeBanner = () => {
  return (
    <div className="bg-[#1e1e1e] text-white p-6 rounded-xl shadow-lg text-center max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2">🎁 You've Used Your 3 Free Captions</h2>
      <p className="text-sm text-gray-300 mb-1">But you're just getting started…</p>

      <ul className="text-left text-gray-100 mt-4 mb-4 space-y-2 list-disc list-inside">
        <li><strong>Includes 5 Bonus Requests</strong> with 5-Day Free Trial</li>
        <li><strong>Basic Monthly Plan:</strong> Only $8.00/month</li>
        <li>70 requests/month — cancel anytime</li>
      </ul>

      <p className="text-xs text-gray-400 mb-4">
        🎯 Start with our <strong>5-day free trial</strong> — includes 5 bonus requests
      </p>

      <a
        href="https://engageperfect.com/pricing?plan=basic_monthly"
        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-semibold text-base"
      >
        Start Free Trial for $8.00/month →
      </a>
    </div>
  );
};

export default UpgradeBanner; 