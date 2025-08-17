// static/js/main.js (Final Corrected Version)

import { performSearch, getAllTags, getNoteDetails, deleteNote, saveNote, saveDiagram } from './api.js';
import { initUI, applyTheme, setActiveNote, showPanel, renderNoteList } from './ui.js';
import { mountExcalidraw, getExcalidrawAPI } from './excalidraw.js';

document.addEventListener('DOMContentLoaded', () => {
    const DOM = initUI();
    let currentNoteId = null;

    const createNewNote = () => {
        currentNoteId = null;
        DOM.editorTitle.innerText = 'Create New Note';
        DOM.tagsInput.value = '';
        DOM.markdownInput.value = '';
        setActiveNote(null);
        showPanel('noteEditor');
    };

    const createNewDiagram = () => {
        currentNoteId = null;
        DOM.diagramEditorTitle.innerText = 'Create New Diagram';
        DOM.diagramTagsInput.value = '';
        setActiveNote(null);
        mountExcalidraw({ elements: [], appState: {} });
        showPanel('diagramEditor');
    };
    
    DOM.newNoteBtn.addEventListener('click', createNewNote);
    DOM.newDiagramBtn.addEventListener('click', createNewDiagram);

    DOM.saveMarkdownBtn.addEventListener('click', async () => {
        const savedNote = await saveNote(currentNoteId, DOM.tagsInput.value, DOM.markdownInput.value);
        if (savedNote) {
            currentNoteId = savedNote.id;
            // --- THIS IS THE FIX ---
            // 1. Capture the result of the search
            const updatedNotes = await performSearch(document.getElementById('search-input').value);
            // 2. Pass it to the renderer
            renderNoteList(updatedNotes);
            setActiveNote(currentNoteId);
            DOM.editorTitle.innerText = 'Edit Note';
        }
    });

    DOM.saveDiagramBtn.addEventListener('click', async () => {
        const savedNote = await saveDiagram(currentNoteId, DOM.diagramTagsInput.value, getExcalidrawAPI());
        if (savedNote) {
            currentNoteId = savedNote.id;
            // --- THIS IS THE FIX ---
            // 1. Capture the result of the search
            const updatedNotes = await performSearch(document.getElementById('search-input').value);
            // 2. Pass it to the renderer
            renderNoteList(updatedNotes);
            setActiveNote(currentNoteId);
            DOM.diagramEditorTitle.innerText = 'Edit Diagram';
        }
    });

    DOM.notesList.addEventListener('click', async (e) => {
        const target = e.target;
        const listItem = target.closest('li');
        if (!listItem) return;
        const noteId = listItem.dataset.id;

        if (target.matches('.btn-delete')) {
            if (confirm('Are you sure you want to delete this note?')) {
                const success = await deleteNote(noteId);
                if (success) {
                    listItem.remove();
                    if (currentNoteId == noteId) showPanel(null);
                }
            }
        } else if (target.matches('.btn-edit')) {
            const note = await getNoteDetails(noteId);
            currentNoteId = note.id;
            setActiveNote(note.id);
            const formattedTags = (note.tags || '').split(',').filter(Boolean).map(t => `#${t.trim()}`).join(', ');
            if (note.note_type === 'excalidraw') {
                DOM.diagramEditorTitle.innerText = 'Edit Diagram';
                DOM.diagramTagsInput.value = formattedTags;
                const initialData = JSON.parse(note.excalidraw_json || '{}');
                mountExcalidraw(initialData);
                showPanel('diagramEditor');
            } else {
                DOM.editorTitle.innerText = 'Edit Note';
                DOM.tagsInput.value = formattedTags;
                DOM.markdownInput.value = note.markdown_content;
                showPanel('noteEditor');
            }
        } else if (target.matches('.note-info') || target.closest('.note-info')) {
            const note = await getNoteDetails(noteId);
            currentNoteId = note.id;
            setActiveNote(note.id);
            DOM.noteView.innerHTML = note.html_content;
            showPanel('noteView');
        }
    });

    DOM.themeToggle.addEventListener('change', () => {
        const newTheme = DOM.themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    const initialize = async () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        const notes = await performSearch();
        renderNoteList(notes);
        showPanel(null);
    };

    initialize();
});