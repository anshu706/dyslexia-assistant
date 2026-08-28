// TEXT-TO-SPEECH ENGINE - Web Speech API

class TextToSpeech {
    constructor() {
        // Get speech synthesis instance
        this.synth = window.speechSynthesis;
        this.utterances = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.settings = {
            rate: 1,
            pitch: 1,
            volume: 1
        };
        this.callbacks = {};
        this.currentUtterance = null;
        this.wordHighlights = {};
    }

    // Initialize TTS
    init(onStart, onEnd, onPause, onResume, onError, onWordChange) {
        this.callbacks = {
            onStart,
            onEnd,
            onPause,
            onResume,
            onError,
            onWordChange
        };
        this.getAvailableVoices();
        console.log('✅ Text-to-Speech initialized');
    }

    // Get available voices
    getAvailableVoices() {
        const voices = this.synth.getVoices();
        console.log(`🎵 Found ${voices.length} voices:`, voices.map(v => v.name));
        return voices;
    }

    // Prepare text for speech
    prepareText(text) {
        if (!text || text.trim().length === 0) {
            this.callbacks.onError?.('No text to read');
            return;
        }

        // Split text into sentences for better control
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        this.utterances = [];
        let charIndex = 0;

        sentences.forEach((sentence, index) => {
            const trimmed = sentence.trim();
            if (trimmed.length === 0) return;

            const utterance = new SpeechSynthesisUtterance(trimmed);
            
            // Apply settings
            utterance.rate = this.settings.rate;
            utterance.pitch = this.settings.pitch;
            utterance.volume = this.settings.volume;

            // Event handlers
            utterance.onstart = () => {
                console.log(`🎵 Speaking (${index + 1}/${sentences.length})`);
                this.currentIndex = index;
                this.isPlaying = true;
                this.callbacks.onStart?.();
            };

            utterance.onend = () => {
                if (index === sentences.length - 1) {
                    console.log('✅ Speech finished');
                    this.isPlaying = false;
                    this.currentIndex = 0;
                    this.callbacks.onEnd?.();
                }
            };

            utterance.onpause = () => {
                this.isPaused = true;
                this.callbacks.onPause?.();
            };

            utterance.onresume = () => {
                this.isPaused = false;
                this.callbacks.onResume?.();
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech error:', event.error);
                this.callbacks.onError?.(event.error);
            };

            // Real-time word highlighting
            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    const word = trimmed.substring(event.charIndex, event.charIndex + 50).split(/[\s.!?]/)[0];
                    this.callbacks.onWordChange?.({
                        word,
                        position: charIndex + event.charIndex,
                        sentence: index
                    });
                }
            };

            this.utterances.push(utterance);
            charIndex += trimmed.length;
        });

        console.log(`📖 Prepared ${this.utterances.length} sentences for speech`);
        return this.utterances.length > 0;
    }

    // Play speech
    play() {
        if (!this.utterances || this.utterances.length === 0) {
            this.callbacks.onError?.('No text prepared. Load a document first.');
            return;
        }

        // Cancel any existing speech
        this.synth.cancel();

        // Play all utterances in sequence
        console.log('▶️ Starting playback');
        this.utterances.forEach(utterance => {
            this.synth.speak(utterance);
        });

        this.isPlaying = true;
    }

    // Pause speech
    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
            console.log('⏸️ Paused');
        }
    }

    // Resume speech
    resume() {
        if (this.isPaused) {
            this.synth.resume();
            console.log('▶️ Resumed');
        }
    }

    // Stop speech
    stop() {
        this.synth.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIndex = 0;
        console.log('⏹️ Stopped');
        this.callbacks.onEnd?.();
    }

    // Set speech rate (speed)
    setRate(rate) {
        rate = Math.max(0.5, Math.min(2, rate)); // Clamp between 0.5 and 2
        this.settings.rate = rate;

        // Update all utterances
        this.utterances.forEach(u => u.rate = rate);

        console.log(`⚡ Speed set to ${(rate * 100).toFixed(0)}%`);
    }

    // Set pitch
    setPitch(pitch) {
        pitch = Math.max(0.5, Math.min(2, pitch));
        this.settings.pitch = pitch;

        this.utterances.forEach(u => u.pitch = pitch);

        console.log(`🎵 Pitch set to ${(pitch * 100).toFixed(0)}%`);
    }

    // Set volume
    setVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        this.settings.volume = volume;

        this.utterances.forEach(u => u.volume = volume);

        console.log(`🔊 Volume set to ${(volume * 100).toFixed(0)}%`);
    }

    // Set voice
    setVoice(voiceIndex) {
        const voices = this.synth.getVoices();
        if (voiceIndex >= 0 && voiceIndex < voices.length) {
            this.utterances.forEach(u => u.voice = voices[voiceIndex]);
            console.log(`🎤 Voice set to: ${voices[voiceIndex].name}`);
        }
    }

    // Get current status
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentIndex: this.currentIndex,
            totalSentences: this.utterances.length,
            progress: this.utterances.length > 0 ? (this.currentIndex / this.utterances.length) * 100 : 0
        };
    }

    // Check if browser supports Speech Synthesis
    static isSupported() {
        return 'speechSynthesis' in window;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextToSpeech;
}