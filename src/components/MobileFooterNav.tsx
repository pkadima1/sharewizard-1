import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, User, Settings, Menu, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MobileFooterNav: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex justify-between items-center px-6 py-3">
        <Link to="/" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/caption-generator" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
          <Search size={20} />
          <span className="text-xs mt-1">{t('wizard.generateShort')}</span>
        </Link>
        
        <Link to="/partner-registration" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
          <Users size={20} />
          <span className="text-xs mt-1">{t('nav.becomePartner')}</span>
        </Link>
        
        {/*<Link to="/dashboard" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
          <Settings size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>*/}
        
        <Link to="/profile" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
          <User size={20} />
          <span className="text-xs mt-1">{t('nav.profile')}</span>
        </Link>
        
        <button className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary" aria-label="More options">
          <Menu size={20} />
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </div>
  );
};

export default MobileFooterNav;
