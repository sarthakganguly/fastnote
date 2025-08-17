import React, { useState, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

const ExcalidrawEditor = ({ activeNote, onUpdateNote }) => {
    const [title, setTitle] = useState('');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
        }
    }, [activeNote]);

    useEffect(() => {
        if (title === activeNote?.title) return;
        const handler = setTimeout(() => {
            onUpdateNote({ ...activeNote, title });
        }, 1000);
        return () => clearTimeout(handler);
    }, [title, activeNote, onUpdateNote]);

    const handleCanvasChange = useCallback((elements, appState) => {
        if (window.canvasSaveTimeout) {
            clearTimeout(window.canvasSaveTimeout);
        }
        window.canvasSaveTimeout = setTimeout(() => {
            const contentString = JSON.stringify({ elements, appState });
            onUpdateNote({
                ...activeNote,
                content: contentString,
            });
        }, 1500);
    }, [activeNote, onUpdateNote]);

    useEffect(() => {
        const updateTheme = () => {
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            setTheme(currentTheme);
        };
        updateTheme();
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    if (!activeNote) return null;

    const getInitialData = () => {
        if (!activeNote.content) return null;
        try {
            return JSON.parse(activeNote.content);
        } catch (error) {
            console.error("Could not parse Excalidraw scene data.", error);
            return null;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Canvas Title"
                    className="w-full text-2xl font-bold bg-transparent focus:outline-none text-gray-900 dark:text-white"
                />
            </div>
            <div className="flex-grow h-full w-full">
                <Excalidraw
                    key={activeNote.id}
                    initialData={getInitialData()}
                    onChange={handleCanvasChange}
                    theme={theme}
                />
            </div>
        </div>
    );
};

export default ExcalidrawEditor;