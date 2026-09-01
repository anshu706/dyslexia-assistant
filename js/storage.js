// STORAGE MANAGER - Save and retrieve documents

class StorageManager {
    constructor() {
        this.storageKey = 'dyslexia_documents';
        this.settingsKey = 'dyslexia_settings';
    }

    // Save document
    saveDocument(doc) {
        try {
            const documents = this.getAllDocuments();
            documents.push(doc);
            localStorage.setItem(this.storageKey, JSON.stringify(documents));
            console.log('💾 Document saved:', doc.id);
            return true;
        } catch (error) {
            console.error('❌ Error saving document:', error);
            alert('❌ Error saving document. Storage might be full.');
            return false;
        }
    }

    // Get all documents
    getAllDocuments() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('❌ Error retrieving documents:', error);
            return [];
        }
    }

    // Get single document
    getDocument(id) {
        const documents = this.getAllDocuments();
        return documents.find(doc => doc.id === id) || null;
    }

    // Update document
    updateDocument(id, updates) {
        try {
            const documents = this.getAllDocuments();
            const index = documents.findIndex(doc => doc.id === id);
            
            if (index !== -1) {
                documents[index] = { ...documents[index], ...updates };
                localStorage.setItem(this.storageKey, JSON.stringify(documents));
                console.log('✏️ Document updated:', id);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error updating document:', error);
            return false;
        }
    }

    // Delete document
    deleteDocument(id) {
        try {
            const documents = this.getAllDocuments().filter(doc => doc.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(documents));
            console.log('🗑️ Document deleted:', id);
            return true;
        } catch (error) {
            console.error('❌ Error deleting document:', error);
            return false;
        }
    }

    // Save settings
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            console.log('💾 Settings saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            return false;
        }
    }

    // Get settings
    getSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            return data ? JSON.parse(data) : this.defaultSettings();
        } catch (error) {
            console.error('❌ Error retrieving settings:', error);
            return this.defaultSettings();
        }
    }

    // Default settings
    defaultSettings() {
        return {
            fontSize: '18',
            lineHeight: '1.8',
            letterSpacing: '0.15',
            fontFamily: 'system',
            theme: 'auto',
            contrast: false,
            bionicReading: false,
            readingRuler: false,
            overlayColor: 'none'
        };
    }

    // Get storage usage
    getStorageUsage() {
        try {
            const docs = this.getAllDocuments();
            const docsSizeBytes = new Blob([JSON.stringify(docs)]).size;
            const docsSizeMB = (docsSizeBytes / (1024 * 1024)).toFixed(2);
            console.log(`📊 Storage used: ${docsSizeMB}MB (LocalStorage limit: 5-10MB)`);
            return {
                usedBytes: docsSizeBytes,
                usedMB: parseFloat(docsSizeMB),
                documentCount: docs.length
            };
        } catch (error) {
            console.error('❌ Error calculating storage:', error);
            return { usedBytes: 0, usedMB: 0, documentCount: 0 };
        }
    }

    // Clear all data (dangerous!)
    clearAll() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.settingsKey);
            console.log('⚠️ All data cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            return false;
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}