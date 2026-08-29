// NOTES SYSTEM - Create, edit, and manage notes

class NotesManager {
    constructor(docId) {
        this.docId = docId;
        this.notes = [];
        this.load();
    }

    // Add note
    addNote(title, content) {
        if (!title || title.trim().length === 0) {
            console.error('❌ Note title cannot be empty');
            return null;
        }

        const note = {
            id: this.generateId(),
            title: title.trim(),
            content: content.trim(),
            timestamp: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.notes.push(note);
        this.save();
        console.log('📝 Note added:', note.id);
        return note;
    }

    // Update note
    updateNote(noteId, title, content) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.title = title.trim();
            note.content = content.trim();
            note.lastModified = new Date().toISOString();
            this.save();
            console.log('✏️ Note updated:', noteId);
            return note;
        }
        return null;
    }

    // Delete note
    deleteNote(noteId) {
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.save();
        console.log('🗑️ Note deleted:', noteId);
    }

    // Get single note
    getNote(noteId) {
        return this.notes.find(n => n.id === noteId);
    }

    // Get all notes
    getAll() {
        return this.notes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }

    // Search notes
    search(query) {
        const q = query.toLowerCase();
        return this.notes.filter(note =>
            note.title.toLowerCase().includes(q) || 
            note.content.toLowerCase().includes(q)
        );
    }

    // Save to storage
    save() {
        try {
            const key = `notes_${this.docId}`;
            localStorage.setItem(key, JSON.stringify(this.notes));
        } catch (error) {
            console.error('❌ Error saving notes:', error);
        }
    }

    // Load from storage
    load() {
        try {
            const key = `notes_${this.docId}`;
            const data = localStorage.getItem(key);
            this.notes = data ? JSON.parse(data) : [];
            console.log(`📝 Loaded ${this.notes.length} notes`);
        } catch (error) {
            console.error('❌ Error loading notes:', error);
            this.notes = [];
        }
    }

    // Generate unique ID
    generateId() {
        return 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Clear all notes
    clearAll() {
        this.notes = [];
        this.save();
        console.log('✨ All notes cleared');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotesManager;
}