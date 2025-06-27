import React from 'react';

const UpgradeBanner = () => {
  return (
    <div className="bg-[#1e1e1e] text-white p-6 rounded-xl shadow-lg text-center max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-2">🎁 Vous Avez Utilisé Vos 3 Légendes Gratuites</h2>
      <p className="text-sm text-gray-300 mb-1">Mais vous ne faites que commencer…</p>

      <ul className="text-left text-gray-100 mt-4 mb-4 space-y-2 list-disc list-inside">
        <li><strong>Inclut 5 Requêtes Bonus</strong> avec l'Essai Gratuit de 5 Jours</li>
        <li><strong>Plan Mensuel de Base :</strong> Seulement 8,00$/mois</li>
        <li>70 requêtes/mois — annulez à tout moment</li>
      </ul>

      <p className="text-xs text-gray-400 mb-4">
        🎯 Commencez avec notre <strong>essai gratuit de 5 jours</strong> — inclut 5 requêtes bonus
      </p>

      <a
        href="https://engageperfect.com/pricing?plan=basic_monthly"
        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-semibold text-base"
      >
        Commencer l'Essai Gratuit pour 8,00$/mois →
      </a>
    </div>
  );
};

export default UpgradeBanner; 