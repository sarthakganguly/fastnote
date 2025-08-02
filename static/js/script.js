// static/js/script.js (Final Version without Search Button)

document.addEventListener('DOMContentLoaded', function() {
    // --- Global State & DOM Elements ---
    let ALL_TAGS = [];
    const body = document.body;
    const themeToggle = document.getElementById('checkbox');
    const searchInput = document.getElementById('search-input');
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

    const generateColorFromString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 70%)`;
    };

    const getTextColorForBg = (color) => {
        if (color.startsWith('hsl')) {
            const lightness = parseInt(color.match(/(\d+)%\)/)[1]);
            return lightness > 55 ? 'dark-text' : 'light-text';
        }
        return 'dark-text';
    };

    const renderNoteList = (notes) => {
        notesList.innerHTML = '';
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

    const performSearch = async (query = '') => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const notes = await response.json();
            renderNoteList(notes);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

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

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
            suggestionsBox.style.display = 'none';
            return;
        }
        const query = searchInput.value;
        performSearch(query);
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

    newNoteBtn.addEventListener('click', showEditorForNewNote);

    notesList.addEventListener('click', async (e) => {
        const target = e.target;
        const listItem = target.closest('li');
        if (!listItem) return;
        const noteId = listItem.dataset.id;
        if (target.matches('.note-info') || target.matches('.note-title')) {
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

    const initialize = async () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        try {
            const response = await fetch('/api/tags');
            ALL_TAGS = await response.json();
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        }
        await performSearch();
        showEditorForNewNote();
    };

    initialize();
});