import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import UpgradeBanner from '../UpgradeBanner';
import { useAuth } from '@/contexts/AuthContext';

interface ErrorDisplayProps {
  error: string;
  onTryAgainClick: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onTryAgainClick
}) => {
  const handleTryAgain = () => {
    toast.info("Tentative de génération des légendes à nouveau...");
    onTryAgainClick();
  };

  // Check if the error is CORS related
  const isCorsError = error.toLowerCase().includes('cors') || error.toLowerCase().includes('connection');

  // Show UpgradeBanner if the error is about free requests limit
  const isFreeLimitError = error && error.toLowerCase().includes('used all your free requests');
  // TODO: Replace the following with a real check for paid plan if available
  const { userProfile } = useAuth();
  const hasPaidPlan = userProfile && ['basicMonth', 'basicYear', 'flexy', 'trial'].includes(userProfile.plan_type);

  if (isFreeLimitError && !hasPaidPlan) {
    return <UpgradeBanner />;
  }

  // Fallback to the old error display for other errors
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-adaptive-primary mb-2">Échec de la Génération</h3>
      <p className="text-adaptive-secondary mb-4 max-w-md">{error}</p>
      {isCorsError && (
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de Connexion</AlertTitle>
          <AlertDescription>
            Cela se produit souvent en raison des paramètres de sécurité du navigateur. Essayez d'utiliser un navigateur différent ou actualisez la page.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Actualiser la Page
        </Button>
        <Button
          onClick={handleTryAgain}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
