import React from 'react';
import { useAuth } from '../App'; // To get user and logout function
import ThemeToggle from './ThemeToggle';

const Header = ({ onImport, onExport }) => { // <--- CORRECTED THIS LINE
    const { user, logout } = useAuth();

    // This function will trigger the hidden file input for importing notes
    const handleImportClick = () => {
        document.getElementById('import-input').click();
    };

    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md flex items-center justify-between px-4 sm:px-6 h-16 z-10">
            {/* Left Side: App Title */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Fastnote
            </h1>

            {/* Right Side: Controls */}
            <div className="flex items-center space-x-4">
                <ThemeToggle />

                {/* Import/Export buttons */}
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
                <div className="flex items-center">
                    <span className="hidden sm:inline-block text-sm text-gray-600 dark:text-gray-300 mr-4">
                        Hello, {user?.username || 'User'}
                    </span>
                    <button
                        onClick={logout}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;