// static/js/script.js (Final Corrected Version)

document.addEventListener('DOMContentLoaded', function() {
    // --- Global State & DOM Elements ---
    let ALL_TAGS = [];
    let currentNoteId = null;
    let excalidrawAPI = null;

    const body = document.body;
    const themeToggle = document.getElementById('checkbox');
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('suggestions-box');
    const notesList = document.getElementById('notes-list');
    const noteView = document.getElementById('note-view');
    const noteEditor = document.getElementById('note-editor');
    const editorTitle = document.getElementById('editor-title');
    const tagsInput = document.getElementById('tags-input');
    const markdownInput = document.getElementById('markdown-input');
    const saveMarkdownBtn = document.getElementById('save-markdown-btn');
    const diagramEditor = document.getElementById('diagram-editor');
    const diagramEditorTitle = document.getElementById('diagram-editor-title');
    const diagramTagsInput = document.getElementById('diagram-tags-input');
    const excalidrawContainer = document.getElementById('excalidraw-container');
    const saveDiagramBtn = document.getElementById('save-diagram-btn');
    const newNoteBtn = document.getElementById('new-note-btn');
    const newDiagramBtn = document.getElementById('new-diagram-btn');

    // --- Helper Functions ---
    const generateColorFromString = (str) => { let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 70%, 70%)`; };
    const getTextColorForBg = (color) => { if (color.startsWith('hsl')) { const lightness = parseInt(color.match(/(\d+)%\)/)[1]); return lightness > 55 ? 'dark-text' : 'light-text'; } return 'dark-text'; };
    const performSearch = async (query = '') => { try { const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`); const notes = await response.json(); renderNoteList(notes); } catch (error) { console.error('Search failed:', error); } };

    // --- Core UI & State Management ---
    const applyTheme = (theme) => { if (theme === 'dark') { body.classList.add('dark-mode'); themeToggle.checked = true; } else { body.classList.remove('dark-mode'); themeToggle.checked = false; } };
    const setActiveNote = (noteId) => { document.querySelectorAll('#notes-list li').forEach(li => { li.classList.remove('active'); if (li.dataset.id == noteId) { li.classList.add('active'); } }); };
    const showPanel = (panel) => { noteView.style.display = 'none'; noteEditor.style.display = 'none'; diagramEditor.style.display = 'none'; if (panel) panel.style.display = 'flex'; };
    const renderNoteList = (notes) => { notesList.innerHTML = ''; notes.forEach(note => { const li = document.createElement('li'); li.dataset.id = note.id; const icon = note.note_type === 'excalidraw' ? '🎨' : '📝'; const tagsHTML = (note.tags || '').split(',').filter(Boolean).map(tag => { const cleanTag = tag.trim(); const bgColor = generateColorFromString(cleanTag); const textColorClass = getTextColorForBg(bgColor); return `<span class="tag-badge ${textColorClass}" style="background-color: ${bgColor};" data-tag="${cleanTag}">#${cleanTag}</span>`; }).join(''); li.innerHTML = ` <div class="note-info"> <span class="note-title">${icon} ${note.title}</span> <div class="note-tags">${tagsHTML}</div> </div> <div class="note-actions"> <button class="btn-action btn-edit" data-id="${note.id}" title="Edit note">&#9998;</button> <button class="btn-action btn-delete" data-id="${note.id}" title="Delete note">&#10006;</button> </div> `; notesList.appendChild(li); }); };

    // --- THIS IS THE CRITICAL FIX ---
    const mountExcalidraw = (initialData) => {
        // Use a timeout to make rendering asynchronous and prevent UI freeze
        setTimeout(() => {
            const excalidrawElement = React.createElement(ExcalidrawLib.Excalidraw, {
                // Use a "callback ref" to get the API when it's ready
                ref: (api) => {
                    if (api) {
                        excalidrawAPI = api;
                        saveDiagramBtn.disabled = false; // Enable the button!
                    }
                },
                initialData: initialData
            });
            ReactDOM.render(excalidrawElement, excalidrawContainer);
        }, 0);
    };

    // --- Data Saving Functions ---
    const saveNote = async () => { try { const isNew = currentNoteId === null; const url = isNew ? '/api/note' : `/api/note/${currentNoteId}`; const method = isNew ? 'POST' : 'PUT'; const payload = { note_type: 'markdown', tags: tagsInput.value, content: markdownInput.value }; const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (response.ok) { await performSearch(); const savedNote = await response.json(); currentNoteId = savedNote.id; setActiveNote(savedNote.id); editorTitle.innerText = 'Edit Note'; } else { alert('Failed to save note.'); } } catch (error) { console.error("Error saving note:", error); alert("An error occurred while saving the note."); } };
    const saveDiagram = async () => { try { if (!excalidrawAPI) { alert("Diagram editor is not ready."); return; } const isNew = currentNoteId === null; const url = isNew ? '/api/note' : `/api/note/${currentNoteId}`; const method = isNew ? 'POST' : 'PUT'; const elements = excalidrawAPI.getSceneElements(); const appState = excalidrawAPI.getAppState(); if (elements.length === 0) { alert("Cannot save an empty diagram."); return; } const svg = await ExcalidrawLib.exportToSvg({ elements, appState }); if (!svg) { alert("Could not generate SVG from the diagram."); return; } const payload = { note_type: 'excalidraw', tags: diagramTagsInput.value, excalidraw_json: JSON.stringify(elements), svg_content: svg.outerHTML }; const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (response.ok) { await performSearch(); const savedNote = await response.json(); currentNoteId = savedNote.id; setActiveNote(savedNote.id); diagramEditorTitle.innerText = 'Edit Diagram'; } else { alert('Failed to save diagram.'); } } catch (error) { console.error("Error saving diagram:", error); alert("An error occurred while saving the diagram."); } };

    // --- Event Handlers ---
    newNoteBtn.addEventListener('click', () => { currentNoteId = null; editorTitle.innerText = 'Create New Note'; tagsInput.value = ''; markdownInput.value = ''; setActiveNote(null); showPanel(noteEditor); });
    newDiagramBtn.addEventListener('click', () => { currentNoteId = null; diagramEditorTitle.innerText = 'Create New Diagram'; diagramTagsInput.value = ''; setActiveNote(null); saveDiagramBtn.disabled = true; showPanel(diagramEditor); mountExcalidraw(null); });
    saveMarkdownBtn.addEventListener('click', saveNote);
    saveDiagramBtn.addEventListener('click', saveDiagram);
    notesList.addEventListener('click', async (e) => { const target = e.target; const listItem = target.closest('li'); if (!listItem) return; const noteId = listItem.dataset.id; const isEdit = target.matches('.btn-edit'); const isDelete = target.matches('.btn-delete'); const isTag = target.matches('.tag-badge'); const isInfo = target.matches('.note-info') || target.closest('.note-info'); if (isDelete) { if (confirm('Are you sure you want to delete this note?')) { const response = await fetch(`/api/note/${noteId}`, { method: 'DELETE' }); if (response.ok) { listItem.remove(); if (currentNoteId == noteId) showPanel(null); } else { alert('Failed to delete note.'); } } return; } if (isTag) { const tag = target.dataset.tag.trim(); searchInput.value = `#${tag} `; searchInput.focus(); performSearch(searchInput.value); return; } if (isInfo || isEdit) { const response = await fetch(`/api/note/${noteId}`); const note = await response.json(); currentNoteId = note.id; setActiveNote(note.id); if (isEdit) { const formattedTags = (note.tags || '').split(',').filter(Boolean).map(t => `#${t.trim()}`).join(', '); if (note.note_type === 'excalidraw') { diagramEditorTitle.innerText = 'Edit Diagram'; diagramTagsInput.value = formattedTags; saveDiagramBtn.disabled = true; showPanel(diagramEditor); mountExcalidraw(JSON.parse(note.excalidraw_json || '[]')); } else { editorTitle.innerText = 'Edit Note'; tagsInput.value = formattedTags; markdownInput.value = note.markdown_content; showPanel(noteEditor); } } else { noteView.innerHTML = note.html_content; showPanel(noteView); } } });
    themeToggle.addEventListener('change', () => { const newTheme = themeToggle.checked ? 'dark' : 'light'; localStorage.setItem('theme', newTheme); applyTheme(newTheme); });
    searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') { performSearch(searchInput.value); suggestionsBox.style.display = 'none'; return; } const query = searchInput.value; performSearch(query); const lastWord = query.split(/[\s,]+/).pop(); if (lastWord.startsWith('#') && lastWord.length > 1) { const tagQuery = lastWord.substring(1).toLowerCase(); const matchingTags = ALL_TAGS.filter(t => t.toLowerCase().startsWith(tagQuery)); renderSuggestions(matchingTags); } else { suggestionsBox.style.display = 'none'; } });
    const renderSuggestions = (tags) => { if (tags.length === 0) { suggestionsBox.style.display = 'none'; return; } suggestionsBox.innerHTML = tags.map(tag => `<div class="suggestion-item" data-tag="${tag}">#${tag}</div>`).join(''); suggestionsBox.style.display = 'block'; };
    suggestionsBox.addEventListener('click', (e) => { if (e.target.matches('.suggestion-item')) { const parts = searchInput.value.split(/[\s,]+/); parts.pop(); parts.push(`#${e.target.dataset.tag} `); searchInput.value = parts.join(' '); suggestionsBox.style.display = 'none'; searchInput.focus(); performSearch(searchInput.value); } });

    // --- Initialization ---
    const initialize = async () => { const savedTheme = localStorage.getItem('theme') || 'dark'; applyTheme(savedTheme); try { const response = await fetch('/api/tags'); ALL_TAGS = await response.json(); } catch (error) { console.error('Failed to fetch tags:', error); } await performSearch(); showPanel(null); };
    initialize();
});