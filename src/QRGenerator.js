// Native ES Module import - Bypasses global scope bugs completely
import QRCode from 'https://esm.sh/qrcode@1.5.3';

/**
 * PHASE 6: CONVERT TO QR
 * Takes protocol frames (Uint8Array) and converts them to base64 QR Images.
 * Uses 'byte' mode to prevent UTF-8 corruption of Galois Field math.
 */
export class QRGenerator {
    static async generatePreRenderedFrames(protocolStream, progressCallback = null) {
        const allFrames = [
            protocolStream.metadata,
            ...protocolStream.data,
            protocolStream.end
        ];
        
        const qrImages = [];
        const total = allFrames.length;
        
        for (let i = 0; i < total; i++) {
            const frameBytes = allFrames[i];
            
            try {
                // Convert to a standard Array of numbers to bypass TypedArray bugs
                const dataArray = Array.from(frameBytes);

                // Generate QR Code binary payload
                const dataUrl = await QRCode.toDataURL([{ data: dataArray, mode: 'byte' }], {
                    version: 40, // Force maximum capacity
                    errorCorrectionLevel: 'L',
                    margin: 2,
                    scale: 3, // Lowered scale to prevent RAM exhaustion on large files
                    color: {
                        dark: '#000000',  
                        light: '#ffffff'  
                    }
                });
                
                qrImages.push(dataUrl);
            } catch (error) {
                console.error(`[QR Error] Frame ${i} size was ${frameBytes.length} bytes.`);
                throw new Error(`QR Generation failed at frame ${i}: ${error.message}`);
            }
            
            // Yield to UI periodically so the browser doesn't freeze
            if (progressCallback && i % 5 === 0) {
                progressCallback((i + 1) / total);
                await new Promise(r => setTimeout(r, 0));
            }
        }
        
        if (progressCallback) progressCallback(1.0);
        return qrImages;
    }
}