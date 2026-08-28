// MAIN APP INITIALIZATION & LOGIC

class DyslexiaAssistant {
    constructor() {
        this.currentDoc = null;
        this.fileHandler = new FileHandler();
        this.storage = new StorageManager();
        this.settings = this.storage.getSettings();
        this.init();
    }

    init() {
        console.log('🚀 Dyslexia Assistant initializing...');
        this.setupEventListeners();
        this.applySettings();
        this.displayDocuments();
        this.registerServiceWorker();
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach((tab, index) => {
            tab.addEventListener('click', () => {
                const pages = ['home', 'reader', 'settings'];
                this.switchPage(pages[index]);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent)';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border)';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border)';
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                this.handleFileUpload();
            }
        });

        fileInput.addEventListener('change', () => this.handleFileUpload());

        // Text input
        document.getElementById('textInputBtn').addEventListener('click', () => this.handleTextInput());

        // Settings
        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeDisplay').textContent = e.target.value + 'px';
            this.updateFontSize(e.target.value);
        });

        document.getElementById('lineHeight').addEventListener('input', (e) => {
            document.getElementById('lineHeightDisplay').textContent = parseFloat(e.target.value).toFixed(1);
            this.updateLineHeight(e.target.value);
        });

        document.getElementById('letterSpacing').addEventListener('input', (e) => {
            document.getElementById('letterSpacingDisplay').textContent = parseFloat(e.target.value).toFixed(2) + 'em';
            this.updateLetterSpacing(e.target.value);
        });

        document.getElementById('fontFamily').addEventListener('change', (e) => this.updateFontFamily(e.target.value));
        document.getElementById('theme').addEventListener('change', (e) => this.updateTheme(e.target.value));
        document.getElementById('contrast').addEventListener('change', (e) => this.updateContrast(e.target.checked));
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
    }

    // NAVIGATION
    switchPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        const pageIndex = { 'home': 0, 'reader': 1, 'settings': 2 };
        if (pageIndex[pageName] !== undefined) {
            document.querySelectorAll('.nav-tab')[pageIndex[pageName]].classList.add('active');
        }

        // Show selected page
        document.getElementById(pageName).classList.add('active');

        // Refresh documents list if going home
        if (pageName === 'home') {
            this.displayDocuments();
        }
    }

    // FILE UPLOAD
    async handleFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) return;

        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = '<div class="loading">📤 Processing file...</div>';

        setTimeout(async () => {
            const doc = await this.fileHandler.handleFileUpload(file);

            if (doc) {
                this.storage.saveDocument(doc);
                this.loadDocument(doc.id);
                this.switchPage('reader');
                alert('✅ Document uploaded successfully!');
            }

            // Reset upload area
            uploadArea.innerHTML = `
                <div class="upload-content">
                    <div class="upload-icon">📄</div>
                    <h2>Upload Your Document</h2>
                    <p>Click to select or drag & drop</p>
                    <p class="text-muted">PDF, DOCX, or TXT (Max 10MB)</p>
                </div>
            `;
            fileInput.value = '';
        }, 500);
    }

    // TEXT INPUT
    async handleTextInput() {
        const textInput = prompt('📝 Enter or paste your text here:');
        if (!textInput) return;

        const doc = await this.fileHandler.handleTextInput(textInput);
        if (doc) {
            this.storage.saveDocument(doc);
            this.loadDocument(doc.id);
            this.switchPage('reader');
        }
    }

    // LOAD DOCUMENT
    loadDocument(docId) {
        const doc = this.storage.getDocument(docId);
        if (doc) {
            this.currentDoc = doc;
            document.getElementById('docTitle').textContent = doc.name;
            document.getElementById('textDisplay').innerHTML = this.formatContent(doc.content);
            
            // Update last read time
            this.storage.updateDocument(docId, { lastRead: new Date().toISOString() });
            
            console.log('📖 Loaded document:', doc.name);
        }
    }

    // FORMAT CONTENT FOR DISPLAY
    formatContent(content) {
        if (!content) return '<p>No content available</p>';

        // Split by paragraphs and create HTML
        return content
            .split('\n\n')
            .filter(para => para.trim())
            .map(para => {
                const cleaned = para.trim().replace(/\n/g, ' ');
                return `<p>${this.escapeHtml(cleaned)}</p>`;
            })
            .join('');
    }

    // ESCAPE HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // DISPLAY DOCUMENTS LIST
    displayDocuments() {
        const documents = this.storage.getAllDocuments();
        const docsList = document.getElementById('documentsList');

        if (documents.length === 0) {
            docsList.innerHTML = `
                <div style="padding: var(--pad-xl); text-align: center;">
                    <p style="color: var(--text-muted); font-size: 16px;">
                        📂 No documents yet. Upload one to get started!
                    </p>
                </div>
            `;
            return;
        }

        // Sort by last read date
        documents.sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));

        docsList.innerHTML = documents.map(doc => `
            <div class="document-card" style="
                background: var(--bg-secondary);
                padding: var(--pad-lg);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border);
                margin-bottom: var(--gap-md);
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1; cursor: pointer;" onclick="window.app.loadDocument('${doc.id}'); window.app.switchPage('reader');">
                        <div style="font-weight: 600; margin-bottom: 8px;">${this.escapeHtml(doc.name)}</div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">
                            📄 ${doc.type.toUpperCase()} • 📊 ${doc.wordCount} words
                        </div>
                        <div style="font-size: 13px; color: var(--text-muted);">
                            📅 ${new Date(doc.lastRead).toLocaleDateString()}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); window.app.deleteDocument('${doc.id}')" style="
                        background: transparent;
                        border: none;
                        color: var(--danger);
                        cursor: pointer;
                        font-size: 18px;
                        padding: 8px;
                    " title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    // DELETE DOCUMENT
    deleteDocument(docId) {
        if (confirm('🗑️ Delete this document? This cannot be undone.')) {
            this.storage.deleteDocument(docId);
            this.displayDocuments();
            console.log('✅ Document deleted');
        }
    }

    // THEME
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'auto';
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
        
        document.documentElement.setAttribute('data-theme', next);
        document.getElementById('theme').value = next;
        this.settings.theme = next;
        this.storage.saveSettings(this.settings);

        const icon = { 'light': '🌙', 'dark': '☀️', 'auto': '🔄' };
        document.getElementById('themeToggle').querySelector('.icon').textContent = icon[next];
    }

    updateTheme(value) {
        if (value === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', value);
        }
        this.settings.theme = value;
    }

    // FONT SETTINGS
    updateFontSize(size) {
        document.querySelector('.text-display').style.fontSize = size + 'px';
        this.settings.fontSize = size;
    }

    updateLineHeight(value) {
        document.querySelector('.text-display').style.lineHeight = value;
        this.settings.lineHeight = value;
    }

    updateLetterSpacing(value) {
        document.querySelector('.text-display').style.letterSpacing = value + 'em';
        this.settings.letterSpacing = value;
    }

    updateFontFamily(font) {
        const textDisplay = document.querySelector('.text-display');
        textDisplay.classList.remove('font-opendyslexic', 'font-atkinson');
        document.body.classList.remove('font-opendyslexic', 'font-atkinson');

        if (font !== 'system') {
            const className = `font-${font}`;
            textDisplay.classList.add(className);
            document.body.classList.add(className);
        }
        this.settings.fontFamily = font;
    }

    updateContrast(enabled) {
        document.body.classList.toggle('high-contrast', enabled);
        this.settings.contrast = enabled;
    }

    saveSettings() {
        this.storage.saveSettings(this.settings);
        const usage = this.storage.getStorageUsage();
        alert(`✅ Settings saved!\n\nStorage used: ${usage.usedMB}MB\nDocuments: ${usage.documentCount}`);
    }

    applySettings() {
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('lineHeight').value = this.settings.lineHeight;
        document.getElementById('letterSpacing').value = this.settings.letterSpacing;
        document.getElementById('fontFamily').value = this.settings.fontFamily;
        document.getElementById('theme').value = this.settings.theme;
        document.getElementById('contrast').checked = this.settings.contrast;

        this.updateFontSize(this.settings.fontSize);
        this.updateLineHeight(this.settings.lineHeight);
        this.updateLetterSpacing(this.settings.letterSpacing);
        this.updateFontFamily(this.settings.fontFamily);
        this.updateTheme(this.settings.theme);
        this.updateContrast(this.settings.contrast);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            console.log('✅ Service Worker supported (PWA ready for Week 4)');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DyslexiaAssistant();
    console.log('✨ Dyslexia Assistant loaded successfully!');
});