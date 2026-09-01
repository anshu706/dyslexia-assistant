// HIGHLIGHTING SYSTEM - Save and manage text highlights

class HighlightManager {
    constructor(docId) {
        this.docId = docId;
        this.highlights = [];
        this.colors = [
            { name: 'Yellow', hex: '#FFFF00' },
            { name: 'Green', hex: '#90EE90' },
            { name: 'Pink', hex: '#FFB6C1' },
            { name: 'Blue', hex: '#87CEEB' },
            { name: 'Orange', hex: '#FFD700' }
        ];
        this.currentColor = '#FFFF00';
        this.load();
    }

    // Add highlight
    addHighlight(text, color = this.currentColor) {
        if (!text || text.trim().length === 0) return null;

        const highlight = {
            id: this.generateId(),
            text: text.trim(),
            color: color,
            timestamp: new Date().toISOString()
        };

        this.highlights.push(highlight);
        this.save();
        console.log('🖍️ Highlight added:', highlight.id);
        return highlight;
    }

    // Delete highlight
    deleteHighlight(highlightId) {
        this.highlights = this.highlights.filter(h => h.id !== highlightId);
        this.save();
        console.log('🗑️ Highlight deleted:', highlightId);
    }

    // Get all highlights
    getAll() {
        return this.highlights.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Set current color
    setColor(color) {
        this.currentColor = color;
        console.log('🎨 Highlight color set to:', color);
    }

    // Save to storage
    save() {
        try {
            const key = `highlights_${this.docId}`;
            localStorage.setItem(key, JSON.stringify(this.highlights));
        } catch (error) {
            console.error('❌ Error saving highlights:', error);
        }
    }

    // Load from storage
    load() {
        try {
            const key = `highlights_${this.docId}`;
            const data = localStorage.getItem(key);
            this.highlights = data ? JSON.parse(data) : [];
            console.log(`📖 Loaded ${this.highlights.length} highlights`);
        } catch (error) {
            console.error('❌ Error loading highlights:', error);
            this.highlights = [];
        }
    }

    // Generate unique ID
    generateId() {
        return 'hl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Export highlights as formatted markdown text
    exportSummary(docName = 'Document') {
        const list = this.getAll();
        if (list.length === 0) return `# Highlights for ${docName}\n\nNo highlights recorded.`;
        
        let md = `# 🖍️ Highlights Summary for ${docName}\n\n`;
        list.forEach((h, idx) => {
            md += `${idx + 1}. > "${h.text}"\n   *(Color: ${h.color}, Date: ${new Date(h.timestamp).toLocaleDateString()})*\n\n`;
        });
        return md;
    }

    // Clear all highlights for this document
    clearAll() {
        this.highlights = [];
        this.save();
        console.log('✨ All highlights cleared');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HighlightManager;
}