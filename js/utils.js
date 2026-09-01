// UTILITY FUNCTIONS

const Utils = {
    // Format text
    formatText: (text) => {
        return text.trim().replace(/\s+/g, ' ');
    },

    // Sanitize HTML
    sanitizeHTML: (html) => {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    // Get cookie
    getCookie: (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    },

    // Set cookie
    setCookie: (name, value, days = 365) => {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
    },

    // Debounce
    debounce: (func, delay) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Deep clone
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    // Apply Bionic Reading formatting (bolding initial letters of words)
    applyBionicReading: (text) => {
        if (!text) return '';
        return text.replace(/\b[a-zA-Z0-9']+\b/g, (word) => {
            const len = word.length;
            let mid = 1;
            if (len >= 4 && len <= 6) mid = 2;
            else if (len >= 7 && len <= 9) mid = 3;
            else if (len >= 10) mid = 4;
            return `<b>${word.slice(0, mid)}</b>${word.slice(mid)}`;
        });
    }
};

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}