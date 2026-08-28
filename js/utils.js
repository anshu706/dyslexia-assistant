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
    deepClone: (obj) => JSON.parse(JSON.stringify(obj))
};

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}