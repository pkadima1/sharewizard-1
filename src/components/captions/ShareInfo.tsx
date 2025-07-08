import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ShareInfoProps {
  isVideo: boolean;
  className?: string;
}

/**
 * Component that explains the two-step sharing process to users
 */
const ShareInfo: React.FC<ShareInfoProps> = ({ isVideo, className = '' }) => {
  return (
    <div className={`bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mt-4 text-sm ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-300">À Propos du Partage {isVideo ? 'de Vidéos' : 'd\'Images'}</p>
          <p className="mt-1 text-blue-700 dark:text-blue-200">
            {isVideo ? (
              <>
                Les navigateurs exigent que le partage se fasse immédiatement après avoir cliqué sur le bouton de partage. 
                Comme le traitement vidéo prend du temps, nous utilisons une approche en deux étapes :
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Cliquez sur partager pour préparer votre vidéo</li>
                  <li>Quand c'est prêt, cliquez sur "Partager Maintenant" pour partager directement depuis votre appareil</li>
                </ol>
              </>
            ) : (
              <>
                Pour la meilleure expérience de partage, cliquez sur le bouton Partager puis :
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Attendez que votre contenu soit préparé</li>
                  <li>Cliquez sur "Partager Maintenant" pour ouvrir les options de partage natives de votre appareil</li>
                </ol>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareInfo;
