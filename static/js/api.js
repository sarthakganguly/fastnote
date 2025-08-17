// static/js/api.js (Corrected)

export const performSearch = async (query = '') => {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        return await response.json();
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
};

export const getAllTags = async () => {
    try {
        const response = await fetch('/api/tags');
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch tags:', error);
        return [];
    }
};

export const getNoteDetails = async (noteId) => {
    try {
        const response = await fetch(`/api/note/${noteId}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch note ${noteId}:`, error);
        return null;
    }
};

// --- THIS IS THE FIX ---
// The confirm() dialog has been removed from this function.
export const deleteNote = async (noteId) => {
    try {
        const response = await fetch(`/api/note/${noteId}`, { method: 'DELETE' });
        return response.ok;
    } catch (error) {
        console.error(`Failed to delete note ${noteId}:`, error);
        return false;
    }
};

export const saveNote = async (noteId, tags, content) => {
    const isNew = noteId === null;
    const url = isNew ? '/api/note' : `/api/note/${noteId}`;
    const method = isNew ? 'POST' : 'PUT';
    const payload = { note_type: 'markdown', tags, content };
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.ok) return await response.json();
        alert('Failed to save note.');
        return null;
    } catch (error) {
        console.error("Error saving note:", error);
        alert("An error occurred while saving the note.");
        return null;
    }
};

export const saveDiagram = async (noteId, tags, excalidrawAPI) => {
    if (!excalidrawAPI) { alert("Diagram editor is not ready."); return null; }
    const isNew = noteId === null;
    const url = isNew ? '/api/note' : `/api/note/${noteId}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const elements = excalidrawAPI.getSceneElements();
    if (elements.length === 0) { alert("Cannot save an empty diagram."); return null; }
    
    const appState = excalidrawAPI.getAppState();
    const svg = await ExcalidrawLib.exportToSvg({ elements, appState });
    if (!svg) { alert("Could not generate SVG from the diagram."); return null; }

    const payload = {
        note_type: 'excalidraw',
        tags: tags,
        excalidraw_json: JSON.stringify({ elements, appState }),
        svg_content: svg.outerHTML
    };
    
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.ok) return await response.json();
        alert('Failed to save diagram.');
        return null;
    } catch (error) {
        console.error("Error saving diagram:", error);
        alert("An error occurred while saving the diagram.");
        return null;
    }
};