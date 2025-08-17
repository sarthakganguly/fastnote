import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';

const MarkdownEditor = ({ activeNote, onUpdateNote }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // This hook runs when the user clicks on a different note.
    // It resets the component's internal state to match the new note's data.
    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
            setContent(activeNote.content);
        }
    }, [activeNote]);

    // This is the debounced autosave hook.
    useEffect(() => {
        // Prevent saving when the component first loads or if nothing has changed.
        if (content === activeNote?.content && title === activeNote?.title) {
            return;
        }

        const handler = setTimeout(() => {
            onUpdateNote({
                ...activeNote,
                title,
                content,
            });
        }, 1000); // Save after 1 second of inactivity

        // This cleanup function runs if the user types again before the timeout finishes.
        return () => clearTimeout(handler);

    }, [title, content, activeNote, onUpdateNote]);

    if (!activeNote) {
        return <div className="p-4">Error: No active note.</div>;
    }

    // Get the current theme from the root <html> element for the editor.
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    
    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Title Input */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full text-2xl font-bold bg-transparent focus:outline-none text-gray-900 dark:text-white"
                />
            </div>

            {/* Markdown Editor */}
            <div className="flex-grow h-full" data-color-mode={currentTheme}>
                <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    height="100%"
                    preview="live"
                    className="markdown-editor"
                    style={{ border: 'none', borderRadius: 0 }}
                />
            </div>
        </div>
    );
};

export default MarkdownEditor;