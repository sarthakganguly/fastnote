import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { db } from '../db'; // <-- Import your new local database

import Header from '../components/Header';
import NoteList from '../components/NoteList';
import MarkdownEditor from '../components/MarkdownEditor';
import ExcalidrawEditor from '../components/ExcalidrawEditor';
import WelcomeScreen from '../components/WelcomeScreen';
import LocalDataWarningModal from '../components/LocalDataWarningModal'; // <-- Import the warning modal

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const HomePage = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // UI Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const NOTES_PER_PAGE = 20;

    const api = useMemo(() => axios.create({
        baseURL: `${API_BASE_URL}/api`,
        withCredentials: true
    }), []);

    // ==========================================
    // 1. LOCAL DATA FETCHING (DEXIE)
    // ==========================================
    const loadLocalNotes = useCallback(async () => {
        try {
            // Fetch all non-deleted notes from the local browser database
            let localNotes = await db.notes
                .filter(note => note.syncStatus !== 'pending_delete')
                .reverse()
                .sortBy('updatedAt');
            
            // Apply local search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                localNotes = localNotes.filter(n => n.title.toLowerCase().includes(term));
            }

            // Apply local pagination for UI performance
            const paginatedNotes = localNotes.slice(0, page * NOTES_PER_PAGE);
            
            setNotes(paginatedNotes);
            setHasMore(localNotes.length > paginatedNotes.length);

        } catch (error) {
            console.error("Failed to load local notes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, page]);

    // Re-run fetch when search or page changes
    useEffect(() => {
        loadLocalNotes();
    }, [loadLocalNotes]);

    // Reset page to 1 when typing in the search bar
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    // ==========================================
    // 2. LOCAL CRUD OPERATIONS (Instant UI)
    // ==========================================
    const handleCreateNote = async (type) => {
        const generateUUID = () => {
            if (typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
            // Parentheses added to satisfy ESLint no-mixed-operators rule
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
            );
        };

        const newNote = {
            id: generateUUID(), 
            title: 'New Note',
            content: '',
            type: type,
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending_sync'
        };

        await db.notes.add(newNote);
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
    };

    const handleUpdateNote = async (updatedNoteData) => {
        const updatedNote = {
            ...updatedNoteData,
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending_sync' // Flagged for sync
        };

        // 1. Optimistic UI update
        setNotes(prevNotes =>
            prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
        );

        // 2. Save locally (Dexie's .put() handles Upserts automatically)
        await db.notes.put(updatedNote);
    };

    const handleDeleteNote = async (id) => {
        const note = await db.notes.get(id);
        if (!note) return;

        // If it was never synced to the cloud, we can safely delete it forever locally
        if (note.syncStatus === 'pending_sync') {
            await db.notes.delete(id);
        } else {
            // If the cloud knows about it, we must soft-delete it so the 
            // background sync worker knows to tell the cloud to delete it too.
            await db.notes.update(id, { 
                syncStatus: 'pending_delete', 
                updatedAt: new Date().toISOString() 
            });
        }

        // Remove from UI
        setNotes(prevNotes => prevNotes.filter(n => n.id !== id));
        if (activeNoteId === id) setActiveNoteId(null);
    };

    // ==========================================
    // 3. BACKGROUND CLOUD SYNC WORKER
    // ==========================================
    useEffect(() => {
        const syncWithCloud = async () => {
            // Only attempt to sync if the user is authenticated
            if (!user || !user.is_pro) {
                return; // Silently do nothing for free users
            }

            try {
                // 1. Gather all notes that need to be pushed to the cloud
                const pendingSync = await db.notes.filter(n => n.syncStatus === 'pending_sync').toArray();
                const pendingDelete = await db.notes.filter(n => n.syncStatus === 'pending_delete').toArray();

                if (pendingSync.length === 0 && pendingDelete.length === 0) {
                    return; // Nothing to do
                }

                const payload = {
                    upserts: pendingSync,
                    deletes: pendingDelete.map(n => n.id)
                };

                // 2. Send to the backend
                await api.post('/notes/sync', payload);

                // 3. If the request succeeds (user is online), update the local database
                await db.transaction('rw', db.notes, async () => {
                    // Mark upserted notes as successfully synced
                    for (const note of pendingSync) {
                        await db.notes.update(note.id, { syncStatus: 'synced' });
                    }
                    // Hard-delete the pending_delete notes locally, 
                    // since the cloud now knows they are gone.
                    for (const note of pendingDelete) {
                        await db.notes.delete(note.id);
                    }
                });
                
                console.log(`Synced ${pendingSync.length} updates and ${pendingDelete.length} deletes.`);
                
            } catch (error) {
                // If it fails (e.g., offline), we do nothing. 
                // The status remains 'pending', and it will try again in 10 seconds.
                console.log("Sync skipped (Offline or Server Error)");
            }
        };

        // Run sync immediately on mount, then every 10 seconds
        syncWithCloud();
        const interval = setInterval(syncWithCloud, 10000);
        
        return () => clearInterval(interval);
    }, [api, user]);

    // ==========================================
    // 4. RENDER LOGIC
    // ==========================================
    const activeNote = useMemo(() => notes.find(note => note.id === activeNoteId), [notes, activeNoteId]);

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
            {/* Inject the warning modal at the root of the page */}
            <LocalDataWarningModal />
            
            <Header onImport={() => {}} onExport={() => {}} /> {/* Handlers omitted for brevity */}
            
            <div className="flex flex-grow h-full overflow-hidden">
                <NoteList
                    notes={notes}
                    activeNoteId={activeNoteId}
                    setActiveNote={setActiveNoteId}
                    handleCreateNote={handleCreateNote}
                    handleDeleteNote={handleDeleteNote}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    hasMore={hasMore}
                    onLoadMore={() => setPage(p => p + 1)}
                />
                <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                    {isLoading ? <p>Loading Local Database...</p> : renderEditor()}
                </main>
            </div>
        </div>
    );
};

export default HomePage;