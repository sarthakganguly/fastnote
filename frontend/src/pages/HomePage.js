import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

import Header from '../components/Header';
import NoteList from '../components/NoteList';
import MarkdownEditor from '../components/MarkdownEditor';
import ExcalidrawEditor from '../components/ExcalidrawEditor';
import WelcomeScreen from '../components/WelcomeScreen';

// 1. Safely grab the environment variable and strip off any trailing slash
// const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const HomePage = () => {
    // 2. We no longer need 'token' from useAuth, just the logout function
    const { logout } = useAuth();
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // 3. Update the custom Axios instance to use cookies instead of headers
    // 3. Update the custom Axios instance with a bulletproof base URL
    const api = useMemo(() => {
        // Grab the environment variable if it exists (useful for local development)
        let envUrl = process.env.REACT_APP_API_BASE_URL;
        
        // If it's empty, just "/", or whitespace, force it to be null
        if (!envUrl || envUrl.trim() === '' || envUrl === '/') {
            envUrl = null;
        }

        // If we have a valid env URL (like http://localhost:5000), use it. 
        // Otherwise, default to exactly '/api' (which relies perfectly on Nginx)
        const safeBaseUrl = envUrl ? `${envUrl.replace(/\/$/, '')}/api` : '/api';

        return axios.create({
            baseURL: safeBaseUrl,
            withCredentials: true // Crucial for passing the HttpOnly cookie
        });
    }, []);

    // Update fetchNotes to take page and search directly
    const fetchNotes = useCallback(async (currentPage, currentSearch) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/notes/?page=${currentPage}&search=${encodeURIComponent(currentSearch)}`);
            
            const fetchedNotes = response.data.notes;
            
            // If it's page 1, replace the list. If it's page 2+, append to the list.
            if (currentPage === 1) {
                setNotes(fetchedNotes);
            } else {
                setNotes(prev => [...prev, ...fetchedNotes]);
            }
            
            setHasMore(response.data.has_next);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
            if (error.response?.status === 401) logout();
        } finally {
            setIsLoading(false);
        }
    }, [api, logout]);

    // Fetch when page or search changes
    useEffect(() => {
        // Debounce search input to avoid hitting the backend on every keystroke
        const delayDebounceFn = setTimeout(() => {
            fetchNotes(page, searchTerm);
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(delayDebounceFn);
    }, [page, searchTerm, fetchNotes]);

    // When search term changes, ALWAYS reset to page 1
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    // --- Note Handlers ---
    const handleCreateNote = async (type) => {
        try {
            const response = await api.post('/notes/', {
                title: 'New Note',
                type: type,
                content: '' // <-- ADD THIS: Satisfies the Marshmallow requirement
            });
            const newNote = response.data;
            setNotes(prevNotes => [newNote, ...prevNotes]);
            setActiveNoteId(newNote.id);
        } catch (error) {
            console.error('Failed to create note:', error);
            // Optional: log the actual Marshmallow validation errors to the console
            if (error.response && error.response.data) {
                 console.error("Validation details:", error.response.data.errors);
            }
        }
    };

    const handleDeleteNote = async (id) => {
        try {
            await api.delete(`/notes/${id}`);
            setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
            // If the active note is the one being deleted, reset active note
            if (activeNoteId === id) {
                setActiveNoteId(null);
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const handleUpdateNote = useCallback(async (updatedNoteData) => {
        // Optimistic UI update for a snappier feel
        setNotes(prevNotes =>
            prevNotes.map(note => note.id === updatedNoteData.id ? updatedNoteData : note)
        );
        // Backend update
        try {
            // Because of Marshmallow validation (Step 4), we only send what is allowed
            await api.put(`/notes/${updatedNoteData.id}`, {
                title: updatedNoteData.title,
                content: updatedNoteData.content
            });
        } catch (error) {
            console.error('Failed to update note:', error);
            // Optionally: Revert the change or show an error
        }
    }, [api]);

    // --- Import / Export Handlers ---
    const handleExport = async () => {
        try {
            const response = await api.get('/notes/export');
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fastnote_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export notes:', error);
            alert('Could not export notes.');
        }
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);
                if (window.confirm(`Are you sure you want to import ${importedNotes.length} notes?`)) {
                    await api.post('/notes/import', importedNotes);
                    fetchNotes(); // Refresh the note list
                }
            } catch (error) {
                console.error('Failed to import notes:', error);
                alert('Import failed. Please check the file format.');
            }
        };
        reader.readAsText(file);
        // Reset file input to allow importing the same file again
        event.target.value = null;
    };


    const activeNote = useMemo(() =>
        notes.find(note => note.id === activeNoteId),
        [notes, activeNoteId]);

    // --- Render Logic ---
    const renderEditor = () => {
        if (!activeNote) return <WelcomeScreen />;
        
        switch (activeNote.type) {
            case 'markdown':
                return <MarkdownEditor activeNote={activeNote} onUpdateNote={handleUpdateNote} />;
            case 'excalidraw':
                return <ExcalidrawEditor activeNote={activeNote} onUpdateNote={handleUpdateNote} />;
            default:
                return <p>Unknown note type.</p>;
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans">
            <Header onImport={handleImport} onExport={handleExport} />
            <div className="flex flex-grow h-full overflow-hidden">
                <NoteList
                    notes={notes} // <-- Changed from filteredNotes
                    activeNoteId={activeNoteId}
                    setActiveNote={setActiveNoteId}
                    handleCreateNote={handleCreateNote}
                    handleDeleteNote={handleDeleteNote}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    hasMore={hasMore}               // <-- NEW
                    onLoadMore={() => setPage(p => p + 1)} // <-- NEW
                />
                <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                    {isLoading ? <p>Loading...</p> : renderEditor()}
                </main>
            </div>
        </div>
    );
};

export default HomePage;