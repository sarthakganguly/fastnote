import React from 'react';

const WelcomeScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-gray-100 dark:bg-gray-900">
            <div className="p-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                    Welcome to Fastnote
                </h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                    Select a note from the list on the left to start editing,
                    <br />
                    or create a new Markdown note or Canvas to begin.
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;