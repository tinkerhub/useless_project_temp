/**
 * PHASE 1 & 2: FILE UNDERSTANDING, HASHING & BINARY EXTRACTION
 */
export class FileProcessor {
    
    /**
     * PHASE 1: Reads a File object and extracts its raw binary data.
     * @param {File} file 
     * @returns {Promise<{file: File, buffer: ArrayBuffer, bytes: Uint8Array}>}
     */
    static async readBinaryData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const buffer = event.target.result;
                const bytes = new Uint8Array(buffer);
                resolve({
                    file: file,
                    buffer: buffer,
                    bytes: bytes
                });
            };

            reader.onerror = () => {
                reject(new Error("Failed to read the file."));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * PHASE 2: Generates a SHA-256 hash of the given byte array.
     * @param {Uint8Array} bytes 
     * @returns {Promise<string>} Hexadecimal hash string
     */
    static async generateSHA256(bytes) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * PHASE 2: Smartly decides whether to compress the data, and compresses it using native APIs.
     * @param {Uint8Array} bytes 
     * @param {string} mimeType 
     * @returns {Promise<{bytes: Uint8Array, compressed: boolean}>}
     */
    static async compressIfNeeded(bytes, mimeType) {
        // List of MIME types that are generally already compressed
        const alreadyCompressedPrefixes = ['image/', 'video/', 'audio/'];
        const alreadyCompressedTypes = ['application/zip', 'application/pdf', 'application/x-rar-compressed', 'application/gzip'];

        const shouldSkipCompression = 
            alreadyCompressedPrefixes.some(prefix => mimeType.startsWith(prefix)) || 
            alreadyCompressedTypes.includes(mimeType);

        if (shouldSkipCompression) {
            return { bytes: bytes, compressed: false };
        }

        try {
            // Use native Browser CompressionStream API (GZIP)
            const stream = new Response(bytes).body.pipeThrough(new CompressionStream('gzip'));
            const compressedBuffer = await new Response(stream).arrayBuffer();
            const compressedBytes = new Uint8Array(compressedBuffer);

            // Only use the compressed version if it actually saved space
            if (compressedBytes.length < bytes.length) {
                return { bytes: compressedBytes, compressed: true };
            }
        } catch (error) {
            console.warn("Compression failed, falling back to original data", error);
        }

        return { bytes: bytes, compressed: false };
    }

    /**
     * Orchestrates Phase 1 and Phase 2.
     * @param {File} file 
     * @returns {Promise<Object>} The prepared file metadata and data object
     */
    static async prepareForTransmission(file) {
        // Phase 1
        const extracted = await this.readBinaryData(file);
        
        // Phase 2: Hashing
        const sha256 = await this.generateSHA256(extracted.bytes);
        
        // Phase 2: Compression
        const processed = await this.compressIfNeeded(extracted.bytes, file.type);
        
        // Calculate compression ratio
        let compressionRatio = "100%";
        if (processed.compressed) {
            compressionRatio = ((processed.bytes.length / extracted.bytes.length) * 100).toFixed(1) + "%";
        }

        return {
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            originalSize: extracted.bytes.length,
            originalBytes: extracted.bytes,
            sha256: sha256,
            isCompressed: processed.compressed,
            preparedSize: processed.bytes.length,
            preparedBytes: processed.bytes,
            compressionRatio: compressionRatio
        };
    }
}