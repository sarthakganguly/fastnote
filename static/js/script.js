document.addEventListener('DOMContentLoaded', function() {
    // --- Global State & DOM Elements ---
    let ALL_TAGS = [];
    const body = document.body;
    const themeToggle = document.getElementById('checkbox');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsBox = document.getElementById('suggestions-box');
    const notesList = document.getElementById('notes-list');
    const noteView = document.getElementById('note-view');
    const noteEditor = document.getElementById('note-editor');
    const noteForm = document.getElementById('note-form');
    const newNoteBtn = document.getElementById('new-note-btn');
    const tagsInput = document.getElementById('tags');
    const markdownInput = document.getElementById('markdown-input');
    const editorTitle = document.getElementById('editor-title');
    let currentNoteId = null;

    // --- Helper Functions ---

    /**
     * Generates a stable, visually pleasing color from a string (e.g., a tag name).
     * @param {string} str - The input string.
     * @returns {string} An HSL color code.
     */
    const generateColorFromString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 70%)`;
    };

    /**
     * Determines if a background color is light or dark to choose contrasting text.
     * @param {string} color - An HSL color string.
     * @returns {string} 'light-text' or 'dark-text' class name.
     */
    const getTextColorForBg = (color) => {
        if (color.startsWith('hsl')) {
            const lightness = parseInt(color.match(/(\d+)%\)/)[1]);
            return lightness > 55 ? 'dark-text' : 'light-text';
        }
        return 'dark-text'; // Default for non-HSL colors
    };

    /**
     * Renders a list of notes to the left panel.
     * @param {Array} notes - Array of note objects from the API.
     */
    const renderNoteList = (notes) => {
        notesList.innerHTML = ''; // Clear current list
        notes.forEach(note => {
            const li = document.createElement('li');
            li.dataset.id = note.id;

            const tagsHTML = (note.tags || '')
                .split(',')
                .filter(Boolean)
                .map(tag => {
                    const cleanTag = tag.trim();
                    const bgColor = generateColorFromString(cleanTag);
                    const textColorClass = getTextColorForBg(bgColor);
                    return `<span class="tag-badge ${textColorClass}" style="background-color: ${bgColor};" data-tag="${cleanTag}">#${cleanTag}</span>`;
                })
                .join('');

            li.innerHTML = `
                <div class="note-info">
                    <span class="note-title">${note.title}</span>
                    <div class="note-tags">${tagsHTML}</div>
                </div>
                <div class="note-actions">
                    <button class="btn-action btn-edit" data-id="${note.id}" title="Edit note">✎</button>
                    <button class="btn-action btn-delete" data-id="${note.id}" title="Delete note">✖</button>
                </div>
            `;
            notesList.appendChild(li);
        });
    };

    /**
     * Fetches notes from the server based on a search query and renders them.
     * @param {string} query - The search query.
     */
    const performSearch = async (query = '') => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const notes = await response.json();
            renderNoteList(notes);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    // --- Core Functionality ---

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    const setActiveNote = (noteId) => {
        document.querySelectorAll('#notes-list li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.id == noteId) {
                li.classList.add('active');
            }
        });
    };

    const showEditorForNewNote = () => {
        currentNoteId = null;
        noteForm.action = '/new_note';
        tagsInput.value = '';
        markdownInput.value = '';
        editorTitle.innerText = 'Create a New Note';

        noteView.style.display = 'none';
        noteEditor.style.display = 'block';
        setActiveNote(null);
        markdownInput.focus();
    };

    // --- Event Handlers ---

    // Theme Toggling
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Search Button Click
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    // Search Input Actions (Live Search & Suggestions)
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
            suggestionsBox.style.display = 'none';
            return;
        }

        const query = searchInput.value;
        performSearch(query); // Live search

        const lastWord = query.split(/[\s,]+/).pop();
        if (lastWord.startsWith('#') && lastWord.length > 1) {
            const tagQuery = lastWord.substring(1).toLowerCase();
            const matchingTags = ALL_TAGS.filter(t => t.toLowerCase().startsWith(tagQuery));
            renderSuggestions(matchingTags);
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    suggestionsBox.addEventListener('click', (e) => {
        if (e.target.matches('.suggestion-item')) {
            const parts = searchInput.value.split(/[\s,]+/);
            parts.pop();
            parts.push(`#${e.target.dataset.tag} `);
            searchInput.value = parts.join(' ');
            suggestionsBox.style.display = 'none';
            searchInput.focus();
            performSearch(searchInput.value);
        }
    });

    const renderSuggestions = (tags) => {
        if (tags.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }
        suggestionsBox.innerHTML = tags
            .map(tag => `<div class="suggestion-item" data-tag="${tag}">#${tag}</div>`)
            .join('');
        suggestionsBox.style.display = 'block';
    };

    // New Note Button
    newNoteBtn.addEventListener('click', showEditorForNewNote);

    // Event Delegation for all actions on the notes list
    notesList.addEventListener('click', async (e) => {
        const target = e.target;
        const listItem = target.closest('li');
        if (!listItem) return;

        const noteId = listItem.dataset.id;

        if (target.matches('.note-title')) {
            const response = await fetch(`/note/${noteId}`);
            const data = await response.json();
            noteView.innerHTML = data.html_content;
            noteEditor.style.display = 'none';
            noteView.style.display = 'block';
            setActiveNote(noteId);
        } else if (target.matches('.btn-edit')) {
            const response = await fetch(`/note/${noteId}`);
            const data = await response.json();

            const formattedTags = (data.tags || '')
                .split(',')
                .filter(Boolean)
                .map(t => `#${t.trim()}`)
                .join(', ');

            noteForm.action = `/edit_note/${noteId}`;
            editorTitle.innerText = 'Edit Note';
            tagsInput.value = formattedTags;
            markdownInput.value = data.markdown_content;
            currentNoteId = noteId;

            noteView.style.display = 'none';
            noteEditor.style.display = 'block';
            setActiveNote(noteId);
            markdownInput.focus();
        } else if (target.matches('.btn-delete')) {
            if (confirm('Are you sure you want to delete this note?')) {
                const response = await fetch(`/delete_note/${noteId}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    listItem.remove();
                    if (currentNoteId == noteId) {
                        showEditorForNewNote();
                    }
                } else {
                    alert('Error: Could not delete note.');
                }
            }
        } else if (target.matches('.tag-badge')) {
            const tag = target.dataset.tag.trim();
            searchInput.value = `#${tag} `;
            searchInput.focus();
            performSearch(searchInput.value);
        }
    });

    // --- Initialization ---
    const initialize = async () => {
        // Set theme from localStorage or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);

        // Fetch all unique tags for autosuggestion feature
        try {
            const response = await fetch('/api/tags');
            ALL_TAGS = await response.json();
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        }

        // Perform initial search to populate the note list
        await performSearch();

        // Set the right panel to the new note editor state by default
        showEditorForNewNote();
    };

    // Run the app
    initialize();
});