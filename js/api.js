/**
 * PS4 HEN Store - API Module
 * Handles loading catalog from JSON files with caching and version checking
 */

class StoreAPI {
    constructor() {
        this.baseUrl = 'data/';
        this.cache = new Map();
        this.cacheTimestamp = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Fetch JSON with cache support
     */
    async fetchJSON(filename, useCache = true) {
        const cacheKey = filename;
        const now = Date.now();

        if (useCache && this.cache.has(cacheKey)) {
            const cachedTime = this.cacheTimestamp.get(cacheKey) || 0;
            if (now - cachedTime < this.CACHE_DURATION) {
                return this.cache.get(cacheKey);
            }
        }

        try {
            const response = await fetch(this.baseUrl + filename);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, data);
            this.cacheTimestamp.set(cacheKey, now);
            return data;
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            // Try to return cached data even if expired
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            throw error;
        }
    }

    /**
     * Get version info
     */
    async getVersion() {
        return this.fetchJSON('version.json');
    }

    /**
     * Get games catalog
     */
    async getGames() {
        const data = await this.fetchJSON('games.json');
        return data.games || [];
    }

    /**
     * Get categories
     */
    async getCategories() {
        const data = await this.fetchJSON('categories.json');
        return data.categories || [];
    }

    /**
     * Get featured games
     */
    async getFeatured() {
        const data = await this.fetchJSON('featured.json');
        return data.featured || [];
    }

    /**
     * Check for updates
     */
    async checkForUpdates(localVersion) {
        try {
            const versionData = await this.getVersion();
            return {
                hasUpdate: versionData.version > localVersion,
                latestVersion: versionData.version,
                updated: versionData.updated
            };
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return { hasUpdate: false, latestVersion: localVersion };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheTimestamp.clear();
    }

    /**
     * Force refresh
     */
    async forceRefresh() {
        this.clearCache();
        const [games, categories, featured, version] = await Promise.all([
            this.getGames(),
            this.getCategories(),
            this.getFeatured(),
            this.getVersion()
        ]);
        return { games, categories, featured, version };
    }
}

// Export for use in other modules
window.StoreAPI = StoreAPI;