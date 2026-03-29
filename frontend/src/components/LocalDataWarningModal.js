import React, { useState, useEffect } from 'react';

const LocalDataWarningModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkWarningInterval = () => {
            const lastShown = localStorage.getItem('fastnote_warning_last_shown');
            // Default to 2 hours if the env variable is missing
            const intervalHours = parseFloat(process.env.REACT_APP_DATA_WARNING_INTERVAL_HOURS || '2');
            const intervalMs = intervalHours * 60 * 60 * 1000;
            const now = Date.now();

            if (!lastShown || now - parseInt(lastShown, 10) > intervalMs) {
                setIsOpen(true);
            }
        };

        checkWarningInterval();
        
        // Keep checking every 5 minutes in case they leave the tab open all day
        const intervalId = setInterval(checkWarningInterval, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('fastnote_warning_last_shown', Date.now().toString());
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                    Your notes live in your browser
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
                    Fastnote is currently running in <strong>Offline Mode</strong>. If you clear your browser data or use Incognito mode, your notes will be permanently lost. Upgrade to Pro for automatic cloud sync, or remember to export your notes regularly.
                </p>
                <div className="flex flex-col space-y-2">
                    <button 
                        onClick={handleDismiss}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        I understand, continue working
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocalDataWarningModal;