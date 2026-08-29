// FILE HANDLER - Upload and parse documents

class FileHandler {
    constructor() {
        this.supportedTypes = {
            'text/plain': 'txt',
            'application/pdf': 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/msword': 'doc'
        };
    }

    // Main upload handler
    async handleFileUpload(file) {
        console.log('📤 Processing file:', file.name);

        if (!file) {
            console.error('❌ No file selected');
            return null;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('❌ File too large! Maximum 10MB');
            return null;
        }

        // Get file extension
        const extension = this.getFileExtension(file.name);
        const validExtensions = ['txt', 'pdf', 'docx', 'doc'];

        if (!validExtensions.includes(extension)) {
            alert('❌ Unsupported file type. Please use TXT, PDF, or DOCX');
            return null;
        }

        try {
            let text = '';

            if (extension === 'txt') {
                text = await this.readTextFile(file);
            } else if (extension === 'docx' || extension === 'doc') {
                text = await this.readDocxFile(file);
            } else if (extension === 'pdf') {
                text = await this.readPdfFile(file);
            }

            // Create document object
            const doc = {
                id: this.generateId(),
                name: file.name,
                type: extension,
                content: text,
                uploadDate: new Date().toISOString(),
                lastRead: new Date().toISOString(),
                wordCount: text.split(/\s+/).length
            };

            console.log('✅ File processed successfully');
            return doc;
        } catch (error) {
            console.error('❌ Error processing file:', error);
            alert('❌ Error processing file: ' + error.message);
            return null;
        }
    }

    // Read text file
    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Read DOCX file (extracts text from XML using JSZip)
    async readDocxFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    if (window.JSZip) {
                        const zip = await JSZip.loadAsync(arrayBuffer);
                        const docXml = await zip.file("word/document.xml")?.async("string");
                        if (docXml) {
                            const text = this.extractTextFromDocxXml(docXml);
                            resolve(text || 'Unable to extract text from DOCX file');
                            return;
                        }
                    }
                    // Fallback using unzipDocx if JSZip isn't available
                    const zip = await this.unzipDocx(arrayBuffer);
                    const xmlText = zip.get('word/document.xml');
                    if (xmlText) {
                        const text = this.extractTextFromDocxXml(xmlText);
                        resolve(text || 'Unable to extract text from DOCX file');
                        return;
                    }
                    resolve('Unable to extract text from DOCX file');
                } catch (error) {
                    console.warn('⚠️ DOCX parsing error:', error.message);
                    resolve('Unable to read DOCX file: ' + error.message);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Simplified DOCX text extraction
    extractTextFromDocxXml(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            const textElements = xmlDoc.getElementsByTagName('w:t');
            
            let text = '';
            for (let i = 0; i < textElements.length; i++) {
                text += textElements[i].textContent + ' ';
            }
            return text.trim();
        } catch (error) {
            return null;
        }
    }

    // Read PDF file (extracts text using PDF.js)
    async readPdfFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (window.pdfjsLib) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        const typedarray = new Uint8Array(e.target.result);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let fullText = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map(item => item.str).join(' ');
                            fullText += pageText + '\n\n';
                        }
                        resolve(fullText.trim() || 'PDF file loaded, but no text content could be extracted.');
                        return;
                    }
                    resolve('PDF file uploaded successfully!');
                } catch (error) {
                    console.error('❌ PDF extraction error:', error);
                    resolve('Error parsing PDF file: ' + error.message);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read PDF file'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Unzip DOCX (basic implementation)
    async unzipDocx(arrayBuffer) {
        // Simplified approach - in production would use JSZip
        const map = new Map();
        // For now, return empty map and catch in DOCX handler
        return map;
    }

    // Get file extension
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts[parts.length - 1].toLowerCase();
    }

    // Generate unique ID
    generateId() {
        return 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Handle text input from user
    async handleTextInput(text) {
        if (!text || text.trim().length === 0) {
            alert('❌ Please enter some text');
            return null;
        }

        const doc = {
            id: this.generateId(),
            name: 'Text Entry - ' + new Date().toLocaleDateString(),
            type: 'text',
            content: text,
            uploadDate: new Date().toISOString(),
            lastRead: new Date().toISOString(),
            wordCount: text.split(/\s+/).length
        };

        console.log('✅ Text input saved');
        return doc;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}