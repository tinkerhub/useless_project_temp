/**
 * PHASE 5: SESSION + PROTOCOL FRAMES
 * Protocol V1 definition for Packed Blocks.
 */
export class ProtocolV1 {
    static generateSessionId() {
        return Math.floor(Math.random() * 0xFFFFFFFF);
    }

    static createMetadataFrame(sessionId, preparedFile, packingInfo, mode) {
        const metadata = {
            v: 1, 
            sid: sessionId,
            fn: preparedFile.filename,
            mt: preparedFile.mimeType,
            sh: preparedFile.sha256,
            cp: preparedFile.isCompressed,
            tm: mode,
            cm: 'rs', 
            sb: packingInfo.sourceBlockSize, // Source bytes per block
            eb: packingInfo.eccPerBlock,     // Parity bytes per block
            bpf: packingInfo.blocksPerFrame, // How many blocks are in a data frame
            tf: packingInfo.totalPackedPayloads // Total data frames to expect
        };

        const jsonString = JSON.stringify(metadata);
        const jsonBytes = new TextEncoder().encode(jsonString);

        const frame = new Uint8Array(1 + jsonBytes.length);
        frame[0] = 0x00; // Type 0x00
        frame.set(jsonBytes, 1);

        return frame;
    }

    static async createDataFrames(sessionId, packingInfo, progressCallback = null) {
        const frames = [];
        const total = packingInfo.payloads.length;

        for (let i = 0; i < total; i++) {
            const packedPayload = packingInfo.payloads[i];
            
            // Header: Type(1) + SessionID(4) + FrameSequenceID(4) = 9 bytes
            const frame = new Uint8Array(1 + 4 + 4 + packedPayload.length);
            const view = new DataView(frame.buffer);
            
            view.setUint8(0, 0x01); // Type 0x01
            view.setUint32(1, sessionId, false); 
            view.setUint32(5, i, false); // Sequence ID
            
            frame.set(packedPayload, 9);
            frames.push(frame);

            if (i % 25 === 0 && progressCallback) {
                progressCallback(i / total);
                await new Promise(r => setTimeout(r, 0));
            }
        }
        
        if (progressCallback) progressCallback(1.0);
        return frames;
    }

    static createEndFrame(sessionId, totalDataFrames) {
        const frame = new Uint8Array(1 + 4 + 4);
        const view = new DataView(frame.buffer);
        
        view.setUint8(0, 0x02); // Type 0x02
        view.setUint32(1, sessionId, false);
        view.setUint32(5, totalDataFrames, false);
        
        return frame;
    }
}