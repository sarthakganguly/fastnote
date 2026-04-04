import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { db } from '../db';

import Header from '../components/Header';
import NoteList from '../components/NoteList';
import MarkdownEditor from '../components/MarkdownEditor';
import ExcalidrawEditor from '../components/ExcalidrawEditor';
import WelcomeScreen from '../components/WelcomeScreen';
import LocalDataWarningModal from '../components/LocalDataWarningModal';

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
            let localNotes = await db.notes
                .filter(note => note.syncStatus !== 'pending_delete')
                .reverse()
                .sortBy('updatedAt');
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                localNotes = localNotes.filter(n => n.title.toLowerCase().includes(term));
            }

            const paginatedNotes = localNotes.slice(0, page * NOTES_PER_PAGE);
            
            setNotes(paginatedNotes);
            setHasMore(localNotes.length > paginatedNotes.length);

        } catch (error) {
            console.error("Failed to load local notes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, page]);

    useEffect(() => {
        loadLocalNotes();
    }, [loadLocalNotes]);

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
            syncStatus: 'pending_sync'
        };

        setNotes(prevNotes =>
            prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
        );

        await db.notes.put(updatedNote);
    };

    const handleDeleteNote = async (id) => {
        const note = await db.notes.get(id);
        if (!note) return;

        if (note.syncStatus === 'pending_sync') {
            await db.notes.delete(id);
        } else {
            await db.notes.update(id, { 
                syncStatus: 'pending_delete', 
                updatedAt: new Date().toISOString() 
            });
        }

        setNotes(prevNotes => prevNotes.filter(n => n.id !== id));
        if (activeNoteId === id) setActiveNoteId(null);
    };

    // ==========================================
    // 3. BACKGROUND CLOUD SYNC WORKER
    // ==========================================
    useEffect(() => {
        const syncWithCloud = async () => {
            // ONLY sync if the user has an active or trialing subscription
            const allowedStatuses = ['active', 'trialing'];
            if (!user || !allowedStatuses.includes(user.subscription_status)) {
                return; 
            }

            try {
                const pendingSync = await db.notes.filter(n => n.syncStatus === 'pending_sync').toArray();
                const pendingDelete = await db.notes.filter(n => n.syncStatus === 'pending_delete').toArray();

                if (pendingSync.length === 0 && pendingDelete.length === 0) {
                    return; 
                }

                const payload = {
                    upserts: pendingSync,
                    deletes: pendingDelete.map(n => n.id)
                };

                await api.post('/notes/sync', payload);

                await db.transaction('rw', db.notes, async () => {
                    for (const note of pendingSync) {
                        await db.notes.update(note.id, { syncStatus: 'synced' });
                    }
                    for (const note of pendingDelete) {
                        await db.notes.delete(note.id);
                    }
                });
                
            } catch (error) {
                console.log("Sync skipped (Offline or Server Error)");
            }
        };

        syncWithCloud();
        const interval = setInterval(syncWithCloud, 10000);
        
        return () => clearInterval(interval);
    }, [api, user]);

    // ==========================================
    // CHECKOUT SUCCESS HANDLER
    // ==========================================
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('checkout') === 'success') {
            // 1. Show a nice success message to the user
            alert("🎉 Upgrade successful! Your cloud sync is now active.");
            
            // 2. Clean the URL so we don't keep triggering this if they manually refresh
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // 3. Force a full page reload. 
            // This ensures your AuthProvider hits the /api/auth/me endpoint again 
            // and grabs the new 'trialing' or 'active' subscription_status.
            window.location.reload();
        }
    }, []);

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
            <LocalDataWarningModal />
            
            <Header onImport={() => {}} onExport={() => {}} /> 

            {/* Trial Expired Banner */}
            {user?.subscription_status === 'expired' && (
                <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 p-3 text-center flex-shrink-0">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        <strong>Your trial has expired.</strong> Cloud sync is currently paused. Please update your payment method to keep your data safely backed up.
                    </p>
                </div>
            )}
            
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