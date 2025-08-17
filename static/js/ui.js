// static/js/ui.js

let DOM = {};

export const initUI = () => {
    DOM = {
        body: document.body,
        themeToggle: document.getElementById('checkbox'),
        notesList: document.getElementById('notes-list'),
        noteView: document.getElementById('note-view'),
        
        noteEditor: document.getElementById('note-editor'),
        editorTitle: document.getElementById('editor-title'),
        tagsInput: document.getElementById('tags-input'),
        markdownInput: document.getElementById('markdown-input'),
        saveMarkdownBtn: document.getElementById('save-markdown-btn'),

        diagramEditor: document.getElementById('diagram-editor'),
        diagramEditorTitle: document.getElementById('diagram-editor-title'),
        diagramTagsInput: document.getElementById('diagram-tags-input'),
        saveDiagramBtn: document.getElementById('save-diagram-btn'),

        newNoteBtn: document.getElementById('new-note-btn'),
        newDiagramBtn: document.getElementById('new-diagram-btn')
    };
    return DOM;
};

const generateColorFromString = (str) => { let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 70%, 70%)`; };
const getTextColorForBg = (color) => { if (color.startsWith('hsl')) { const lightness = parseInt(color.match(/(\d+)%\)/)[1]); return lightness > 55 ? 'dark-text' : 'light-text'; } return 'dark-text'; };

export const applyTheme = (theme) => {
    if (theme === 'dark') {
        DOM.body.classList.add('dark-mode');
        DOM.themeToggle.checked = true;
    } else {
        DOM.body.classList.remove('dark-mode');
        DOM.themeToggle.checked = false;
    }
};

export const setActiveNote = (noteId) => {
    document.querySelectorAll('#notes-list li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.id == noteId) {
            li.classList.add('active');
        }
    });
};

export const showPanel = (panelName) => {
    DOM.noteView.style.display = 'none';
    DOM.noteEditor.style.display = 'none';
    DOM.diagramEditor.style.display = 'none';
    if (panelName && DOM[panelName]) {
        DOM[panelName].style.display = 'flex';
    }
};

export const renderNoteList = (notes) => {
    DOM.notesList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.dataset.id = note.id;
        const icon = note.note_type === 'excalidraw' ? '🎨' : '📝';
        const tagsHTML = (note.tags || '').split(',').filter(Boolean).map(tag => {
            const cleanTag = tag.trim();
            const bgColor = generateColorFromString(cleanTag);
            const textColorClass = getTextColorForBg(bgColor);
            return `<span class="tag-badge ${textColorClass}" style="background-color: ${bgColor};" data-tag="${cleanTag}">#${cleanTag}</span>`;
        }).join('');
        li.innerHTML = `
            <div class="note-info">
                <span class="note-title">${icon} ${note.title}</span>
                <div class="note-tags">${tagsHTML}</div>
            </div>
            <div class="note-actions">
                <button class="btn-action btn-edit" data-id="${note.id}" title="Edit note">&#9998;</button>
                <button class="btn-action btn-delete" data-id="${note.id}" title="Delete note">&#10006;</button>
            </div>
        `;
        DOM.notesList.appendChild(li);
    });
};