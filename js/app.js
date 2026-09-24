/**
 * PS4 HEN Store - Main Application
 * Uses localStorage for game data (persistent across refresh)
 */

class PS4StoreApp {
    constructor() {
        this.api = new StoreAPI();
        this.downloadManager = new DownloadManager(this);
        this.pkgInstaller = new PKGInstaller(this);
        this.currentCategory = 'all';
        this.selectedGame = null;
        this.featuredIndex = 0;
        this.featuredGames = [];
        this.favorites = this.loadFavorites();
        this.isPS4 = this.detectPS4();
        this.catalogLoaded = false;
        this.localVersion = parseInt(localStorage.getItem('catalogVersion') || '0');
        this.pendingDownloadGame = null;
        this.goldhenUrl = localStorage.getItem('goldhenUrl') || 'http://localhost:12800';
        this.init();
    }

    detectPS4() {
        const userAgent = navigator.userAgent || window.navigator.userAgent;
        return /PlayStation 4/i.test(userAgent) || /Orbis/i.test(userAgent);
    }

    init() {
        console.log('PS4 HEN Store initializing...');
        console.log('Running on PS4:', this.isPS4);

        // Detect file:// protocol (local file access)
        this.isLocalFile = window.location.protocol === 'file:';
        
        if (this.isLocalFile) {
            console.warn('Running via file:// protocol - fetch() will not work');
            this.showLocalFileWarning();
            // Fallback to embedded games-data.js
            this.loadFromEmbeddedCatalog();
            this.catalogLoaded = true;
            this.renderFeatured();
            this.renderTopDownloads();
            this.renderGameCatalog();
            this.updateStats();
            return;
        }

        // Set GoldHEN URL for PKG installer
        this.pkgInstaller.setGoldHENUrl(this.goldhenUrl);

        this.setupNavigation();
        this.setupSearch();
        this.setupCategoryButtons();
        this.setupModals();
        this.setupOfflineDetection();

        // Load catalog from API
        this.loadCatalog();

        if (!this.isPS4) {
            this.showToast('Demo Mode - Buka di PS4 untuk fitur lengkap', 'info');
        }

        console.log('PS4 HEN Store ready!');
    }

