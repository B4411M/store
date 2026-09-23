/**
 * PS4 HEN Store - SHA256 Utility
 * Computes SHA256 hash for file verification
 */

class SHA256Util {
    /**
     * Compute SHA256 hash of a blob/file
     */
    static async computeHash(blob) {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Compute SHA256 hash of a file input
     */
    static async computeHashFromFile(file) {
        return this.computeHash(file);
    }

    /**
     * Verify hash matches expected
     */
    static async verifyHash(blob, expectedHash) {
        const actualHash = await this.computeHash(blob);
        return {
            valid: actualHash.toLowerCase() === expectedHash.toLowerCase(),
            expected: expectedHash.toLowerCase(),
            actual: actualHash.toLowerCase()
        };
    }
}

// Export for use
window.SHA256Util = SHA256Util;