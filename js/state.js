// READING STATISTICS & ANALYTICS

class ReadingStats {
    constructor() {
        this.stats = this.loadStats();
    }

    // Record reading session
    recordSession(docId, docName, wordsRead, timeSpentSeconds, textContent) {
        const session = {
            id: 'session-' + Date.now(),
            docId: docId,
            docName: docName,
            wordsRead: wordsRead || 0,
            timeSpent: timeSpentSeconds || 0,
            timestamp: new Date().toISOString(),
            contentLength: textContent ? textContent.length : 0
        };

        if (!this.stats.sessions) {
            this.stats.sessions = [];
        }

        this.stats.sessions.push(session);
        this.save();
        console.log('📊 Session recorded:', session.id);
        return session;
    }

    // Get total statistics
    getTotalStats() {
        if (!this.stats.sessions || this.stats.sessions.length === 0) {
            return {
                totalSessions: 0,
                totalWordsRead: 0,
                totalTimeSpent: 0,
                averageSessionLength: 0,
                readingStreak: 0
            };
        }

        const sessions = this.stats.sessions;
        const totalWordsRead = sessions.reduce((sum, s) => sum + (s.wordsRead || 0), 0);
        const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);

        return {
            totalSessions: sessions.length,
            totalWordsRead: totalWordsRead,
            totalTimeSpent: totalTimeSpent,
            averageSessionLength: sessions.length > 0 ? Math.round(totalTimeSpent / sessions.length) : 0,
            readingStreak: this.calculateStreak()
        };
    }

    // Calculate reading streak (consecutive days)
    calculateStreak() {
        if (!this.stats.sessions || this.stats.sessions.length === 0) return 0;

        const sessions = this.stats.sessions;
        const dates = [...new Set(sessions.map(s => new Date(s.timestamp).toDateString()))];
        dates.sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        const today = new Date();
        let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        for (let date of dates) {
            const sessionDate = new Date(date);
            const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
                currentDate = new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000);
            } else {
                break;
            }
        }

        return streak;
    }

    // Get sessions for specific document
    getDocumentSessions(docId) {
        if (!this.stats.sessions) return [];
        return this.stats.sessions.filter(s => s.docId === docId);
    }

    // Get recent sessions
    getRecentSessions(limit = 10) {
        if (!this.stats.sessions) return [];
        return this.stats.sessions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Format time
    formatTime(seconds) {
        if (seconds < 60) return Math.round(seconds) + 's';
        if (seconds < 3600) return Math.round(seconds / 60) + 'm';
        return (seconds / 3600).toFixed(1) + 'h';
    }

    // Format word count
    formatWords(words) {
        if (words < 1000) return words + ' words';
        return (words / 1000).toFixed(1) + 'K words';
    }

    // Save to storage
    save() {
        try {
            localStorage.setItem('dyslexia_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('❌ Error saving stats:', error);
        }
    }

    // Load from storage
    loadStats() {
        try {
            const data = localStorage.getItem('dyslexia_stats');
            return data ? JSON.parse(data) : { sessions: [] };
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            return { sessions: [] };
        }
    }

    // Clear all stats
    clearAll() {
        this.stats = { sessions: [] };
        this.save();
        console.log('🗑️ All statistics cleared');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReadingStats;
}