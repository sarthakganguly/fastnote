import React from 'react';

// Simple SVG icons for note types
const MarkdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const CanvasIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);


const NoteItem = ({ note, isActive, setActiveNote, handleDeleteNote }) => {

    const handleDelete = (e) => {
        // Stop the click from bubbling up to the parent div,
        // which would otherwise trigger setActiveNote.
        e.stopPropagation();
        
        if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
            handleDeleteNote(note.id);
        }
    };

    const itemClasses = `
        flex items-center justify-between p-3 cursor-pointer border-l-4
        ${isActive
            ? 'bg-indigo-100 dark:bg-gray-700 border-indigo-500'
            : 'border-transparent hover:bg-gray-200 dark:hover:bg-gray-700/50'
        }
    `;

    return (
        <li
            className={itemClasses}
            onClick={() => setActiveNote(note.id)}
        >
            <div className="flex items-center overflow-hidden">
                {note.type === 'markdown' ? <MarkdownIcon /> : <CanvasIcon />}
                <span className="font-medium truncate text-sm text-gray-800 dark:text-gray-200">
                    {note.title || 'Untitled Note'}
                </span>
            </div>
            <button
                onClick={handleDelete}
                className="ml-2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Delete note"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </li>
    );
};

export default NoteItem;