    showLocalFileWarning() {
        // Create warning banner
        const banner = document.createElement('div');
        banner.id = 'local-file-warning';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; 
            background: #ff9800; color: #000; padding: 15px; 
            text-align: center; z-index: 9999; font-weight: 600;
            font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        banner.innerHTML = `
            ⚠️ <strong>Mode File Lokal</strong> - fetch() tidak jalan di file://<br>
            <small>Jalankan: <code>python3 -m http.server 8080</code> lalu buka <a href="http://localhost:8080" style="color:#000;text-decoration:underline;">http://localhost:8080</a></small>
            <button onclick="this.parentElement.remove()" style="margin-left:15px;padding:2px 8px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;">×</button>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Also show toast
        setTimeout(() => {
            this.showToast('⚠️ Mode file:// - Gunakan HTTP server (python3 -m http.server 8080)', 'warning');
        }, 1000);
    }

    loadFromEmbeddedCatalog() {
        try {
            if (typeof PS4_GAME_CATALOG !== 'undefined') {
                console.log('Loading from games-data.js (fallback):', PS4_GAME_CATALOG.length);
                this.saveGamesToStorage(PS4_GAME_CATALOG);
                this.showToast('Memuat katalog dari fallback (games-data.js)', 'info');
            } else {
                console.warn('No embedded catalog found');
                this.showToast('Tidak ada data game - buka via HTTP server', 'error');
            }
        } catch (e) {
            console.error('Failed to load embedded catalog:', e);
            this.showToast('Error load fallback: ' + e.message, 'error');
        }
    }

    async loadCatalog() {
        try {
            this.showToast('Memuat katalog...', 'info');

            // Check for updates
            const updateCheck = await this.api.checkForUpdates(this.localVersion);
            if (updateCheck.hasUpdate) {
                this.showToast('Katalog baru tersedia!', 'success');
            }

            // Load games
            const games = await this.api.getGames();
            this.saveGamesToStorage(games);

            // Load categories
            const categories = await this.api.getCategories();
            this.saveCategoriesToStorage(categories);

            // Load featured
            const featured = await this.api.getFeatured();
            this.featuredGames = featured;

            this.catalogLoaded = true;
            this.localVersion = updateCheck.latestVersion || this.localVersion;
            localStorage.setItem('catalogVersion', this.localVersion.toString());
            localStorage.setItem('catalogUpdated', updateCheck.updated || new Date().toISOString());

            this.renderFeatured();
            this.renderTopDownloads();
            this.renderGameCatalog();
            this.updateStats();

            this.showToast('Katalog dimuat!', 'success');
            this.updateLastUpdatedDisplay();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
        } catch (error) {
            console.error('Failed to load catalog:', error);
            this.showToast('Gagal memuat katalog, menggunakan cache...', 'warning');
            this.loadFromCache();
        }
    }

    setupAutoRefresh() {
        // Auto-refresh every 30 minutes if enabled
        const autoRefresh = localStorage.getItem('autoRefresh') !== 'false';
        const refreshInterval = parseInt(localStorage.getItem('refreshInterval') || '30') * 60 * 1000;
        
        if (autoRefresh) {
            this.autoRefreshTimer = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    this.refreshCatalogSilent();
                }
            }, refreshInterval);
        }
        
        // Also refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.catalogLoaded) {
                this.refreshCatalogSilent();
            }
        });
    }

    async refreshCatalogSilent() {
        try {
            const updateCheck = await this.api.checkForUpdates(this.localVersion);
            if (updateCheck.hasUpdate) {
                await this.loadCatalog();
                this.showToast('Katalog diperbarui otomatis!', 'success');
            }
        } catch (error) {
            console.log('Silent refresh failed:', error);
        }
    }

    async refreshCatalog() {
        this.showToast('Memperbarui katalog...', 'info');
        try {
            await this.api.forceRefresh();
            await this.loadCatalog();
            this.showToast('Katalog diperbarui!', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showToast('Gagal memperbarui katalog', 'error');
        }
    }

    getLastUpdated() {
        return localStorage.getItem('catalogUpdated') || 'Belum pernah';
    }

    updateLastUpdatedDisplay() {
        const el = document.getElementById('last-updated');
        if (el) {
            const updated = this.getLastUpdated();
            el.textContent = `Terakhir: ${updated}`;
        }
    }

    loadFromCache() {
        try {
            const saved = localStorage.getItem('ps4StoreGames');
            if (saved && JSON.parse(saved).length > 0) {
                console.log('Loading from localStorage:', JSON.parse(saved).length);
                this.catalogLoaded = true;
                this.renderFeatured();
                this.renderTopDownloads();
                this.renderGameCatalog();
                this.updateStats();
                return;
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }

        // Fall back to embedded PS4_GAME_CATALOG
        try {
            if (typeof PS4_GAME_CATALOG !== 'undefined') {
                console.log('Loading from games-data.js (fallback):', PS4_GAME_CATALOG.length);
                this.saveGamesToStorage(PS4_GAME_CATALOG);
                this.catalogLoaded = true;
                this.renderFeatured();
                this.renderTopDownloads();
                this.renderGameCatalog();
                this.updateStats();
                return;
            }
        } catch (e) {
            console.warn('Could not load embedded catalog:', e);
        }

        this.catalogLoaded = true;
        this.renderFeatured();
        this.renderTopDownloads();
        this.renderGameCatalog();
        this.updateStats();
    }

    saveGamesToStorage(games) {
        try {
            const normalizedGames = (games || []).map(game => this.normalizeGame(game));
            localStorage.setItem('ps4StoreGames', JSON.stringify(normalizedGames));
        } catch (e) {
            console.warn('Could not save games to localStorage:', e);
        }
    }

    saveCategoriesToStorage(categories) {
        try {
            localStorage.setItem('ps4StoreCategories', JSON.stringify(categories));
        } catch (e) {
            console.warn('Could not save categories to localStorage:', e);
        }
    }

    // ========== GAME CATALOG ==========
    normalizeGame(game) {
        if (!game || typeof game !== 'object') return game;

        const packageInfo = game.pkg || {};
        const media = game.media || {};
        const numericId = Number(game.id);

        return {
            ...game,
            id: Number.isNaN(numericId) ? game.id : numericId,
            url: game.url || packageInfo.url || '',
            image: game.image || media.icon || '',
            sha256: game.sha256 || packageInfo.sha256 || ''
        };
    }

    getGameCatalog() {
        // First, try to load from localStorage (primary)
        try {
            const saved = localStorage.getItem('ps4StoreGames');
            if (saved && JSON.parse(saved).length > 0) {
                return JSON.parse(saved).map(game => this.normalizeGame(game));
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }

        // Fall back to embedded PS4_GAME_CATALOG
        try {
            if (typeof PS4_GAME_CATALOG !== 'undefined') {
                return PS4_GAME_CATALOG.map(game => this.normalizeGame(game));
            }
        } catch (e) {
            console.warn('Could not load embedded catalog:', e);
        }

        return [];
    }

    // ========== NAVIGATION ==========
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const category = item.dataset.category;
                this.setActiveNav(item);
                this.filterByCategory(category);
            });
        });
    }

    setActiveNav(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.updateHero(category);
        this.renderGameCatalog();
        this.updateCategoryButtons(category);
        this.updateNavItems(category);
    }

    updateHero(category) {
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');
        const heroBadge = document.getElementById('hero-badge');

        if (!heroTitle) return;

        const titles = {
            'all': 'PS4 HEN STORE',
            'games': 'Game PS4',
            'homebrew': 'Homebrew',
            'apps': 'Aplikasi Homebrew',
            'tools': 'Tools & Utilities',
            'emulators': 'Emulator',
            'updates': 'Update & Patch',
            'dlc': 'DLC Content',
            'themes': 'Tema'
        };

        const descs = {
            'all': 'Download dan install game langsung di PS4 Anda dengan satu klik',
            'games': 'Koleksi game lengkap untuk PS4 homebrew',
            'homebrew': 'Aplikasi homebrew untuk PS4',
            'apps': 'Aplikasi dan tools homebrew untuk PS4',
            'tools': 'Tools dan utilities untuk PS4',
            'emulators': 'Emulator game retro untuk PS4',
            'updates': 'Update dan patch terbaru untuk game',
            'dlc': 'Konten tambahan untuk game kesayangan Anda',
            'themes': 'Tema dan kustomisasi untuk PS4'
        };

        const badges = {
            'all': '🔥 Unggulan',
            'games': '🎮 Game',
            'homebrew': '🛠️ Homebrew',
            'apps': '📱 Apps',
            'tools': '🔧 Tools',
            'emulators': '🕹️ Emulator',
            'updates': '🔄 Update',
            'dlc': '📦 DLC',
            'themes': '🎨 Tema'
        };

        heroTitle.textContent = titles[category] || titles['all'];
        if (heroDesc) heroDesc.textContent = descs[category] || descs['all'];
        if (heroBadge) heroBadge.textContent = badges[category] || badges['all'];
    }

    // ========== CATEGORY BUTTONS ==========
    setupCategoryButtons() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.filterByCategory(category);
            });
        });
    }

    updateCategoryButtons(activeCategory) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === activeCategory) {
                btn.classList.add('active');
            }
        });
    }

    updateNavItems(activeCategory) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === activeCategory) {
                item.classList.add('active');
            }
        });
    }

    // ========== SEARCH ==========
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchGames(e.target.value);
            }, 300);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchGames(e.target.value);
            }
        });
    }

    searchGames(query) {
        if (!query.trim()) {
            this.renderGameCatalog();
            return;
        }

        const catalog = this.getGameCatalog();
        const lowerQuery = query.toLowerCase();
        const results = catalog.filter(game =>
            (game.title && game.title.toLowerCase().includes(lowerQuery)) ||
            (game.title_id && game.title_id.toLowerCase().includes(lowerQuery)) ||
            (game.author && game.author.toLowerCase().includes(lowerQuery)) ||
            (game.category && game.category.toLowerCase().includes(lowerQuery)) ||
            (game.description && game.description.toLowerCase().includes(lowerQuery)) ||
            (game.publisher && game.publisher.toLowerCase().includes(lowerQuery))
        );

        this.renderGames(results);
        this.updateCatalogTitle('Hasil Pencarian: "' + query + '"');
    }

    // ========== FEATURED GAMES ==========
    renderFeatured() {
        const container = document.getElementById('featured-carousel');
        if (!container) return;

        const catalog = this.getGameCatalog();
        
        this.featuredGames = catalog
            .filter(game => game.url && !game.url.includes('example.com'))
            .slice(0, 4);

        if (this.featuredGames.length === 0) {
            this.featuredGames = catalog.slice(0, 4);
        }

        if (this.featuredGames.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📭</div>
                    <h3>Belum ada game</h3>
                    <p>Tambahkan game melalui Admin Dashboard</p>
                    <a href="admin.html" class="ps-btn-primary" style="display:inline-flex;margin-top:15px;">
                        ⚙️ Buka Admin Dashboard
                    </a>
                </div>
            `;
            return;
        }

