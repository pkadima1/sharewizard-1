import React from 'react';

const UpgradeBanner = () => {
  return (
    <div className="bg-[#1e1e1e] text-white p-6 rounded-xl shadow-lg text-center max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2">🎁 You've Used Your 3 Free Captions</h2>
      <p className="text-sm text-gray-300 mb-1">But you're just getting started…</p>

      <ul className="text-left text-gray-100 mt-4 mb-4 space-y-2 list-disc list-inside">
        <li><strong>Includes 5 Bonus Requests</strong> with 5-Day Free Trial</li>
        <li><strong>Launch Offer:</strong> First Month Just £2.99</li>
        <li>Then only £5.99/month — cancel anytime</li>
      </ul>

      <p className="text-xs text-gray-400 mb-4">
        🎯 Limited to the first <strong>1,000 users</strong> — Use code: <span className="bg-gray-700 px-2 py-1 rounded text-white font-mono">PERFECTSTART</span>
      </p>

      <a
        href="https://engageperfect.com/pricing?plan=basic_monthly"
        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-semibold text-base"
      >
        Start for £2.99 →
      </a>
    </div>
  );
};

export default UpgradeBanner; 