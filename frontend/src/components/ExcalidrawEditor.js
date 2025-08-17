import React, { useState, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

const ExcalidrawEditor = ({ activeNote, onUpdateNote }) => {
    const [title, setTitle] = useState('');
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Update the component's title state when the active note changes
    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
        }
    }, [activeNote]);
    
    // Debounced effect for saving title changes
    useEffect(() => {
        if (title === activeNote?.title) return;

        const handler = setTimeout(() => {
            onUpdateNote({ ...activeNote, title });
        }, 1000); // 1 second delay

        return () => clearTimeout(handler);
    }, [title, activeNote, onUpdateNote]);

    // Load scene data into Excalidraw when the active note or the API is ready
    useEffect(() => {
        if (excalidrawAPI && activeNote?.content) {
            try {
                const sceneData = JSON.parse(activeNote.content);
                if (sceneData.elements && Array.isArray(sceneData.elements)) {
                    excalidrawAPI.updateScene(sceneData);
                }
            } catch (error) {
                console.error("Failed to parse or load Excalidraw content:", error);
                // Clear the scene if the saved data is corrupt
                excalidrawAPI.updateScene({ elements: [], appState: {} });
            }
        }
    }, [excalidrawAPI, activeNote]);

    // Debounced change handler for autosaving the canvas content
    const handleCanvasChange = useCallback((elements, appState) => {
        // A simple debouncer implemented with a global timeout handle
        if (window.canvasSaveTimeout) {
            clearTimeout(window.canvasSaveTimeout);
        }

        window.canvasSaveTimeout = setTimeout(() => {
            const contentString = JSON.stringify({ elements, appState });
            // Only save if content has actually changed to avoid unnecessary updates
            if (contentString !== activeNote?.content) {
                onUpdateNote({
                    ...activeNote,
                    content: contentString,
                });
            }
        }, 1500); // Use a slightly longer delay for the canvas
    }, [activeNote, onUpdateNote]);

    // Effect to watch for theme changes and update the Excalidraw canvas theme
    useEffect(() => {
        const updateTheme = () => {
            const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            setTheme(currentTheme);
        };
        updateTheme(); // Set initial theme
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    if (!activeNote) return null;

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
            {/* --- Title Input --- */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Canvas Title"
                    className="w-full text-2xl font-bold bg-transparent focus:outline-none text-gray-900 dark:text-white"
                />
            </div>

            {/* --- Excalidraw Canvas --- */}
            <div className="flex-grow h-full w-full">
                <Excalidraw
                    excalidrawAPI={setExcalidrawAPI}
                    initialData={null} // Data is loaded via the useEffect hook
                    onChange={handleCanvasChange}
                    theme={theme}
                    UIOptions={{ canvasActions: { loadScene: false } }} // Disable the library's native "load" button
                />
            </div>
        </div>
    );
};

export default ExcalidrawEditor;