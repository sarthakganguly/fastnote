import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

// Import all the components we've built
import Header from '../components/Header';
import NoteList from '../components/NoteList';
import MarkdownEditor from '../components/MarkdownEditor';
import ExcalidrawEditor from '../components/ExcalidrawEditor';
import WelcomeScreen from '../components/WelcomeScreen';

const HomePage = () => {
    const { token, logout } = useAuth();
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Memoize the Axios instance to prevent re-creation on re-renders
    const api = useMemo(() => axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
    }), [token]);

    // --- Data Fetching ---
    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/notes/');
            setNotes(response.data);
        } catch (error) {
            console.error("Failed to fetch notes:", error);
            if (error.response?.status === 401) logout();
        } finally {
            setIsLoading(false);
        }
    }, [api, logout]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // --- Note Handlers ---
    const handleCreateNote = async (type) => {
        try {
            const response = await api.post('/notes/', {
                title: 'New Note',
                type: type,
            });
            const newNote = response.data;
            setNotes(prevNotes => [newNote, ...prevNotes]);
            setActiveNoteId(newNote.id);
        } catch (error) {
            console.error('Failed to create note:', error);
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


    // --- Derived State for Rendering ---
    const filteredNotes = useMemo(() =>
        notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase())
        ), [notes, searchTerm]);

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
                    notes={filteredNotes}
                    activeNoteId={activeNoteId}
                    setActiveNote={setActiveNoteId}
                    handleCreateNote={handleCreateNote}
                    handleDeleteNote={handleDeleteNote}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
                <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                    {isLoading ? <p>Loading...</p> : renderEditor()}
                </main>
            </div>
        </div>
    );
};

export default HomePage;