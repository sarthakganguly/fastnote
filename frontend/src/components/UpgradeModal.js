import React, { useState } from 'react';
import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const UpgradeModal = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleStartTrial = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/payments/create-checkout`, {}, { withCredentials: true });
            // Redirect the user's browser to the secure Dodo Payments hosted checkout
            window.location.href = response.data.checkout_url;
        } catch (error) {
            console.error("Failed to initialize checkout", error);
            alert("Unable to start checkout process. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 relative">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                </div>
                
                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Enable Cloud Sync
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
                    Never lose a note again. Upgrade to Fastnote Pro to automatically synchronize your markdown and canvas files across all your devices securely.
                </p>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6 border border-indigo-100 dark:border-indigo-800/30 text-center">
                    <p className="font-bold text-indigo-900 dark:text-indigo-100">
                        Start your 7-day free trial today.
                    </p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                        Followed by a simple, one-time payment. No recurring subscriptions.
                    </p>
                </div>

                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={handleStartTrial}
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : "Start Free Trial"}
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;