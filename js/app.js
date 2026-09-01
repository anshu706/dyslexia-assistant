// MAIN APP INITIALIZATION & LOGIC

class DyslexiaAssistant {
    constructor() {
        this.currentDoc = null;
        this.fileHandler = new FileHandler();
        this.storage = new StorageManager();
        this.settings = this.storage.getSettings();
        this.tts = new TextToSpeech();
        this.highlightManager = null;
        this.notesManager = null;
        this.bookmarks = [];
        this.sidebarOpen = false;
        this.currentSidebarPanel = 'highlights';
        this.stats = new ReadingStats();
        this.dictionary = new DictionaryManager();
        this.readingStartTime = null;
        this.bionicEnabled = false;
        this.rulerEnabled = false;
        this.init();
    }

    init() {
        console.log('🚀 Dyslexia Assistant initializing......');
        
        // Override global window.alert with custom toasts
        window.alert = (message) => {
            let type = 'info';
            if (message.includes('✅') || message.includes('success')) type = 'success';
            else if (message.includes('❌') || message.includes('error') || message.includes('Error')) type = 'error';
            else if (message.includes('⚠️') || message.includes('warn') || message.includes('Warning')) type = 'warning';
            
            const cleanMsg = message.replace(/^[✅❌⚠️ℹ️📖🗑️✏️💾📤🎵📚🎨]\s*/, '');
            this.showToast(cleanMsg, type);
        };

        this.setupEventListeners();
        this.applySettings();
        this.displayDocuments();
        this.loadBookmarks();
        this.updateStatistics();
        this.initializeTTS();
        this.registerServiceWorker();
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach((tab, index) => {
            tab.addEventListener('click', () => {
                const pages = ['home', 'reader', 'statistics', 'settings'];
                this.switchPage(pages[index]);
            });
        });

        // TTS Controls
        document.getElementById('ttsPlayBtn').addEventListener('click', () => this.toggleTTS());
        document.getElementById('ttsStopBtn').addEventListener('click', () => this.stopTTS());
        document.getElementById('ttsSpeed').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.tts.setRate(value);
            document.getElementById('ttsSpeedDisplay').textContent = value.toFixed(1) + 'x';
        });
        document.getElementById('ttsPitch').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.tts.setPitch(value);
            document.getElementById('ttsPitchDisplay').textContent = value.toFixed(1);
        });
        document.getElementById('ttsVoice').addEventListener('change', (e) => {
            this.tts.setVoice(parseInt(e.target.value));
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

        // Document In-App Search & Ruler Trackers
        document.getElementById('readerSearchInput')?.addEventListener('input', (e) => this.searchInDocument(e.target.value));
        document.addEventListener('mousemove', (e) => this.updateRulerPosition(e));
        document.getElementById('textDisplay')?.addEventListener('dblclick', (e) => this.handleWordLookup(e));

        // Custom Modal Event Listeners
        document.getElementById('closePasteModal').addEventListener('click', () => this.hidePasteModal());
        document.getElementById('cancelPasteBtn').addEventListener('click', () => this.hidePasteModal());
        document.getElementById('submitPasteBtn').addEventListener('click', () => this.submitPasteText());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.hideConfirmModal());
    }

    // NAVIGATION
    switchPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        const pageIndex = { 'home': 0, 'reader': 1, 'statistics': 2, 'settings': 3 };
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
    handleTextInput() {
        this.showPasteModal();
    }

    // LOAD DOCUMENT
    loadDocument(docId) {
        const doc = this.storage.getDocument(docId);
        if (doc) {
            this.currentDoc = doc;
            document.getElementById('docTitle').textContent = doc.name;
            document.getElementById('textDisplay').innerHTML = this.formatContent(doc.content);
            
            // Stop any ongoing speech
            this.stopTTS();
            
            // Reset TTS utterances
            this.tts.utterances = [];
            document.getElementById('ttsPlayBtn').textContent = '▶';
            
            // Load highlights and notes
            this.setupHighlighting();
            this.setupNotes();
            this.displayBookmarks();
            
            // Update last read time
            this.storage.updateDocument(docId, { lastRead: new Date().toISOString() });
            
            // Initialize TTS
            this.initializeTTS();
            
            // Close sidebar
            this.closeSidebar();
            
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
            document.getElementById('docsCount').textContent = '0';
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
        document.getElementById('docsCount').textContent = documents.length;
    }

    // DELETE DOCUMENT
    deleteDocument(docId) {
        this.showConfirmModal('Are you sure you want to delete this document? This action cannot be undone.', () => {
            this.storage.deleteDocument(docId);
            this.displayDocuments();
            console.log('✅ Document deleted');
        });
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

        const bionicCheckbox = document.getElementById('bionicToggle');
        if (bionicCheckbox) bionicCheckbox.checked = !!this.settings.bionicReading;
        const rulerCheckbox = document.getElementById('rulerToggle');
        if (rulerCheckbox) rulerCheckbox.checked = !!this.settings.readingRuler;
        const tintSelect = document.getElementById('tintSelect');
        if (tintSelect) tintSelect.value = this.settings.overlayColor || 'none';

        this.updateFontSize(this.settings.fontSize);
        this.updateLineHeight(this.settings.lineHeight);
        this.updateLetterSpacing(this.settings.letterSpacing);
        this.updateFontFamily(this.settings.fontFamily);
        this.updateTheme(this.settings.theme);
        this.updateContrast(this.settings.contrast);

        if (this.settings.bionicReading) this.toggleBionicReading(true);
        if (this.settings.readingRuler) this.toggleReadingRuler(true);
        if (this.settings.overlayColor) this.setOverlayColor(this.settings.overlayColor);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            console.log('✅ Service Worker supported (PWA ready for Week 4)');
        }
    }

        // TEXT-TO-SPEECH METHODS

    initializeTTS() {
        if (!TextToSpeech.isSupported()) {
            alert('❌ Text-to-Speech is not supported in your browser.\n\nTry Chrome, Firefox, Safari, or Edge.');
            return;
        }

        // Populate voice dropdown
        const voices = this.tts.getAvailableVoices();
        const voiceSelect = document.getElementById('ttsVoice');
        voiceSelect.innerHTML = voices.map((voice, index) => 
            `<option value="${index}">${voice.name} ${voice.lang ? `(${voice.lang})` : ''}</option>`
        ).join('');

        // Initialize TTS callbacks
        this.tts.init(
            () => this.onTTSStart(),      // onStart
            () => this.onTTSEnd(),        // onEnd
            () => this.onTTSPause(),      // onPause
            () => this.onTTSResume(),     // onResume
            (error) => this.onTTSError(error), // onError
            (word) => this.onTTSWordChange(word) // onWordChange
        );

        console.log('✅ TTS initialized successfully');
    }

    toggleTTS() {
        if (!this.currentDoc) {
            alert('📖 Please load a document first');
            return;
        }

        const playBtn = document.getElementById('ttsPlayBtn');
        const status = this.tts.getStatus();

        if (!status.isPlaying && this.tts.utterances.length === 0) {
            // First time - prepare text
            console.log('📖 Preparing text for speech...');
            this.tts.prepareText(this.currentDoc.content);
            this.tts.play();
            playBtn.textContent = '⏸';
            this.showTTSStatus();
        } else if (status.isPlaying && !status.isPaused) {
            // Playing - pause
            this.tts.pause();
            playBtn.textContent = '▶';
        } else if (status.isPaused) {
            // Paused - resume
            this.tts.resume();
            playBtn.textContent = '⏸';
        }
    }

    stopTTS() {
        this.tts.stop();
        document.getElementById('ttsPlayBtn').textContent = '▶';
        document.getElementById('ttsStatus').style.display = 'none';
        document.getElementById('ttsProgress').style.display = 'none';
        this.clearCurrentWordHighlight();
        this.endReadingSession();
        console.log('⏹️ Speech stopped');
    }

    showTTSStatus() {
        document.getElementById('ttsStatus').style.display = 'block';
        document.getElementById('ttsProgress').style.display = 'block';
    }

    onTTSStart() {
        console.log('🎵 Speech started');
        this.showTTSStatus();
        this.startReadingSession();
    }

    onTTSEnd() {
        console.log('✅ Speech ended');
        document.getElementById('ttsPlayBtn').textContent = '▶';
        setTimeout(() => {
            document.getElementById('ttsStatus').style.display = 'none';
            document.getElementById('ttsProgress').style.display = 'none';
        }, 500);
        this.clearCurrentWordHighlight();
        this.endReadingSession();
    }

    onTTSPause() {
        console.log('⏸️ Speech paused');
        document.getElementById('ttsPlayBtn').textContent = '▶';
    }

    onTTSResume() {
        console.log('▶️ Speech resumed');
        document.getElementById('ttsPlayBtn').textContent = '⏸';
    }

    onTTSError(error) {
        console.error('❌ TTS Error:', error);
        alert('❌ Speech error: ' + error);
    }

    onTTSWordChange(wordData) {
        // Update current word display
        document.getElementById('ttsCurrentWord').textContent = wordData.word || '...';

        // Update progress
        const status = this.tts.getStatus();
        const progress = Math.max(0, status.progress);
        document.getElementById('ttsProgressBar').style.width = progress + '%';

        // Highlight current word in text
        this.highlightCurrentWord(wordData.word);
    }

    highlightCurrentWord(word) {
        const textDisplay = document.getElementById('textDisplay');
        if (!textDisplay) return;

        // Clear previous highlights
        this.clearCurrentWordHighlight();

        if (!word) return;

        // Find and highlight word safely in paragraph content
        const paragraphs = textDisplay.querySelectorAll('p');
        paragraphs.forEach(p => {
            const regex = new RegExp(`\\b(${this.escapeRegex(word)})\\b`, 'i');
            if (regex.test(p.innerHTML)) {
                p.innerHTML = p.innerHTML.replace(
                    regex,
                    '<span class="tts-current-word" style="background-color: #FFFF00; color: #000; padding: 2px 4px; border-radius: 2px; font-weight: 600;">$1</span>'
                );
            }
        });
    }

    clearCurrentWordHighlight() {
        const textDisplay = document.getElementById('textDisplay');
        if (!textDisplay) return;

        const highlightedElements = textDisplay.querySelectorAll('.tts-current-word');
        highlightedElements.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // TOAST NOTIFICATIONS
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        toast.innerHTML = `<span>${emoji}</span> <span>${this.escapeHtml(message)}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // PASTE TEXT MODAL METHODS
    showPasteModal() {
        const modal = document.getElementById('pasteModal');
        const textarea = document.getElementById('pasteTextarea');
        textarea.value = '';
        modal.style.display = 'flex';
        textarea.focus();
    }

    hidePasteModal() {
        document.getElementById('pasteModal').style.display = 'none';
    }

    async submitPasteText() {
        const textarea = document.getElementById('pasteTextarea');
        const textInput = textarea.value;
        
        if (!textInput || textInput.trim().length === 0) {
            this.showToast('Please enter some text', 'warning');
            return;
        }

        const doc = await this.fileHandler.handleTextInput(textInput);
        if (doc) {
            this.storage.saveDocument(doc);
            this.loadDocument(doc.id);
            this.hidePasteModal();
            this.switchPage('reader');
            this.showToast('Document created successfully', 'success');
        }
    }

    // CONFIRM MODAL METHODS
    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        modal.querySelector('.modal-body p').textContent = message;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideConfirmModal();
        });
        
        modal.style.display = 'flex';
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }

    // HIGHLIGHTING SYSTEM

    setupHighlighting() {
        if (!this.currentDoc) return;

        // Initialize highlight manager
        this.highlightManager = new HighlightManager(this.currentDoc.id);

        // Setup color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.innerHTML = this.highlightManager.colors.map(color =>
                `<button onclick="window.app.highlightManager.setColor('${color.hex}'); window.app.updateColorPicker();" style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${color.hex};
                    border: 2px solid ${this.highlightManager.currentColor === color.hex ? 'var(--text-primary)' : 'transparent'};
                    cursor: pointer;
                    transition: all 0.2s ease;
                " title="${color.name}"></button>`
            ).join('');
        }

        // Display highlights
        this.displayHighlights();

        // Setup text selection for highlighting
        document.getElementById('textDisplay').addEventListener('mouseup', () => this.handleTextSelection());
    }

    updateColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.innerHTML = this.highlightManager.colors.map(color =>
                `<button onclick="window.app.highlightManager.setColor('${color.hex}'); window.app.updateColorPicker();" style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${color.hex};
                    border: 2px solid ${this.highlightManager.currentColor === color.hex ? 'var(--text-primary)' : 'transparent'};
                    cursor: pointer;
                    transition: all 0.2s ease;
                " title="${color.name}"></button>`
            ).join('');
        }
    }

    handleTextSelection() {
        const selected = window.getSelection().toString().trim();
        if (selected.length > 0) {
            if (confirm(`Highlight this text?\n\n"${selected.substring(0, 50)}..."`)) {
                this.highlightManager.addHighlight(selected, this.highlightManager.currentColor);
                this.displayHighlights();
                this.applyHighlightsToText();
                console.log('✅ Text highlighted');
            }
            window.getSelection().removeAllRanges();
        }
    }

    displayHighlights() {
        const highlights = this.highlightManager.getAll();
        const list = document.getElementById('highlightsList');

        if (highlights.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">📂 No highlights yet. Select text to highlight.</p>';
            return;
        }

        list.innerHTML = highlights.map(hl => `
            <div style="
                background: var(--bg-primary);
                padding: var(--pad-md);
                border-left: 4px solid ${hl.color};
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: start;
                gap: var(--gap-md);
            ">
                <div style="flex: 1;">
                    <div style="
                        color: var(--text-primary);
                        font-size: 14px;
                        font-weight: 500;
                        margin-bottom: 4px;
                        word-break: break-word;
                    ">"${hl.text.substring(0, 80)}${hl.text.length > 80 ? '...' : ''}"</div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        ${new Date(hl.timestamp).toLocaleDateString()}
                    </div>
                </div>
                <button onclick="window.app.highlightManager.deleteHighlight('${hl.id}'); window.app.displayHighlights();" style="
                    background: transparent;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                    font-size: 16px;
                ">🗑️</button>
            </div>
        `).join('');
    }

    applyHighlightsToText() {
        const textDisplay = document.getElementById('textDisplay');
        if (!textDisplay || !this.highlightManager) return;

        // Reset to clean formatted content first
        if (this.currentDoc) {
            textDisplay.innerHTML = this.formatContent(this.currentDoc.content);
        }

        const highlights = this.highlightManager.getAll();
        highlights.forEach(hl => {
            if (!hl.text) return;
            const paragraphs = textDisplay.querySelectorAll('p');
            paragraphs.forEach(p => {
                const regex = new RegExp(`(${this.escapeRegex(hl.text)})`, 'gi');
                p.innerHTML = p.innerHTML.replace(regex, `<mark style="background-color: ${hl.color}; padding: 2px 4px; border-radius: 2px;">$1</mark>`);
            });
        });
    }

    // NOTES SYSTEM

    setupNotes() {
        if (!this.currentDoc) return;

        this.notesManager = new NotesManager(this.currentDoc.id);
        this.displayNotes();
    }

    openNoteModal() {
        const title = prompt('📝 Note Title:');
        if (!title) return;

        const content = prompt('📝 Note Content:');
        if (content === null) return;

        const note = this.notesManager.addNote(title, content);
        if (note) {
            this.displayNotes();
            alert('✅ Note saved!');
        }
    }

    displayNotes() {
        const notes = this.notesManager.getAll();
        const list = document.getElementById('notesList');

        if (notes.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">📂 No notes yet. Click "Add Note" to create one.</p>';
            return;
        }

        list.innerHTML = notes.map(note => `
            <div style="
                background: var(--bg-primary);
                padding: var(--pad-md);
                border-radius: 4px;
                border: 1px solid var(--border);
            ">
                <div style="
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                ">
                    ${this.escapeHtml(note.title)}
                </div>
                <div style="
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    line-height: 1.5;
                    word-break: break-word;
                ">
                    ${this.escapeHtml(note.content)}
                </div>
                <div style="
                    display: flex;
                    gap: 8px;
                    font-size: 12px;
                    color: var(--text-muted);
                ">
                    <span>📅 ${new Date(note.lastModified).toLocaleDateString()}</span>
                    <button onclick="window.app.editNote('${note.id}')" style="background: none; border: none; cursor: pointer; color: var(--accent);">✏️ Edit</button>
                    <button onclick="window.app.notesManager.deleteNote('${note.id}'); window.app.displayNotes();" style="background: none; border: none; cursor: pointer; color: var(--danger);">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    editNote(noteId) {
        const note = this.notesManager.getNote(noteId);
        if (!note) return;

        const newTitle = prompt('Edit Title:', note.title);
        if (!newTitle) return;

        const newContent = prompt('Edit Content:', note.content);
        if (newContent === null) return;

        this.notesManager.updateNote(noteId, newTitle, newContent);
        this.displayNotes();
        alert('✅ Note updated!');
    }

    // BOOKMARKS SYSTEM

    addBookmark() {
        if (!this.currentDoc) return;

        const bookmarkName = prompt('⭐ Bookmark name:');
        if (!bookmarkName) return;

        const bookmark = {
            id: 'bm-' + Date.now(),
            docId: this.currentDoc.id,
            docName: this.currentDoc.name,
            name: bookmarkName,
            timestamp: new Date().toISOString()
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        this.displayBookmarks();
        alert('✅ Bookmark added!');
    }

    displayBookmarks() {
        const docBookmarks = this.bookmarks.filter(bm => bm.docId === this.currentDoc.id);
        const list = document.getElementById('bookmarksList');

        if (docBookmarks.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">📂 No bookmarks yet. Click "Bookmark Current" to create one.</p>';
            return;
        }

        list.innerHTML = docBookmarks.map(bm => `
            <div style="
                background: var(--bg-primary);
                padding: var(--pad-md);
                border-radius: 4px;
                border-left: 4px solid var(--accent);
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: var(--gap-md);
            ">
                <div>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                        ${this.escapeHtml(bm.name)}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        ${new Date(bm.timestamp).toLocaleDateString()}
                    </div>
                </div>
                <button onclick="window.app.deleteBookmark('${bm.id}')" style="
                    background: transparent;
                    border: none;
                    color: var(--danger);
                    cursor: pointer;
                    font-size: 16px;
                ">🗑️</button>
            </div>
        `).join('');
    }

    deleteBookmark(bookmarkId) {
        this.bookmarks = this.bookmarks.filter(bm => bm.id !== bookmarkId);
        this.saveBookmarks();
        this.displayBookmarks();
    }

    saveBookmarks() {
        localStorage.setItem('dyslexia_bookmarks', JSON.stringify(this.bookmarks));
    }

    loadBookmarks() {
        try {
            const data = localStorage.getItem('dyslexia_bookmarks');
            this.bookmarks = data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            this.bookmarks = [];
        }
    }

    // SIDEBAR MANAGEMENT

    toggleSidebar(panel) {
        if (this.sidebarOpen && this.currentSidebarPanel === panel) {
            this.closeSidebar();
        } else {
            this.openSidebar(panel);
        }
    }

    openSidebar(panel = 'highlights') {
        const sidebar = document.getElementById('sidebarContainer');
        if (sidebar) {
            sidebar.style.width = '350px';
            this.sidebarOpen = true;
            this.showSidebarPanel(panel);
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebarContainer');
        if (sidebar) {
            sidebar.style.width = '0';
            this.sidebarOpen = false;
        }
    }

    showSidebarPanel(panel) {
        // Hide all panels
        document.querySelectorAll('.sidebar-panel').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.sidebar-tab').forEach(t => {
            t.classList.remove('active');
            t.style.borderBottomColor = 'transparent';
            t.style.color = 'var(--text-secondary)';
        });

        // Show selected panel
        const panelElement = document.getElementById(panel + 'Panel');
        if (panelElement) {
            panelElement.style.display = 'block';
        }

        // Update tab styling for selected panel
        const tabBtn = document.querySelector(`.sidebar-tab[onclick*="${panel}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
            tabBtn.style.borderBottomColor = 'var(--accent)';
            tabBtn.style.color = 'var(--accent)';
        }

        this.currentSidebarPanel = panel;
    }

    // READING STATISTICS

    startReadingSession() {
        this.readingStartTime = Date.now();
        console.log('📖 Reading session started');
    }

    endReadingSession() {
        if (!this.readingStartTime || !this.currentDoc) return;

        const timeSpentSeconds = Math.round((Date.now() - this.readingStartTime) / 1000);
        const wordsRead = this.currentDoc.content.split(/\s+/).length;

        this.stats.recordSession(
            this.currentDoc.id,
            this.currentDoc.name,
            wordsRead,
            timeSpentSeconds,
            this.currentDoc.content
        );

        this.readingStartTime = null;
        this.updateStatistics();
        console.log(`📊 Session ended: ${wordsRead} words in ${this.stats.formatTime(timeSpentSeconds)}`);
    }

    updateStatistics() {
        const totalStats = this.stats.getTotalStats();

        // Update stats dashboard
        document.getElementById('statSessions').textContent = totalStats.totalSessions;
        document.getElementById('statWords').textContent = this.stats.formatWords(totalStats.totalWordsRead);
        document.getElementById('statTime').textContent = this.stats.formatTime(totalStats.totalTimeSpent);
        document.getElementById('statStreak').textContent = totalStats.readingStreak;

        // Display recent sessions
        this.displayRecentSessions();
    }

    displayRecentSessions() {
        const recentSessions = this.stats.getRecentSessions(10);
        const container = document.getElementById('recentSessions');

        if (recentSessions.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No reading sessions yet. Start reading to see your stats!</p>';
            return;
        }

        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <th style="text-align: left; padding: 12px; color: var(--text-secondary); font-weight: 600;">📖 Document</th>
                        <th style="text-align: left; padding: 12px; color: var(--text-secondary); font-weight: 600;">📊 Words</th>
                        <th style="text-align: left; padding: 12px; color: var(--text-secondary); font-weight: 600;">⏱️ Time</th>
                        <th style="text-align: left; padding: 12px; color: var(--text-secondary); font-weight: 600;">📅 Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentSessions.map(session => `
                        <tr style="border-bottom: 1px solid var(--border); hover: { background: var(--bg-primary); }">
                            <td style="padding: 12px; color: var(--text-primary);">${this.escapeHtml(session.docName.substring(0, 30))}</td>
                            <td style="padding: 12px; color: var(--text-secondary);">${session.wordsRead || 0}</td>
                            <td style="padding: 12px; color: var(--text-secondary);">${this.stats.formatTime(session.timeSpent)}</td>
                            <td style="padding: 12px; color: var(--text-muted);">${new Date(session.timestamp).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // BIONIC READING MODE
    toggleBionicReading(forcedState) {
        this.bionicEnabled = forcedState !== undefined ? forcedState : !this.bionicEnabled;
        const textDisplay = document.getElementById('textDisplay');
        const bionicBtn = document.getElementById('bionicBtn');
        const bionicCheckbox = document.getElementById('bionicToggle');

        if (!textDisplay || !this.currentDoc) return;

        if (this.bionicEnabled) {
            const formatted = this.currentDoc.content
                .split('\n\n')
                .filter(p => p.trim())
                .map(p => `<p class="bionic-reading">${Utils.applyBionicReading(this.escapeHtml(p.trim()))}</p>`)
                .join('');
            textDisplay.innerHTML = formatted;
            if (bionicBtn) bionicBtn.style.borderColor = 'var(--accent)';
            if (bionicCheckbox) bionicCheckbox.checked = true;
            this.showToast('Bionic Reading enabled', 'info');
        } else {
            textDisplay.innerHTML = this.formatContent(this.currentDoc.content);
            if (bionicBtn) bionicBtn.style.borderColor = 'var(--border)';
            if (bionicCheckbox) bionicCheckbox.checked = false;
        }

        this.settings.bionicReading = this.bionicEnabled;
        this.storage.saveSettings(this.settings);
    }

    // READING RULER
    toggleReadingRuler(forcedState) {
        this.rulerEnabled = forcedState !== undefined ? forcedState : !this.rulerEnabled;
        const ruler = document.getElementById('readingRuler');
        const rulerBtn = document.getElementById('rulerBtn');
        const rulerCheckbox = document.getElementById('rulerToggle');

        if (ruler) {
            ruler.style.display = this.rulerEnabled ? 'block' : 'none';
        }
        if (rulerBtn) {
            rulerBtn.style.borderColor = this.rulerEnabled ? 'var(--accent)' : 'var(--border)';
        }
        if (rulerCheckbox) {
            rulerCheckbox.checked = this.rulerEnabled;
        }

        this.settings.readingRuler = this.rulerEnabled;
        this.storage.saveSettings(this.settings);
        if (this.rulerEnabled) this.showToast('Reading Ruler active', 'info');
    }

    updateRulerPosition(e) {
        if (!this.rulerEnabled) return;
        const ruler = document.getElementById('readingRuler');
        if (ruler) {
            ruler.style.top = `${e.clientY - 21}px`;
        }
    }

    // COLOR OVERLAY TINTS
    setOverlayColor(color) {
        const textDisplay = document.getElementById('textDisplay');
        if (!textDisplay) return;

        textDisplay.classList.remove('tint-sepia', 'tint-yellow', 'tint-blue', 'tint-green', 'tint-rose');
        if (color && color !== 'none') {
            textDisplay.classList.add(`tint-${color}`);
        }

        this.settings.overlayColor = color;
        this.storage.saveSettings(this.settings);
    }

    // IN-DOCUMENT SEARCH
    searchInDocument(query) {
        const textDisplay = document.getElementById('textDisplay');
        if (!textDisplay || !this.currentDoc) return;

        if (!query || query.trim().length === 0) {
            textDisplay.innerHTML = this.formatContent(this.currentDoc.content);
            if (this.bionicEnabled) this.toggleBionicReading(true);
            return;
        }

        const cleanQuery = this.escapeRegex(query.trim());
        const regex = new RegExp(`(${cleanQuery})`, 'gi');
        const paragraphs = textDisplay.querySelectorAll('p');

        paragraphs.forEach(p => {
            p.innerHTML = p.innerText.replace(
                regex,
                '<mark style="background-color: #F59E0B; color: white; padding: 2px 4px; border-radius: 2px;">$1</mark>'
            );
        });
    }

    // DICTIONARY WORD LOOKUP
    async handleWordLookup(e) {
        let selected = window.getSelection().toString().trim();
        if (!selected) {
            const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
            if (range) {
                range.expand('word');
                selected = range.toString().trim();
            }
        }

        if (!selected || selected.length < 2 || selected.includes(' ')) return;

        const modal = document.getElementById('dictionaryModal');
        const title = document.getElementById('dictWordTitle');
        const body = document.getElementById('dictModalBody');

        title.textContent = `📖 "${selected}"`;
        body.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">🔍 Fetching definition...</div>';
        modal.style.display = 'flex';

        const info = await this.dictionary.lookupWord(selected);

        if (!info || !info.found) {
            body.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">${info?.message || 'No definition found.'}</p>`;
            return;
        }

        let html = `<div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 16px; font-weight: 700; color: var(--accent);">${info.word}</span>
            <span style="font-size: 14px; color: var(--text-muted);">${info.phonetic}</span>
            ${info.audioUrl ? `<button onclick="window.app.dictionary.playAudio('${info.audioUrl}')" class="btn-icon" style="width: 32px; height: 32px; font-size: 14px;" title="Listen">🔊</button>` : ''}
        </div>`;

        info.meanings.forEach(m => {
            html += `<div style="margin-bottom: 12px; border-top: 1px solid var(--border); padding-top: 8px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">${m.partOfSpeech}</div>`;
            m.definitions.forEach((d, idx) => {
                html += `<div style="font-size: 14px; margin-bottom: 4px; color: var(--text-primary);">${idx + 1}. ${this.escapeHtml(d.definition)}</div>`;
                if (d.example) {
                    html += `<div style="font-size: 12px; font-style: italic; color: var(--text-muted); margin-left: 12px; margin-bottom: 4px;">"${this.escapeHtml(d.example)}"</div>`;
                }
            });
            if (m.synonyms && m.synonyms.length > 0) {
                html += `<div style="font-size: 12px; color: var(--accent); margin-top: 4px;">Synonyms: ${m.synonyms.join(', ')}</div>`;
            }
            html += `</div>`;
        });

        body.innerHTML = html;
    }

    // EXPORT NOTES & HIGHLIGHTS
    exportNotes() {
        if (!this.notesManager || !this.currentDoc) return;
        const text = this.notesManager.exportSummary(this.currentDoc.name);
        this.downloadFile(`${this.currentDoc.name}-notes.md`, text);
        this.showToast('Notes exported successfully', 'success');
    }

    exportHighlights() {
        if (!this.highlightManager || !this.currentDoc) return;
        const text = this.highlightManager.exportSummary(this.currentDoc.name);
        this.downloadFile(`${this.currentDoc.name}-highlights.md`, text);
        this.showToast('Highlights exported successfully', 'success');
    }

    downloadFile(filename, content) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DyslexiaAssistant();
    console.log('✨ Dyslexia Assistant loaded successfully!');
});