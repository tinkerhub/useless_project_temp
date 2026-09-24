/**
 * PHASE 3: CODING / ERROR CORRECTION
 * Pure JS implementation of Reed-Solomon over GF(2^8).
 * Mathematically compatible with Python's standard `reedsolo` library.
 */

export class CodingEngine {
    constructor() {
        if (this.constructor === CodingEngine) {
            throw new Error("Cannot instantiate abstract class CodingEngine.");
        }
    }
    encodeChunk(data) {
        throw new Error("Must implement encodeChunk");
    }
}

export class ReedSolomonCoding extends CodingEngine {
    /**
     * @param {number} eccSymbols The number of error correction symbols to append per block.
     */
    constructor(eccSymbols = 30) {
        super();
        this.eccSymbols = eccSymbols;
        this.expTable = new Uint8Array(512);
        this.logTable = new Uint8Array(256);
        this._initTables();
        this.generator = this._generatorPoly(eccSymbols);
    }

    _initTables() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            this.expTable[i] = x;
            this.expTable[i + 255] = x;
            this.logTable[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11D; 
        }
    }

    _gfMul(x, y) {
        if (x === 0 || y === 0) return 0;
        return this.expTable[this.logTable[x] + this.logTable[y]];
    }

    _generatorPoly(nsym) {
        let g = new Uint8Array([1]);
        for (let i = 0; i < nsym; i++) {
            let root = this.expTable[i];
            let nextG = new Uint8Array(g.length + 1);
            nextG[0] = g[0];
            for (let j = 1; j < g.length; j++) {
                nextG[j] = g[j] ^ this._gfMul(g[j - 1], root);
            }
            nextG[g.length] = this._gfMul(g[g.length - 1], root);
            g = nextG;
        }
        return g;
    }

    /**
     * Encodes a single chunk. Maximum length of (data.length + eccSymbols) is 255.
     * @param {Uint8Array} data 
     * @returns {Uint8Array} Original data + appended ECC parity symbols
     */
    encodeChunk(data) {
        if (data.length + this.eccSymbols > 255) {
            throw new Error("Reed-Solomon GF(2^8) cannot exceed 255 total symbols per block.");
        }
        
        const msgOut = new Uint8Array(data.length + this.eccSymbols);
        msgOut.set(data); 
        
        for (let i = 0; i < data.length; i++) {
            const coef = msgOut[i];
            if (coef !== 0) {
                for (let j = 1; j < this.generator.length; j++) {
                    msgOut[i + j] ^= this._gfMul(this.generator[j], coef);
                }
            }
        }
        
        msgOut.set(data);
        return msgOut;
    }
}