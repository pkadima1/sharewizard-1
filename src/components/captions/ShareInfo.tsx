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
          <p className="font-medium text-blue-800 dark:text-blue-300">About Sharing {isVideo ? 'Videos' : 'Images'}</p>
          <p className="mt-1 text-blue-700 dark:text-blue-200">
            {isVideo ? (
              <>
                Browsers require that sharing happens immediately after you click the share button. 
                Since video processing takes time, we use a two-step approach:
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Click share to prepare your video</li>
                  <li>When ready, click "Share Now" to share directly from your device</li>
                </ol>
              </>
            ) : (
              <>
                For the best sharing experience, click the Share button and then:
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Wait for your content to be prepared</li>
                  <li>Click "Share Now" to open your device's native sharing options</li>
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