        this.renderFeaturedCards();
    }

    renderFeaturedCards() {
        const container = document.getElementById('featured-carousel');
        if (!container) return;

        container.innerHTML = this.featuredGames.map((game, index) => 
            this.createFeaturedCard(game, index)
        ).join('');
    }

    createFeaturedCard(game, index) {
        const imageUrl = this.getGameImage(game);
        const hasValidUrl = game.url && !game.url.includes('example.com');
        
        return `
            <div class="featured-card ${index === 0 ? 'active' : ''}" onclick="app.showGameDetail(${game.id})">
                <img src="${imageUrl}" alt="${game.title}" class="featured-card-img" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 140 180%22><rect fill=%22%231a1a1a%22 width=%22140%22 height=%22180%22/><text x=%2270%22 y=%2290%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22>${encodeURIComponent(game.title || 'Game')}</text></svg>'">
                <div class="featured-card-content">
                    <h3>${game.title || 'Unknown'}</h3>
                    <p>${game.publisher || 'Unknown'} | ${this.formatSize(game.size || 0)}</p>
                    <div class="featured-meta">
                        <span>📦 ${this.getCategoryLabel(game.category)}</span>
                        <span>⭐ ${game.rating || 'M'}</span>
                    </div>
                    <button class="ps-btn-primary" onclick="event.stopPropagation(); app.quickDownload(${game.id})">
                        ⬇️ Download
                    </button>
                </div>
            </div>
        `;
    }

    // ========== TOP DOWNLOADS ==========
    renderTopDownloads() {
        const container = document.getElementById('top-grid');
        if (!container) return;

        const topGames = [...this.getGameCatalog()]
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 5);

        if (topGames.length === 0) {
            container.innerHTML = '<p class="empty-message">Belum ada data</p>';
            return;
        }

        container.innerHTML = topGames.map((game, index) => 
            this.createTopCard(game, index + 1)
        ).join('');
    }

    createTopCard(game, rank) {
        const imageUrl = this.getGameImage(game);
        
        return `
            <div class="top-card" data-rank="${rank}" onclick="app.showGameDetail(${game.id})">
                <img src="${imageUrl}" alt="${game.title}" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 120%22><rect fill=%22%231a1a1a%22 width=%22200%22 height=%22120%22/><text x=%22100%22 y=%2260%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22>${encodeURIComponent(game.title || 'Game')}</text></svg>'">
                <div class="top-card-info">
                    <h4>${game.title || 'Unknown'}</h4>
                    <p>${this.formatSize(game.size || 0)}</p>
                </div>
            </div>
        `;
    }

    // ========== GAME CATALOG ==========
    renderGameCatalog() {
        this.applyFilters();
    }

    applyFilters() {
        let games = this.currentCategory === 'all' 
            ? this.getGameCatalog() 
            : this.getGameCatalog().filter(g => g.category === this.currentCategory);

        // Apply size filter
        const sizeFilter = document.getElementById('size-filter');
        if (sizeFilter && sizeFilter.value !== 'all') {
            const sizeValue = sizeFilter.value;
            games = games.filter(game => {
                const sizeGB = (game.size || 0) / (1024 * 1024 * 1024);
                if (sizeValue === 'small') return sizeGB < 10;
                if (sizeValue === 'medium') return sizeGB >= 10 && sizeGB <= 30;
                if (sizeValue === 'large') return sizeGB > 30;
                return true;
            });
        }

        // Apply firmware filter
        const firmwareFilter = document.getElementById('firmware-filter');
        if (firmwareFilter && firmwareFilter.value !== 'all') {
            const fwValue = firmwareFilter.value;
            games = games.filter(game => {
                const minFw = game.firmware?.min || '9.00';
                return minFw <= fwValue;
            });
        }

        // Apply sort
        const sortFilter = document.getElementById('sort-filter');
        const sortValue = sortFilter ? sortFilter.value : 'newest';
        switch (sortValue) {
            case 'newest':
                games.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));
                break;
            case 'popular':
                games.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                break;
            case 'size':
                games.sort((a, b) => (b.size || 0) - (a.size || 0));
                break;
            case 'name':
                games.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
        }

        this.renderGames(games);
        this.updateCatalogTitle();
    }

    renderGames(games) {
        const container = document.getElementById('game-grid');
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📭</div>
                    <h3>Tidak ada game ditemukan</h3>
                    <p>Tambahkan game melalui Admin Dashboard</p>
                    <a href="admin.html" class="ps-btn-primary" style="display:inline-flex;margin-top:15px;">
                        ⚙️ Buka Admin Dashboard
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = games.map(game => this.createGameCard(game)).join('');
    }

    createGameCard(game) {
        const imageUrl = this.getGameImage(game);
        const hasValidUrl = game.url && !game.url.includes('example.com') && this.isValidUrl(game.url);
        const categoryLabel = this.getCategoryLabel(game.category);

        return `
            <div class="game-card" onclick="app.showGameDetail(${game.id})">
                <div class="game-card-img-container">
                    <img src="${imageUrl}" alt="${game.title}" class="game-card-img"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 240 140%22><rect fill=%22%231a1a1a%22 width=%22240%22 height=%22140%22/><text x=%22120%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2214%22>${encodeURIComponent(game.title || 'Game')}</text></svg>'">
                    <span class="game-category-badge">${categoryLabel}</span>
                </div>
                <div class="game-info">
                    <h4>${game.title || 'Unknown'}</h4>
                    <div class="game-meta">
                        <span>${game.publisher || 'Unknown'}</span>
                        <span>${this.formatSize(game.size || 0)}</span>
                    </div>
                    <div class="game-actions" onclick="event.stopPropagation()">
                        <button class="ps-btn-primary" onclick="app.quickDownload(${game.id})" ${!hasValidUrl ? 'disabled' : ''}>
                            ${hasValidUrl ? '⬇️ Download' : '🔒 Tidak Tersedia'}
                        </button>
                        <button class="ps-btn-secondary" onclick="app.showGameDetail(${game.id})">ℹ️</button>
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = { 
            'games': 'GAME', 
            'homebrew': 'HOMEBREW',
            'apps': 'APP', 
            'tools': 'TOOLS',
            'emulators': 'EMU',
            'updates': 'UPDATE', 
            'dlc': 'DLC',
            'themes': 'THEME'
        };
        return labels[category] || category?.toUpperCase() || 'GAME';
    }

    getGameImage(game) {
        if (game.image && (game.image.startsWith('http') || game.image.startsWith('data:'))) {
            return game.image;
        }
        const icons = { 
            'games': '🎮', 
            'homebrew': '🛠️',
            'apps': '📱', 
            'tools': '🔧',
            'emulators': '🕹️',
            'updates': '🔄', 
            'dlc': '📦',
            'themes': '🎨'
        };
        const icon = icons[game.category] || '🎮';
        return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 240 140%22><rect fill=%22%231a1a1a%22 width=%22240%22 height=%22140%22/><text x=%22120%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2224%22>${encodeURIComponent(icon)}</text></svg>`;
    }

    updateCatalogTitle(title) {
        const catalogTitle = document.getElementById('catalog-title');
        if (catalogTitle) {
            catalogTitle.textContent = title || this.getCatalogTitle();
        }
    }

    getCatalogTitle() {
        const titles = { 'all': 'Katalog Lengkap', 'games': 'Game PS4', 'apps': 'Aplikasi Homebrew', 'updates': 'Update & Patch', 'dlc': 'DLC Content' };
        return titles[this.currentCategory] || 'Katalog';
    }

    // ========== GAME DETAILS ==========
    showGameDetail(gameId) {
        const catalog = this.getGameCatalog();
        const game = catalog.find(g => g.id === gameId);
        
        if (!game) {
            this.showToast('Game tidak ditemukan', 'error');
            return;
        }

        this.selectedGame = game;

        const titleEl = document.getElementById('modal-game-title');
        const imageEl = document.getElementById('modal-game-image');
        const titleIdEl = document.getElementById('modal-title-id');
        const publisherEl = document.getElementById('modal-publisher');
        const authorEl = document.getElementById('modal-author');
        const sizeEl = document.getElementById('modal-size');
        const versionEl = document.getElementById('modal-version');
        const categoryEl = document.getElementById('modal-category');
        const ratingEl = document.getElementById('modal-rating');
        const firmwareEl = document.getElementById('modal-firmware');
        const sha256El = document.getElementById('modal-sha256');
        const licenseEl = document.getElementById('modal-license');
        const websiteEl = document.getElementById('modal-website');
        const sourceEl = document.getElementById('modal-source');
        const descEl = document.getElementById('modal-description');
        const screenshotsContainer = document.getElementById('modal-screenshots');
        const screenshotGrid = document.getElementById('screenshot-grid');
        const changelogSection = document.getElementById('modal-changelog');
        const changelogContent = document.getElementById('changelog-content');
        const versionHistorySection = document.getElementById('modal-version-history');
        const versionHistoryContent = document.getElementById('version-history-content');

        if (titleEl) titleEl.textContent = game.title || 'Unknown';
        if (imageEl) imageEl.src = this.getGameImage(game);
        if (titleIdEl) titleIdEl.textContent = game.title_id || game.contentId || 'Unknown';
        if (publisherEl) publisherEl.textContent = game.publisher || game.author || 'Unknown';
        if (authorEl) authorEl.textContent = game.author || game.publisher || 'Unknown';
        if (sizeEl) sizeEl.textContent = this.formatSize(game.size || 0);
        if (versionEl) versionEl.textContent = game.version || '1.0';
        if (categoryEl) categoryEl.textContent = this.getCategoryLabel(game.category);
        if (ratingEl) ratingEl.textContent = game.rating || 'M';
        
        // Firmware
        if (firmwareEl) {
            const minFw = game.firmware?.min || '9.00';
            const maxFw = game.firmware?.max || '13.00';
            firmwareEl.textContent = `${minFw} - ${maxFw}`;
        }
        
        // SHA256
        if (sha256El) {
            const sha256 = game.pkg?.sha256 || game.sha256 || '-';
            sha256El.textContent = sha256;
            sha256El.title = sha256; // Show full hash on hover
        }
        
        // License
        if (licenseEl) licenseEl.textContent = game.license || 'Unknown';
        
        // Website
        if (websiteEl) {
            if (game.website) {
                websiteEl.href = game.website;
                websiteEl.textContent = game.website;
            } else {
                websiteEl.href = '#';
                websiteEl.textContent = '-';
            }
        }
        
        // Source
        if (sourceEl) {
            if (game.source) {
                sourceEl.href = game.source;
                sourceEl.textContent = game.source;
            } else {
                sourceEl.href = '#';
                sourceEl.textContent = '-';
            }
        }
        
        if (descEl) descEl.textContent = game.description || 'Deskripsi tidak tersedia';
        
        // Screenshots
        if (game.screenshots && game.screenshots.length > 0) {
            if (screenshotsContainer) screenshotsContainer.style.display = 'block';
            if (screenshotGrid) {
                screenshotGrid.innerHTML = game.screenshots.map(url => 
                    `<img src="${url}" alt="Screenshot" class="screenshot-thumb" onclick="window.open('${url}', '_blank')">`
                ).join('');
            }
        } else {
            if (screenshotsContainer) screenshotsContainer.style.display = 'none';
        }
        
        // Changelog
        if (game.changelog) {
            if (changelogSection) changelogSection.style.display = 'block';
            if (changelogContent) changelogContent.textContent = game.changelog;
        } else {
            if (changelogSection) changelogSection.style.display = 'none';
        }
        
        // Version History
        if (game.version_history && game.version_history.length > 0) {
            if (versionHistorySection) versionHistorySection.style.display = 'block';
            if (versionHistoryContent) {
                versionHistoryContent.innerHTML = game.version_history.map(v => 
                    `<div class="version-item">
                        <strong>v${v.version}</strong> - ${v.date || ''}
                        <div>${v.changes || ''}</div>
                    </div>`
                ).join('');
            }
        } else {
            if (versionHistorySection) versionHistorySection.style.display = 'none';
        }

        const installBtn = document.getElementById('install-btn');
        const hasValidUrl = game.url && !game.url.includes('example.com') && this.isValidUrl(game.url);
        if (installBtn) {
            installBtn.innerHTML = hasValidUrl ? '<span>⬇️</span> Download & Install' : '<span>🔒</span> Tidak Tersedia';
            installBtn.disabled = !hasValidUrl;
            installBtn.onclick = () => this.confirmInstall();
        }

        this.openModal('install-modal');
    }

    // ========== DOWNLOAD & INSTALL ==========
    quickDownload(gameId) {
        const catalog = this.getGameCatalog();
        const game = catalog.find(g => g.id === gameId);
        
        if (!game) {
            this.showToast('Game tidak ditemukan', 'error');
            return;
        }

        if (!game.url || game.url.includes('example.com') || !this.isValidUrl(game.url)) {
            this.showToast('URL tidak valid: ' + (game.title || 'Game ini'), 'error');
            return;
        }

        this.startDownload(game);
    }

    downloadFeatured() {
        const featured = this.featuredGames[0] || this.getGameCatalog()[0];
        if (featured) {
            this.startDownload(featured);
        }
    }

    confirmInstall() {
        if (!this.selectedGame) {
            this.showToast('Tidak ada game dipilih', 'error');
            return;
        }

        this.closeModal('install-modal');

        if (!this.selectedGame.url || this.selectedGame.url.includes('example.com') || !this.isValidUrl(this.selectedGame.url)) {
            this.showToast('URL tidak valid untuk game ini', 'error');
            return;
        }

        this.startDownload(this.selectedGame);
    }

    async startDownload(game) {
        if (!game.url || !this.isValidUrl(game.url)) {
            this.showToast('URL tidak tersedia untuk: ' + (game.title || 'Game ini'), 'error');
            return;
        }

        // If on PS4, show option to download to PS4 notifications
        if (this.isPS4) {
            this.showDownloadMethodChoice(game);
            return;
        }

        this.startBrowserDownload(game);
    }

    showDownloadMethodChoice(game) {
        // Create modal if not exists
        let modal = document.getElementById('download-method-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'download-method-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="ps-modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>⬇️ Metode Download</h3>
                        <button class="close-btn" onclick="app.closeModal('download-method-modal')">×</button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                        <img id="method-game-image" src="" alt="Game" style="width: 120px; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
                        <h4 id="method-game-title" style="margin-bottom: 5px;"></h4>
                        <p id="method-game-size" style="color: var(--ps-text-secondary); margin-bottom: 20px;"></p>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <button class="ps-btn-primary" onclick="app.confirmPS4NotificationDownload()" style="font-size: 16px; padding: 18px;">
                                📱 <strong>Download ke Notifikasi PS4</strong>
                                <br><small style="font-weight: normal; opacity: 0.8;">Menggunakan GoldHEN - Muncul di notifikasi sistem PS4</small>
                            </button>
                            <button class="ps-btn-secondary" onclick="app.confirmBrowserDownload()" style="font-size: 16px; padding: 18px;">
                                🌐 <strong>Download di Browser</strong>
                                <br><small style="font-weight: normal; opacity: 0.8;">Download manual via browser, lalu install</small>
                            </button>
                        </div>
                        <p style="margin-top: 15px; font-size: 12px; color: var(--ps-warning);">
                            ⚠️ Pastikan GoldHEN aktif untuk download ke notifikasi PS4
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update modal content
        const imageEl = document.getElementById('method-game-image');
        const titleEl = document.getElementById('method-game-title');
        const sizeEl = document.getElementById('method-game-size');

        if (imageEl) imageEl.src = this.getGameImage(game);
        if (titleEl) titleEl.textContent = game.title || 'Unknown';
        if (sizeEl) sizeEl.textContent = this.formatSize(game.size || 0);

        // Store selected game for callback
        this.pendingDownloadGame = game;

        this.openModal('download-method-modal');
    }

    confirmPS4NotificationDownload() {
        const game = this.pendingDownloadGame;
        this.closeModal('download-method-modal');
        this.pendingDownloadGame = null;
        
        if (game) {
            this.startPS4NotificationDownload(game);
        }
    }

    confirmBrowserDownload() {
        const game = this.pendingDownloadGame;
        this.closeModal('download-method-modal');
        this.pendingDownloadGame = null;
        
        if (game) {
            this.startBrowserDownload(game);
        }
    }

    async startPS4NotificationDownload(game) {
        if (!game.url || !this.isValidUrl(game.url)) {
            this.showToast('URL tidak tersedia untuk: ' + (game.title || 'Game ini'), 'error');
            return;
        }

        const progressImage = document.getElementById('progress-image');
        if (progressImage) progressImage.src = this.getGameImage(game);

        const progressFilename = document.getElementById('progress-filename');
        if (progressFilename) progressFilename.textContent = (game.title || 'Game') + '.pkg';

        const progressStatus = document.getElementById('progress-status');
        if (progressStatus) progressStatus.textContent = 'Mengirim ke notifikasi PS4...';

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = '0%';

        const progressPercent = document.getElementById('progress-percent');
        if (progressPercent) progressPercent.textContent = '0%';

        const progressBytes = document.getElementById('progress-bytes');
        if (progressBytes) progressBytes.textContent = 'Mengirim ke sistem PS4...';

        const openGameBtn = document.getElementById('open-game-btn');
        if (openGameBtn) openGameBtn.style.display = 'none';

        this.openModal('progress-modal');

        try {
            const expectedSha256 = game.pkg?.sha256 || game.sha256 || null;
            const expectedSize = game.size || 0;

            const result = await this.downloadManager.downloadToPS4Notifications(
                game.url,
                (game.title || 'game') + '.pkg',
                game.title || 'Game',
                { 
                    size: expectedSize, 
                    sha256: expectedSha256,
                    titleId: game.title_id || game.contentId,
                    version: game.version,
                    category: game.category,
                    autoInstall: true
                }
            );

            if (result.success) {
                this.showToast('Download dikirim ke notifikasi PS4!', 'success');
                // Close progress modal after a delay
                setTimeout(() => this.closeModal('progress-modal'), 2000);
            } else {
                this.showToast('Gagal: ' + (result.error || 'Unknown error'), 'error');
                this.closeModal('progress-modal');
            }
        } catch (error) {
            console.error('PS4 notification download error:', error);
            this.showToast('Download gagal: ' + error.message, 'error');
            this.closeModal('progress-modal');
        }
    }

    async startBrowserDownload(game) {
        if (!game.url || !this.isValidUrl(game.url)) {
            this.showToast('URL tidak tersedia untuk: ' + (game.title || 'Game ini'), 'error');
            return;
        }

        const progressImage = document.getElementById('progress-image');
        if (progressImage) progressImage.src = this.getGameImage(game);

        const progressFilename = document.getElementById('progress-filename');
        if (progressFilename) progressFilename.textContent = (game.title || 'Game') + '.pkg';

        const progressStatus = document.getElementById('progress-status');
        if (progressStatus) progressStatus.textContent = 'Connecting...';

        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = '0%';

        const progressPercent = document.getElementById('progress-percent');
        if (progressPercent) progressPercent.textContent = '0%';

        const progressBytes = document.getElementById('progress-bytes');
        if (progressBytes) progressBytes.textContent = '0 MB / ' + this.formatSize(game.size || 0);

        const openGameBtn = document.getElementById('open-game-btn');
        if (openGameBtn) openGameBtn.style.display = 'none';

        this.openModal('progress-modal');

        try {
            // Get SHA256 from game data (pkg.sha256 or game.sha256)
            const expectedSha256 = game.pkg?.sha256 || game.sha256 || null;
            const expectedSize = game.size || 0;

            const success = await this.downloadManager.addDownload(
                game.url,
                (game.title || 'game') + '.pkg',
                game.title || 'Game',
                { size: expectedSize, sha256: expectedSha256 }
            );

            if (success) {
                this.showToast('Download dimulai: ' + (game.title || 'Game'), 'success');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download gagal: ' + error.message, 'error');
            this.closeModal('progress-modal');
        }
    }

    cancelDownload() {
        this.downloadManager.cancelCurrentDownload();
        this.closeModal('progress-modal');
        this.showToast('Download dibatalkan', 'warning');
    }

    openInstalledGame() {
        this.showToast('Game sudah diinstal!', 'success');
    }

    // ========== URL DOWNLOAD ==========
    showUrlDownload() {
        document.getElementById('pkg-url').value = '';
        document.getElementById('pkg-name').value = '';
        this.openModal('url-modal');
    }

    async downloadFromUrl() {
        const url = document.getElementById('pkg-url').value.trim();
        const name = document.getElementById('pkg-name').value.trim();

        if (!url) {
            this.showToast('Masukkan URL PKG', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showToast('URL tidak valid', 'error');
            return;
        }

        this.closeModal('url-modal');

        const filename = name ? name + '.pkg' : 'game.pkg';
        const title = name || 'Game';

        try {
            const success = await this.downloadManager.addDownload(url, filename, title);
            if (success) {
                this.showToast('Download dimulai', 'success');
            }
        } catch (error) {
            this.showToast('Download gagal: ' + error.message, 'error');
        }
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'https:' || url.protocol === 'http:';
        } catch (_) {
            return false;
        }
    }

    // ========== FAVORITES ==========
    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('ps4StoreFavorites') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveFavorites() {
        localStorage.setItem('ps4StoreFavorites', JSON.stringify(this.favorites));
    }

    addToFavorites() {
        if (!this.selectedGame) return;

        const gameId = this.selectedGame.id;
        if (!this.favorites.includes(gameId)) {
            this.favorites.push(gameId);
            this.saveFavorites();
            this.showToast('Ditambahkan ke favorit ❤️', 'success');
        } else {
            this.showToast('Sudah ada di favorit', 'info');
        }
    }

    removeFromFavorites(gameId) {
        this.favorites = this.favorites.filter(id => id !== gameId);
        this.saveFavorites();
        this.renderFavorites();
    }

    toggleFavorites() {
        this.renderFavorites();
        this.openModal('favorites-modal');
    }

    showSettings() {
        // Create modal if not exists
        let modal = document.getElementById('settings-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settings-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="ps-modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>⚙️ Pengaturan</h3>
                        <button class="close-btn" onclick="app.closeModal('settings-modal')">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="setting-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">🌐 GoldHEN URL</label>
                            <input type="url" id="goldhen-url-input" placeholder="http://localhost:12800" style="width: 100%; padding: 12px; background: var(--ps-light-gray); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: var(--ps-text); font-size: 14px;">
                            <p style="font-size: 12px; color: var(--ps-text-secondary); margin-top: 5px;">URL endpoint GoldHEN untuk download ke notifikasi PS4</p>
                            <button class="ps-btn-secondary" onclick="app.testGoldHENConnection()" style="margin-top: 10px; font-size: 12px; padding: 8px 16px;">🔍 Test Koneksi GoldHEN</button>
                            <div id="goldhen-test-result" style="margin-top: 8px; font-size: 12px; min-height: 18px;"></div>
                        </div>
                        <div class="setting-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="auto-refresh-toggle" style="width: 18px; height: 18px; accent-color: var(--ps-light-blue);">
                                <span>🔄 Auto-refresh katalog (setiap 30 menit)</span>
                            </label>
                        </div>
                        <div class="setting-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="verify-sha256-toggle" style="width: 18px; height: 18px; accent-color: var(--ps-light-blue);">
                                <span>🔐 Verifikasi SHA256 otomatis setelah download</span>
                            </label>
                        </div>
                        <div class="setting-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="keep-pkg-toggle" style="width: 18px; height: 18px; accent-color: var(--ps-light-blue);">
                                <span>💾 Simpan file PKG setelah install</span>
                            </label>
                        </div>
                        <div class="setting-group">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">🧹 Data & Cache</label>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="ps-btn-secondary" onclick="app.clearCache()" style="font-size: 12px; padding: 8px 16px;">🗑️ Hapus Cache Katalog</button>
                                <button class="ps-btn-secondary" onclick="app.clearAllData()" style="font-size: 12px; padding: 8px 16px;">🗑️ Hapus Semua Data</button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="ps-btn-secondary" onclick="app.closeModal('settings-modal')">Batal</button>
                        <button class="ps-btn-primary" onclick="app.saveSettings()">💾 Simpan</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Load current settings
        const goldhenInput = document.getElementById('goldhen-url-input');
        const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
        const verifySha256Toggle = document.getElementById('verify-sha256-toggle');
        const keepPkgToggle = document.getElementById('keep-pkg-toggle');

        if (goldhenInput) goldhenInput.value = this.goldhenUrl;
        if (autoRefreshToggle) autoRefreshToggle.checked = localStorage.getItem('autoRefresh') !== 'false';
        if (verifySha256Toggle) verifySha256Toggle.checked = localStorage.getItem('verifySha256') !== 'false';
        if (keepPkgToggle) keepPkgToggle.checked = localStorage.getItem('keepPkgAfterInstall') === 'true';

        this.openModal('settings-modal');
    }

    async testGoldHENConnection() {
        const resultEl = document.getElementById('goldhen-test-result');
        if (resultEl) resultEl.innerHTML = '<span style="color: var(--ps-light-blue);">🔄 Memeriksa koneksi GoldHEN...</span>';
        
        try {
            const result = await this.pkgInstaller.testGoldHENConnection();
            if (resultEl) {
                if (result.available) {
                    resultEl.innerHTML = '<span style="color: var(--ps-success);">✅ GoldHEN terhubung di ' + this.goldhenUrl + (result.cached ? ' (cached)' : '') + '</span>';
                } else {
                    resultEl.innerHTML = '<span style="color: var(--ps-error);">❌ GoldHEN tidak terhubung: ' + (result.reason || 'Connection failed') + '</span>';
                }
            }
        } catch (e) {
            if (resultEl) resultEl.innerHTML = '<span style="color: var(--ps-error);">❌ Error: ' + e.message + '</span>';
        }
    }

    saveSettings() {
        const goldhenInput = document.getElementById('goldhen-url-input');
        const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
        const verifySha256Toggle = document.getElementById('verify-sha256-toggle');
        const keepPkgToggle = document.getElementById('keep-pkg-toggle');

        if (goldhenInput && goldhenInput.value.trim()) {
            this.goldhenUrl = goldhenInput.value.trim();
            localStorage.setItem('goldhenUrl', this.goldhenUrl);
            this.pkgInstaller.setGoldHENUrl(this.goldhenUrl);
        }

        if (autoRefreshToggle) {
            localStorage.setItem('autoRefresh', autoRefreshToggle.checked.toString());
            if (autoRefreshToggle.checked) {
                this.setupAutoRefresh();
            } else if (this.autoRefreshTimer) {
                clearInterval(this.autoRefreshTimer);
                this.autoRefreshTimer = null;
            }
        }

        if (verifySha256Toggle) {
            localStorage.setItem('verifySha256', verifySha256Toggle.checked.toString());
        }

        if (keepPkgToggle) {
            localStorage.setItem('keepPkgAfterInstall', keepPkgToggle.checked.toString());
        }

        this.showToast('Pengaturan disimpan!', 'success');
        this.closeModal('settings-modal');
    }

    clearCache() {
        this.api.clearCache();
        localStorage.removeItem('ps4StoreGames');
        localStorage.removeItem('ps4StoreCategories');
        localStorage.removeItem('catalogVersion');
        localStorage.removeItem('catalogUpdated');
        this.showToast('Cache dihapus. Memuat ulang katalog...', 'info');
        this.loadCatalog();
        this.closeModal('settings-modal');
    }

    clearAllData() {
        if (confirm('⚠️ Hapus SEMUA data (katalog, favorit, riwayat, pengaturan)?\n\nTindakan ini tidak dapat dibatalkan!')) {
            localStorage.clear();
            this.showToast('Semua data dihapus!', 'success');
            this.closeModal('settings-modal');
            setTimeout(() => location.reload(), 1000);
        }
    }

    renderFavorites() {
        const container = document.getElementById('favorites-list');
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = '<p class="empty-message">Belum ada favorit</p>';
            return;
        }

        const catalog = this.getGameCatalog();
        const favoriteGames = this.favorites
            .map(id => catalog.find(g => g.id === id))
            .filter(g => g);

        container.innerHTML = favoriteGames.map(game => `
            <div class="favorite-item">
                <img src="${this.getGameImage(game)}" alt="${game.title}">
                <div class="favorite-item-info">
                    <h4>${game.title || 'Unknown'}</h4>
                    <p>${this.formatSize(game.size || 0)}</p>
                </div>
                <button class="ps-btn-secondary" onclick="app.removeFromFavorites(${game.id})">🗑️</button>
                <button class="ps-btn-primary" onclick="app.quickDownload(${game.id})">⬇️</button>
            </div>
        `).join('');
    }

    clearFavorites() {
        this.favorites = [];
        this.saveFavorites();
        this.renderFavorites();
        this.showToast('Favorit dihapus', 'success');
    }

    // ========== DOWNLOAD HISTORY ==========
    loadDownloadHistory() {
        try {
            return JSON.parse(localStorage.getItem('ps4StoreDownloadHistory') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveDownloadHistory(history) {
        localStorage.setItem('ps4StoreDownloadHistory', JSON.stringify(history));
    }

    addToDownloadHistory(game) {
        const history = this.loadDownloadHistory();
        const entry = {
            title_id: game.title_id || game.contentId || game.id,
            title: game.title || 'Unknown',
            version: game.version || '1.0',
            size: game.size || 0,
            category: game.category || 'unknown',
            downloaded: new Date().toISOString()
        };
        
        // Remove existing entry with same title_id
        const filtered = history.filter(h => h.title_id !== entry.title_id);
        filtered.unshift(entry);
        
        // Keep last 50 entries
        if (filtered.length > 50) {
            filtered.length = 50;
        }
        
        this.saveDownloadHistory(filtered);
    }

    clearDownloadHistory() {
        this.saveDownloadHistory([]);
        this.showToast('Riwayat download dihapus', 'success');
    }

    showDownloadHistory() {
        const history = this.loadDownloadHistory();
        
        // Create modal if not exists
        let modal = document.getElementById('history-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'history-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="ps-modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>📥 Riwayat Download</h3>
                        <button class="close-btn" onclick="app.closeModal('history-modal')">×</button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh;">
                        <div class="history-actions" style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span id="history-count" style="color: var(--ps-text-secondary); font-size: 13px;">${history.length} item</span>
                            <button class="ps-btn-secondary" onclick="app.clearDownloadHistory(); app.showDownloadHistory();">🗑️ Hapus Semua</button>
                        </div>
                        <div id="history-list" class="history-list">
                            ${history.length === 0 ? '<p class="empty-message" style="text-align: center; padding: 40px;">Belum ada riwayat download</p>' : history.map(item => `
                                <div class="history-item" style="display: flex; align-items: center; gap: 15px; padding: 12px; background: var(--ps-light-gray); border-radius: 8px; margin-bottom: 8px;">
                                    <img src="${this.getGameImage({id: item.title_id, title: item.title, category: item.category, image: null})}" alt="${item.title}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;">
                                    <div class="history-item-info" style="flex: 1; min-width: 0;">
                                        <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
                                        <p style="color: var(--ps-text-secondary); font-size: 12px;">${item.category} • ${this.formatSize(item.size)} • v${item.version}</p>
                                        <p style="color: var(--ps-text-secondary); font-size: 11px;">${new Date(item.downloaded).toLocaleString('id-ID')}</p>
                                    </div>
                                    <button class="ps-btn-primary" onclick="app.downloadFromHistory('${item.title_id}')" style="padding: 8px 16px; font-size: 12px;">⬇️ Download</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="ps-btn-primary" onclick="app.closeModal('history-modal')">Tutup</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            // Update existing modal
            const list = modal.querySelector('#history-list');
            const count = modal.querySelector('#history-count');
            if (list) {
                list.innerHTML = history.length === 0 ? '<p class="empty-message" style="text-align: center; padding: 40px;">Belum ada riwayat download</p>' : history.map(item => `
                    <div class="history-item" style="display: flex; align-items: center; gap: 15px; padding: 12px; background: var(--ps-light-gray); border-radius: 8px; margin-bottom: 8px;">
                        <img src="${this.getGameImage({id: item.title_id, title: item.title, category: item.category, image: null})}" alt="${item.title}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;">
                        <div class="history-item-info" style="flex: 1; min-width: 0;">
                            <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
                            <p style="color: var(--ps-text-secondary); font-size: 12px;">${item.category} • ${this.formatSize(item.size)} • v${item.version}</p>
                            <p style="color: var(--ps-text-secondary); font-size: 11px;">${new Date(item.downloaded).toLocaleString('id-ID')}</p>
                        </div>
                        <button class="ps-btn-primary" onclick="app.downloadFromHistory('${item.title_id}')" style="padding: 8px 16px; font-size: 12px;">⬇️ Download</button>
                    </div>
                `).join('');
            }
            if (count) count.textContent = `${history.length} item`;
        }
        
        this.openModal('history-modal');
    }

    downloadFromHistory(titleId) {
        const catalog = this.getGameCatalog();
        const game = catalog.find(g => (g.title_id || g.contentId || g.id) === titleId);
        if (game) {
            this.closeModal('history-modal');
            this.startDownload(game);
        } else {
            this.showToast('Game tidak ditemukan di katalog saat ini', 'error');
        }
    }

    // ========== STATS ==========
    updateStats() {
        const catalog = this.getGameCatalog();
        const totalGames = catalog.filter(g => g.category === 'games').length;
        const totalApps = catalog.filter(g => g.category === 'apps').length;
        const totalSize = catalog.reduce((acc, g) => acc + (g.size || 0), 0);

        const gamesEl = document.getElementById('total-games');
        const appsEl = document.getElementById('total-apps');
        const sizeEl = document.getElementById('total-size');

        if (gamesEl) gamesEl.textContent = totalGames;
        if (appsEl) appsEl.textContent = totalApps;
        if (sizeEl) sizeEl.textContent = this.formatSize(totalSize);
    }

    // ========== UPDATE DETECTION ==========
    checkForUpdates() {
        const catalog = this.getGameCatalog();
        const installed = this.getInstalledGames();
        const updates = [];
        
        for (const game of catalog) {
            const installedGame = installed.find(g => g.title_id === (game.title_id || game.contentId));
            if (installedGame && game.version && installedGame.version !== game.version) {
                updates.push({
                    game: game,
                    currentVersion: installedGame.version,
                    newVersion: game.version,
                    changelog: game.changelog
                });
            }
        }
        
        return updates;
    }

    getInstalledGames() {
        try {
            return JSON.parse(localStorage.getItem('ps4StoreInstalled') || '[]');
        } catch (e) {
            return [];
        }
    }

    markAsInstalled(game) {
        const installed = this.getInstalledGames();
        const titleId = game.title_id || game.contentId || game.id;
        
        const existing = installed.findIndex(g => g.title_id === titleId);
        const entry = {
            title_id: titleId,
            title: game.title,
            version: game.version,
            installedAt: new Date().toISOString()
        };
        
        if (existing >= 0) {
            installed[existing] = entry;
        } else {
            installed.unshift(entry);
        }
        
        localStorage.setItem('ps4StoreInstalled', JSON.stringify(installed));
    }

    showUpdates() {
        const updates = this.checkForUpdates();
        
        let modal = document.getElementById('updates-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'updates-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="ps-modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>🔄 Update Tersedia</h3>
                        <button class="close-btn" onclick="app.closeModal('updates-modal')">×</button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh;">
                        <div id="updates-list" class="updates-list">
                            ${updates.length === 0 ? '<p class="empty-message" style="text-align: center; padding: 40px;">Semua game sudah versi terbaru</p>' : updates.map(u => `
                                <div class="update-item" style="background: var(--ps-light-gray); border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                        <div>
                                            <h4>${u.game.title}</h4>
                                            <p style="color: var(--ps-text-secondary); font-size: 13px;">Versi saat ini: ${u.currentVersion} → Baru: ${u.newVersion}</p>
                                        </div>
                                        <span class="badge badge-updates" style="background: var(--ps-warning); color: var(--ps-dark);">UPDATE</span>
                                    </div>
                                    ${u.changelog ? `<div class="update-changelog" style="font-size: 12px; color: var(--ps-text-secondary); background: var(--ps-dark); padding: 10px; border-radius: 4px; white-space: pre-wrap; max-height: 100px; overflow-y: auto;">${u.changelog}</div>` : ''}
                                    <button class="ps-btn-primary" onclick="app.updateGame('${u.game.id}')" style="margin-top: 10px; width: 100%;">⬇️ Update Sekarang</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="ps-btn-primary" onclick="app.closeModal('updates-modal')">Tutup</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            const list = modal.querySelector('#updates-list');
            if (list) {
                list.innerHTML = updates.length === 0 ? '<p class="empty-message" style="text-align: center; padding: 40px;">Semua game sudah versi terbaru</p>' : updates.map(u => `
                    <div class="update-item" style="background: var(--ps-light-gray); border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div>
                                <h4>${u.game.title}</h4>
                                <p style="color: var(--ps-text-secondary); font-size: 13px;">Versi saat ini: ${u.currentVersion} → Baru: ${u.newVersion}</p>
                            </div>
                            <span class="badge badge-updates" style="background: var(--ps-warning); color: var(--ps-dark);">UPDATE</span>
                        </div>
                        ${u.changelog ? `<div class="update-changelog" style="font-size: 12px; color: var(--ps-text-secondary); background: var(--ps-dark); padding: 10px; border-radius: 4px; white-space: pre-wrap; max-height: 100px; overflow-y: auto;">${u.changelog}</div>` : ''}
                        <button class="ps-btn-primary" onclick="app.updateGame('${u.game.id}')" style="margin-top: 10px; width: 100%;">⬇️ Update Sekarang</button>
                    </div>
                `).join('');
            }
        }
        
        this.openModal('updates-modal');
    }

    updateGame(gameId) {
        const catalog = this.getGameCatalog();
        const game = catalog.find(g => g.id === gameId);
        if (game) {
            this.closeModal('updates-modal');
            this.startDownload(game);
        }
    }

    // ========== OFFLINE MODE ==========
    isOnline() {
        return navigator.onLine;
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showToast('Koneksi internet pulih', 'success');
            if (this.catalogLoaded) {
                this.refreshCatalogSilent();
            }
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Mode offline - Menggunakan katalog cache', 'warning');
            this.showOfflineBanner();
        });
        
        // Check initial state
        if (!this.isOnline()) {
            this.showOfflineBanner();
        }
    }

    showOfflineBanner() {
        let banner = document.getElementById('offline-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: var(--ps-warning); color: var(--ps-dark); padding: 10px; text-align: center; z-index: 9999; font-weight: 600;';
            banner.innerHTML = '📴 Mode Offline - Menggunakan katalog tersimpan. Beberapa fitur mungkin tidak tersedia.';
            document.body.insertBefore(banner, document.body.firstChild);
        }
        banner.style.display = 'block';
    }

    hideOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) banner.style.display = 'none';
    }

    // ========== MODALS ==========
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    setupModals() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay').forEach(modal => {
                    modal.style.display = 'none';
                });
                document.body.style.overflow = '';
            }
        });
    }

    // ========== UTILITIES ==========
    formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-message">${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadMore() {
        this.showToast('Semua game sudah dimuat', 'info');
    }

    async refreshCatalog() {
        this.showToast('Memperbarui katalog...', 'info');
        try {
            await this.api.forceRefresh();
            await this.loadCatalog();
            this.showToast('Katalog diperbarui!', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showToast('Gagal memperbarui katalog', 'error');
        }
    }

    getLastUpdated() {
        return localStorage.getItem('catalogUpdated') || 'Belum pernah';
    }

    updateLastUpdatedDisplay() {
        const el = document.getElementById('last-updated');
        if (el) {
            const updated = this.getLastUpdated();
            el.textContent = `Terakhir: ${updated}`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new PS4StoreApp();
});

