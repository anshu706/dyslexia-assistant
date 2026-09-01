// DICTIONARY MANAGER - Word lookup and definitions

class DictionaryManager {
    constructor() {
        this.cacheKey = 'dyslexia_dictionary_cache';
        this.cache = this.loadCache();
        this.apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    }

    // Load dictionary lookup cache from localStorage
    loadCache() {
        try {
            const data = localStorage.getItem(this.cacheKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Error loading dictionary cache:', error);
            return {};
        }
    }

    // Save cache to localStorage
    saveCache() {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (error) {
            console.error('❌ Error saving dictionary cache:', error);
        }
    }

    // Lookup word definition
    async lookupWord(word) {
        if (!word || typeof word !== 'string') return null;

        const cleanWord = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
        if (!cleanWord || cleanWord.length < 2) return null;

        // Check cache first
        if (this.cache[cleanWord]) {
            console.log('📖 Dictionary cache hit:', cleanWord);
            return this.cache[cleanWord];
        }

        try {
            console.log('🔍 Fetching definition for:', cleanWord);
            const response = await fetch(`${this.apiUrl}${encodeURIComponent(cleanWord)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        word: cleanWord,
                        found: false,
                        message: `No definition found for "${cleanWord}".`
                    };
                }
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();
            const result = this.parseApiResponse(cleanWord, data);

            // Cache successful result
            this.cache[cleanWord] = result;
            this.saveCache();

            return result;
        } catch (error) {
            console.error('❌ Error looking up word:', error);
            return {
                word: cleanWord,
                found: false,
                message: `Unable to fetch definition. Check connection.`
            };
        }
    }

    // Parse API response object into clean structured format
    parseApiResponse(rawWord, data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { word: rawWord, found: false, message: 'No definition found.' };
        }

        const entry = data[0];
        let audioUrl = null;
        let phonetic = entry.phonetic || '';

        if (entry.phonetics && Array.isArray(entry.phonetics)) {
            for (let p of entry.phonetics) {
                if (!phonetic && p.text) phonetic = p.text;
                if (!audioUrl && p.audio) audioUrl = p.audio;
            }
        }

        const meanings = (entry.meanings || []).map(m => ({
            partOfSpeech: m.partOfSpeech || 'definition',
            definitions: (m.definitions || []).slice(0, 3).map(d => ({
                definition: d.definition,
                example: d.example || null
            })),
            synonyms: (m.synonyms || []).slice(0, 5)
        }));

        return {
            word: entry.word || rawWord,
            phonetic: phonetic,
            audioUrl: audioUrl,
            meanings: meanings,
            found: true
        };
    }

    // Play pronunciation audio
    playAudio(audioUrl) {
        if (!audioUrl) return;
        try {
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (err) {
            console.error('❌ Audio playback failed:', err);
        }
    }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DictionaryManager;
}
