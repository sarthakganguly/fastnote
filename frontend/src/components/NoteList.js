import React from 'react';
import NoteItem from './NoteItem'; 

const NoteList = ({
    notes,
    activeNoteId,
    setActiveNote,
    handleCreateNote,
    handleDeleteNote,
    searchTerm,
    setSearchTerm,
    hasMore,      // <-- NEW PROP
    onLoadMore    // <-- NEW PROP
}) => {

    const handleNewNote = (type) => {
        handleCreateNote(type);
    };

    return (
        <aside className="w-full sm:w-80 lg:w-96 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => handleNewNote('markdown')}
                        className="w-1/2 mr-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                        + Markdown
                    </button>
                    <button
                        onClick={() => handleNewNote('excalidraw')}
                        className="w-1/2 ml-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800"
                    >
                        + Canvas
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-grow p-2">
                {notes && notes.length > 0 ? (
                    <>
                        <ul>
                            {notes.map((note) => (
                                <NoteItem
                                    key={note.id}
                                    note={note}
                                    isActive={note.id === activeNoteId}
                                    setActiveNote={setActiveNote}
                                    handleDeleteNote={handleDeleteNote}
                                />
                            ))}
                        </ul>
                        {/* --- NEW: Load More Button --- */}
                        {hasMore && (
                            <button 
                                onClick={onLoadMore}
                                className="w-full mt-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-gray-700 transition-colors"
                            >
                                Load More Notes...
                            </button>
                        )}
                    </>
                ) : (
                    <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                        No notes found.
                    </p>
                )}
            </div>
        </aside>
    );
};

export default NoteList;