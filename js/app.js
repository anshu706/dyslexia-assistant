// MAIN APP INITIALIZATION

class DyslexiaAssistant {
    constructor() {
        this.currentDoc = null;
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        console.log('🚀 Dyslexia Assistant initializing...');
        this.setupEventListeners();
        this.applySettings();
        this.registerServiceWorker();
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchPage(e.target.dataset.tab));
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => e.preventDefault());
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileInput.files = e.dataTransfer.files;
            this.handleFileUpload();
        });

        fileInput.addEventListener('change', () => this.handleFileUpload());

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

    switchPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

        // Show selected page
        document.getElementById(pageName).classList.add('active');
        document.querySelector(`[data-tab="${pageName}"]`).classList.add('active');
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'auto';
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
        
        document.documentElement.setAttribute('data-theme', next);
        document.getElementById('theme').value = next;
        this.settings.theme = next;
        this.saveSettings();

        // Update icon
        const icon = {
            'light': '🌙',
            'dark': '☀️',
            'auto': '🔄'
        };
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

    handleFileUpload() {
        console.log('📤 Handling file upload...');
        // Placeholder - will be implemented in Day 2
        alert('File upload feature coming tomorrow! 🚀');
    }

    loadSettings() {
        const saved = localStorage.getItem('dyslexia_settings');
        return saved ? JSON.parse(saved) : {
            fontSize: '18',
            lineHeight: '1.8',
            letterSpacing: '0.15',
            fontFamily: 'system',
            theme: 'auto',
            contrast: false
        };
    }

    saveSettings() {
        localStorage.setItem('dyslexia_settings', JSON.stringify(this.settings));
        alert('✅ Settings saved!');
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
            console.log('✅ Service Worker supported (PWA ready for Day 4)');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DyslexiaAssistant();
    console.log('✨ Dyslexia Assistant loaded successfully!');
});