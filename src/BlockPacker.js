/**
 * PHASE 4: BLOCK PACKING (MAXIMUM DENSITY)
 * Slices the file, applies Reed-Solomon encoding, and packs 11 symbols 
 * into a single massive payload to max out Version 40 QR capacity.
 */
export class BlockPacker {
    /**
     * @param {Uint8Array} preparedBytes The compressed/hashed file bytes
     * @param {CodingEngine} codingEngine The ReedSolomon engine instance
     * @param {number} dataChunkSize Data bytes per RS block (must be < 255 - eccSymbols)
     * @param {number} blocksPerFrame Number of RS blocks to pack into a single QR payload
     * @param {Function} progressCallback Optional UI progress hook
     * @returns {Promise<Object>} The packed payloads ready for Protocol Framing
     */
    static async pack(preparedBytes, codingEngine, dataChunkSize = 230, blocksPerFrame = 11, progressCallback = null) {
        const packedPayloads = [];
        const totalBytes = preparedBytes.length;
        const totalExpectedBlocks = Math.ceil(totalBytes / dataChunkSize);
        
        let offset = 0;
        let currentPayloadBuffer = [];
        let currentBlockCount = 0;
        let blockId = 0;

        while (offset < totalBytes) {
            // Slice the source file
            let slice = preparedBytes.slice(offset, offset + dataChunkSize);

            // Pad the final block to ensure uniform math
            if (slice.length < dataChunkSize) {
                const padded = new Uint8Array(dataChunkSize);
                padded.set(slice);
                slice = padded;
            }

            // Phase 3: Encode the slice via Reed-Solomon GF(2^8)
            const encodedBlock = codingEngine.encodeChunk(slice);
            currentPayloadBuffer.push(encodedBlock);
            currentBlockCount++;
            blockId++;
            offset += dataChunkSize;

            // Once the buffer hits the `blocksPerFrame` limit (or end of file), pack it into a single payload
            if (currentBlockCount === blocksPerFrame || offset >= totalBytes) {
                const combinedSize = currentPayloadBuffer.reduce((acc, val) => acc + val.length, 0);
                const packedArray = new Uint8Array(combinedSize);
                
                let position = 0;
                for (const block of currentPayloadBuffer) {
                    packedArray.set(block, position);
                    position += block.length;
                }
                
                packedPayloads.push(packedArray);
                
                // Reset buffer for the next frame payload
                currentPayloadBuffer = [];
                currentBlockCount = 0;
            }

            // Yield to main thread every 100 blocks to prevent UI freezing
            if (blockId % 100 === 0 && progressCallback) {
                progressCallback(blockId / totalExpectedBlocks);
                await new Promise(r => setTimeout(r, 0));
            }
        }

        if (progressCallback) progressCallback(1.0);

        return {
            sourceBlockSize: dataChunkSize,
            eccPerBlock: codingEngine.eccSymbols,
            blocksPerFrame: blocksPerFrame,
            totalPackedPayloads: packedPayloads.length,
            payloads: packedPayloads
        };
    }
}