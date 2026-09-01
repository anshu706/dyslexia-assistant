# Dyslexia Assistant System

A premium, accessible reading application designed specifically for dyslexic students and professionals.

## Features

- 📖 **Upload Documents** - Full support for PDF, DOCX, and TXT files with client-side text extraction
- 🎵 **Text-to-Speech** - Natural language reading with speed, pitch, and voice controls + word highlighting
- 🎨 **Dyslexia-Friendly Settings** - OpenDyslexic & Atkinson fonts, line height, letter spacing, Irlen color tints
- 👁️ **Bionic Reading Mode** - Auto-highlights word prefixes for faster eye tracking
- 📏 **Reading Focus Ruler** - Interactive position-tracking overlay for line focus
- 🔍 **Word Lookup Dictionary** - Double-click any word for definitions, phonetics & audio pronunciations
- 🎯 **Reading Tools** - Color highlighting, note taking, bookmarks, and in-document search
- 📥 **Export Summaries** - Download notes and highlights in Markdown format
- 🌙 **Dark/Light Mode** - Comfortable viewing in any lighting with system auto-detection
- 📱 **Mobile Responsive** - Glassmorphism UI optimized across mobile, tablet, and desktop
- ⚡ **Offline Support** - Service worker PWA with full offline document storage

## Getting Started

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/dyslexia-assistant.git
cd dyslexia-assistant

# Open in browser or serve locally
npx http-server -p 8080 .
```

## 30-Hour Development Plan

### Week 1: Foundation (5 hours)
- [x] Day 1: Project setup + design system
- [x] Day 2-5: Upload + display documents (PDF, DOCX, TXT)

### Week 2: Reading Features (5 hours)
- [x] Day 6-10: Text-to-speech + Bionic Reading + Irlen Tints + Reading Ruler

### Week 3: Tools (10 hours)
- [x] Day 11-20: Highlighting + Free Dictionary API lookup + Notes + Bookmarks + Search

### Week 4: Polish (10 hours)
- [x] Day 21-30: PWA service worker offline caching + Export tools + UI polish

## Technologies

- HTML5 & CSS3 (Custom Glassmorphism & Themes)
- Vanilla JavaScript (ES6 Modules & Classes)
- Web Speech API (Text-to-Speech Engine)
- PDF.js & JSZip (Document Parsing)
- Free Dictionary API (Word definitions & phonetics)

## Accessibility

This project follows WCAG 2.1 AAA guidelines and is tailored for dyslexic users:

- Dyslexia-friendly fonts (OpenDyslexic, Atkinson Hyperlegible)
- Irlen Syndrome Color Tint Overlays (Sepia, Soft Yellow, Mint, Blue, Rose)
- Reading Focus Ruler Overlay
- Bionic Reading formatting
- High contrast mode & custom letter/line spacing

## Roadmap

- [x] Advanced in-document search
- [x] Dictionary integration & audio pronunciation
- [x] Notes & highlights markdown export
- [ ] Multi-language TTS voice fallback
- [ ] Cloud sync

---

**Made with ❤️ for accessibility and inclusion**