import React, { useState } from 'react'; // ADDED: useState
import { useAuth } from '../App';
import ThemeToggle from './ThemeToggle';
import UpgradeModal from './UpgradeModal'; // ADDED: Import the modal

const Header = ({ onImport, onExport }) => { 
    const { user, logout } = useAuth();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // ADDED: State for modal

    const handleImportClick = () => {
        document.getElementById('import-input').click();
    };

    return (
        <>
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md flex items-center justify-between px-4 sm:px-6 h-16 z-10">
                {/* Left Side: App Title */}
                <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Fastnote
                    </h1>
                    {/* ADDED: Conditional Pro Badge */}
                    {user?.is_pro && (
                        <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md shadow-sm">
                            PRO
                        </span>
                    )}
                </div>

                {/* Right Side: Controls */}
                <div className="flex items-center space-x-4">
                    <ThemeToggle />

                    <div className="hidden sm:flex items-center space-x-4">
                         <button
                            onClick={handleImportClick}
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                            Import
                        </button>
                        <input
                            id="import-input"
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={onImport}
                        />
                        <button
                            onClick={onExport}
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                            Export
                        </button>
                    </div>

                    {/* User Info and Logout */}
                    <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-4 ml-2 space-x-4">
                        <span className="hidden sm:inline-block text-sm text-gray-600 dark:text-gray-300">
                            {user?.username || 'User'}
                        </span>
                        
                        {/* ADDED: Upgrade Button for Free Users */}
                        {!user?.is_pro && (
                            <button
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="hidden md:flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                Enable Sync
                            </button>
                        )}

                        <button
                            onClick={logout}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* ADDED: Mount the Modal */}
            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
            />
        </>
    );
};

export default Header;