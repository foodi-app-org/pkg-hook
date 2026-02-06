// src/utils/isomorphicRandom.ts
/**
 * Generate cryptographically secure random bytes in both browser and Node.
 *
 * In browser: uses `crypto.getRandomValues`.
 * In Node: loads the built-in `crypto` module at runtime (no top-level import).
 *
 * @param {number} size Number of bytes to generate. Must be > 0 and <= 65536 in browsers.
 * @returns {Uint8Array|Buffer} Uint8Array in browser, Buffer in Node.
 * @throws {TypeError} if size is not a positive integer.
 * @throws {Error} for environment or crypto errors.
 */
export const UtilsRandomBytes = (size: number): Uint8Array | Buffer => {
  // Validate input early
  if (!Number.isInteger(size) || size <= 0) {
    throw new TypeError('randomBytes: "size" must be a positive integer.');
  }

  // Browser: use Web Crypto
  if (typeof window !== 'undefined' && typeof window.crypto?.getRandomValues === 'function') {
    if (size > 65536) {
      // getRandomValues has a max of 65536 bytes per call in some browsers
      // split into chunks to be robust & avoid silent failures
      const out = new Uint8Array(size);
      let offset = 0;
      while (offset < size) {
        const chunkSize = Math.min(65536, size - offset);
        const tmp = new Uint8Array(chunkSize);
        window.crypto.getRandomValues(tmp);
        out.set(tmp, offset);
        offset += chunkSize;
      }
      return out;
    }
    const arr = new Uint8Array(size);
    window.crypto.getRandomValues(arr);
    return arr;
  }

  // Server (Node): load crypto lazily at runtime to avoid bundlers catching a top-level import
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // eslint-disable-next-line
      const nodeCrypto = require('crypto') as typeof import('crypto'); // runtime require
      return nodeCrypto.randomBytes(size);
    } catch (err) {
      throw new Error(`randomBytes: failed to load Node crypto module: ${(err as Error).message}`);
    }
  }

  throw new Error('randomBytes: Unsupported environment - no Web Crypto API and not Node.js');
};
