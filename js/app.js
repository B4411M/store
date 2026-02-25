/**
 * PS4 HEN Store - Main Application
 * Uses localStorage for game data (persistent across refresh)
 */

class PS4StoreApp {
    constructor() {
        this.downloadManager = new DownloadManager(this);
        this.pkgInstaller = new PKGInstaller(this);
        this.currentCategory = 'all';
        this.selectedGame = null;
        this.featuredIndex = 0;
        this.featuredGames = [];
        this.favorites = this.loadFavorites();
        this.isPS4 = this.detectPS4();
        this.init();
    }

    detectPS4() {
        const userAgent = navigator.userAgent || window.navigator.userAgent;
        return /PlayStation 4/i.test(userAgent) || /Orbis/i.test(userAgent);
    }

    init() {
        console.log('PS4 HEN Store initializing...');
        console.log('Running on PS4:', this.isPS4);
        console.log('Games loaded:', this.getGameCatalog().length);

        this.setupNavigation();
        this.setupSearch();
        this.setupCategoryButtons();
        this.renderFeatured();
        this.renderTopDownloads();
        this.renderGameCatalog();
        this.updateStats();
        this.setupModals();

        if (!this.isPS4) {
            this.showToast('Demo Mode - Buka di PS4 untuk fitur lengkap', 'info');
        }

        console.log('PS4 HEN Store ready!');
    }

    // ========== GAME CATALOG ==========
    getGameCatalog() {
        // First, try to load from localStorage (primary)
        try {
            const saved = localStorage.getItem('ps4StoreGames');
            if (saved && JSON.parse(saved).length > 0) {
                console.log('Loading from localStorage:', JSON.parse(saved).length);
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }

        // Fall back to embedded PS4_GAME_CATALOG
        try {
            if (typeof PS4_GAME_CATALOG !== 'undefined') {
                console.log('Loading from games-data.js (fallback):', PS4_GAME_CATALOG.length);
                return PS4_GAME_CATALOG;
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
    }

    updateHero(category) {
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');
        const heroBadge = document.getElementById('hero-badge');

        if (!heroTitle) return;

        const titles = {
            'all': 'PS4 HEN STORE',
            'games': 'Game PS4',
            'apps': 'Aplikasi Homebrew',
            'updates': 'Update & Patch',
            'dlc': 'DLC Content'
        };

        const descs = {
            'all': 'Download dan install game langsung di PS4 Anda dengan satu klik',
            'games': 'Koleksi game lengkap untuk PS4 homebrew',
            'apps': 'Aplikasi dan tools homebrew untuk PS4',
            'updates': 'Update dan patch terbaru untuk game',
            'dlc': 'Konten tambahan untuk game kesayangan Anda'
        };

        const badges = {
            'all': '🔥 Unggulan',
            'games': '🎮 Game',
            'apps': '📱 Apps',
            'updates': '🔄 Update',
            'dlc': '📦 DLC'
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
        const results = catalog.filter(game =>
            (game.title && game.title.toLowerCase().includes(query.toLowerCase())) ||
            (game.description && game.description.toLowerCase().includes(query.toLowerCase())) ||
            (game.publisher && game.publisher.toLowerCase().includes(query.toLowerCase()))
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
        let games = this.currentCategory === 'all' 
            ? this.getGameCatalog() 
            : this.getGameCatalog().filter(g => g.category === this.currentCategory);

        games.sort((a, b) => b.id - a.id);
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
        const labels = { 'games': 'GAME', 'apps': 'APP', 'updates': 'UPDATE', 'dlc': 'DLC' };
        return labels[category] || category?.toUpperCase() || 'GAME';
    }

    getGameImage(game) {
        if (game.image && (game.image.startsWith('http') || game.image.startsWith('data:'))) {
            return game.image;
        }
        const icons = { 'games': '🎮', 'apps': '📱', 'updates': '🔄', 'dlc': '📦' };
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
        const publisherEl = document.getElementById('modal-publisher');
        const sizeEl = document.getElementById('modal-size');
        const versionEl = document.getElementById('modal-version');
        const categoryEl = document.getElementById('modal-category');
        const ratingEl = document.getElementById('modal-rating');
        const descEl = document.getElementById('modal-description');

        if (titleEl) titleEl.textContent = game.title || 'Unknown';
        if (imageEl) imageEl.src = this.getGameImage(game);
        if (publisherEl) publisherEl.textContent = game.publisher || 'Unknown';
        if (sizeEl) sizeEl.textContent = this.formatSize(game.size || 0);
        if (versionEl) versionEl.textContent = game.version || '1.0';
        if (categoryEl) categoryEl.textContent = this.getCategoryLabel(game.category);
        if (ratingEl) ratingEl.textContent = game.rating || 'M';
        if (descEl) descEl.textContent = game.description || 'Deskripsi tidak tersedia';

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
            const success = await this.downloadManager.addDownload(
                game.url,
                (game.title || 'game') + '.pkg',
                game.title || 'Game'
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new PS4StoreApp();
});

