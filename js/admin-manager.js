/**
 * PS4 HEN Store - Admin Dashboard Manager
 * Saves to localStorage + auto-download games-data.js after add/edit
 */

class AdminManager {
    constructor() {
        this.games = [];
        this.editingGameId = null;
        this.deleteGameId = null;
        this.changes = false;
        this.init();
    }

    // ========== INITIALIZATION ==========
    init() {
        console.log('Admin Dashboard initializing...');
        this.loadGames();
        this.renderStats();
        this.renderGames();
        this.setupAutoSave();
    }

    // ========== DATA MANAGEMENT ==========
    loadGames() {
        try {
            const saved = localStorage.getItem('ps4StoreGames');
            if (saved && JSON.parse(saved).length > 0) {
                console.log('Loading from localStorage...');
                this.games = JSON.parse(saved);
                return;
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }

        try {
            if (typeof PS4_GAME_CATALOG !== 'undefined') {
                console.log('Loading from games-data.js (fallback)...');
                this.games = JSON.parse(JSON.stringify(PS4_GAME_CATALOG));
                
                this.games.forEach(game => {
                    if (!game.createdAt) {
                        game.createdAt = new Date(Date.now() - Math.random() * 10000000000).toISOString();
                    }
                    if (!game.downloads) {
                        game.downloads = Math.floor(Math.random() * 5000);
                    }
                });
                
                this.saveGames();
                console.log(`Saved ${this.games.length} games to localStorage`);
                return;
            }
        } catch (e) {
            console.warn('Could not load embedded catalog:', e);
        }

        this.games = [];
        console.log('Starting with empty catalog');
    }

    saveGames() {
        try {
            localStorage.setItem('ps4StoreGames', JSON.stringify(this.games));
            this.changes = true;
            this.renderDownloadButton();
            console.log('Games saved to localStorage:', this.games.length);
        } catch (e) {
            console.error('Could not save to localStorage:', e);
            this.showToast('Warning: Could not save data', 'warning');
        }
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.changes) {
                this.saveGames();
            }
        }, 5000);
    }

    // ========== GAME CRUD ==========
    addGame(gameData) {
        const newGame = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            downloads: 0,
            ...gameData
        };

        this.games.unshift(newGame);
        this.changes = true;
        this.saveGames();
        
        this.renderStats();
        this.renderGames();
        
        this.showToast('✅ Game berhasil ditambahkan!', 'success');
        
        // Auto-download games-data.js after adding game
        this.downloadGamesDataFile();
        
        return newGame;
    }

    updateGame(id, gameData) {
        const index = this.games.findIndex(g => g.id === id);
        if (index !== -1) {
            this.games[index] = {
                ...this.games[index],
                ...gameData,
                updatedAt: new Date().toISOString()
            };
            this.changes = true;
            this.saveGames();
            
            this.renderStats();
            this.renderGames();
            
            this.showToast('✅ Game berhasil diperbarui!', 'success');
            
            // Auto-download games-data.js after updating game
            this.downloadGamesDataFile();
            
            return this.games[index];
        }
        return null;
    }

    deleteGame(id) {
        const index = this.games.findIndex(g => g.id === id);
        if (index !== -1) {
            const deleted = this.games.splice(index, 1)[0];
            this.changes = true;
            this.saveGames();
            
            this.renderStats();
            this.renderGames();
            
            this.showToast('Game dihapus: ' + deleted.title, 'success');
            return true;
        }
        return false;
    }

    // ========== DOWNLOAD GAMES-DATA.JS ==========
    downloadGamesDataFile() {
        const fileContent = this.generateGamesDataFile();
        
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'games-data.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('✅ games-data.js terunduh otomatis!', 'success');
    }

    generateGamesDataFile() {
        const gamesJson = JSON.stringify(this.games, null, 4);
        
        return `/**
 * PS4 HEN Store - Game Catalog
 * Auto-generated by Admin Dashboard
 * Last updated: ${new Date().toISOString()}
 * 
 * Cara menggunakan:
 * 1. Ganti file js/games-data.js di project Anda dengan file ini
 * 2. Refresh halaman store untuk melihat perubahan
 */

const PS4_GAME_CATALOG = ${gamesJson};

// ========== HELPER FUNCTIONS ==========

function getAllGames() {
    return PS4_GAME_CATALOG;
}

function getGamesByCategory(category) {
    if (category === 'all') return PS4_GAME_CATALOG;
    return PS4_GAME_CATALOG.filter(game => game.category === category);
}

function getGameById(id) {
    return PS4_GAME_CATALOG.find(game => game.id === id);
}

function searchGames(query) {
    const lowerQuery = query.toLowerCase();
    return PS4_GAME_CATALOG.filter(game => 
        game.title.toLowerCase().includes(lowerQuery) ||
        (game.description && game.description.toLowerCase().includes(lowerQuery))
    );
}

function getFeaturedGames(limit = 4) {
    return PS4_GAME_CATALOG
        .filter(game => game.url && !game.url.includes('example.com'))
        .slice(0, limit);
}

function getTopDownloads(limit = 5) {
    return [...PS4_GAME_CATALOG]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, limit);
}

function getGameStats() {
    const games = PS4_GAME_CATALOG.filter(g => g.category === 'games');
    const apps = PS4_GAME_CATALOG.filter(g => g.category === 'apps');
    const updates = PS4_GAME_CATALOG.filter(g => g.category === 'updates');
    const dlc = PS4_GAME_CATALOG.filter(g => g.category === 'dlc');
    
    const totalSize = PS4_GAME_CATALOG.reduce((acc, g) => acc + (g.size || 0), 0);
    
    return {
        totalGames: games.length,
        totalApps: apps.length,
        totalUpdates: updates.length,
        totalDLC: dlc.length,
        totalItems: PS4_GAME_CATALOG.length,
        totalSize: totalSize
    };
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
`;
    }

    renderDownloadButton() {
        const btn = document.getElementById('download-btn');
        if (btn) {
            btn.style.display = this.changes ? 'inline-flex' : 'none';
        }
    }

    // ========== EXPORT/IMPORT JSON ==========
    exportCatalog() {
        const data = JSON.stringify(this.games, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ps4-store-catalog-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Catalog JSON diekspor!', 'success');
    }

    importCatalog(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                if (!Array.isArray(imported)) {
                    throw new Error('Invalid format');
                }

                if (confirm(`Import ${imported.length} game? Ini akan mengganti semua data.`)) {
                    this.games = imported;
                    this.changes = true;
                    this.saveGames();
                    this.renderStats();
                    this.renderGames();
                    this.showToast('Catalog diimpor!', 'success');
                    
                    // Auto-download after import
                    this.downloadGamesDataFile();
                }
            } catch (err) {
                this.showToast('Gagal import: Format tidak valid!', 'error');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }

    // ========== CLEAR DATA ==========
    clearAllData() {
        if (this.games.length === 0) {
            this.showToast('Tidak ada data untuk dihapus', 'warning');
            return;
        }

        if (confirm(`⚠️ Hapus SEMUA ${this.games.length} game?\n\nTindakan ini tidak dapat dibatalkan!`)) {
            if (confirm('Yakin? Ketik "HAPUS" untuk konfirmasi.')) {
                this.games = [];
                this.changes = true;
                this.saveGames();
                this.renderStats();
                this.renderGames();
                this.showToast('Semua data telah dihapus!', 'success');
            }
        }
    }

    // ========== FILTER & SORT ==========
    getFilteredGames() {
        const category = document.getElementById('admin-category-filter')?.value || 'all';
        const search = (document.getElementById('admin-search')?.value || '').toLowerCase();
        const sort = document.getElementById('admin-sort')?.value || 'newest';

        let filtered = [...this.games];

        if (category !== 'all') {
            filtered = filtered.filter(g => g.category === category);
        }

        if (search) {
            filtered = filtered.filter(g => 
                (g.title?.toLowerCase().includes(search)) ||
                (g.publisher?.toLowerCase().includes(search))
            );
        }

        switch (sort) {
            case 'newest':
                filtered.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));
                break;
            case 'oldest':
                filtered.sort((a, b) => (a.createdAt || a.id) - (b.createdAt || b.id));
                break;
            case 'name':
                filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'size':
                filtered.sort((a, b) => (b.size || 0) - (a.size || 0));
                break;
            case 'downloads':
                filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                break;
        }

        return filtered;
    }

    // ========== RENDER ==========
    renderStats() {
        const games = this.games;
        
        const totalGames = games.filter(g => g.category === 'games').length;
        const totalApps = games.filter(g => g.category === 'apps').length;
        const totalUpdates = games.filter(g => g.category === 'updates').length;
        const totalDlc = games.filter(g => g.category === 'dlc').length;
        const totalSize = games.reduce((acc, g) => acc + (g.size || 0), 0);
        const totalDownloads = games.reduce((acc, g) => acc + (g.downloads || 0), 0);

        const els = {
            'total-games': totalGames,
            'total-apps': totalApps,
            'total-updates': totalUpdates,
            'total-dlc': totalDlc,
            'storage-used': this.formatSize(totalSize),
            'total-downloads': this.formatNumber(totalDownloads)
        };

        Object.entries(els).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    renderGames() {
        const container = document.getElementById('game-table-body');
        const emptyState = document.getElementById('empty-state');
        const table = document.getElementById('game-table');

        const filtered = this.getFilteredGames();

        const countEl = document.getElementById('item-count');
        if (countEl) {
            countEl.textContent = `${filtered.length} item`;
        }

        if (filtered.length === 0) {
            if (table) table.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (table) table.style.display = 'table';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = filtered.map(game => this.createGameRow(game)).join('');
    }

    createGameRow(game) {
        const imageUrl = this.getGameImage(game);
        const isValid = this.isValidUrl(game.url);
        const size = this.formatSize(game.size || 0);
        const badgeClass = `badge-${game.category}`;
        
        const isNew = game.createdAt && (Date.now() - new Date(game.createdAt).getTime()) < 86400000;

        return `
            <tr class="${isNew ? 'new-row' : ''}">
                <td>${game.id}</td>
                <td><img src="${imageUrl}" alt="${game.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 55%22><rect fill=%22%231a1a1a%22 width=%2240%22 height=%2255%22/><text x=%2220%22 y=%2227%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%228%22>${encodeURIComponent(game.title?.substring(0, 10) || 'Game')}</text></svg>'"></td>
                <td class="title-cell" title="${game.title}">
                    ${game.title}
                    ${isNew ? '<span class="new-badge">BARU</span>' : ''}
                </td>
                <td><span class="badge ${badgeClass}">${game.category}</span></td>
                <td class="size-cell">${size}</td>
                <td>${game.publisher || '-'}</td>
                <td>${this.formatNumber(game.downloads || 0)}</td>
                <td>${isValid ? '<span class="status-valid">✓ Valid</span>' : '<span class="status-invalid">✗ Invalid</span>'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="admin.editGame(${game.id})" title="Edit">✏️</button>
                        <button class="btn-delete" onclick="admin.showDeleteConfirm(${game.id})" title="Hapus">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    getGameImage(game) {
        if (game.image && (game.image.startsWith('http') || game.image.startsWith('data:'))) {
            return game.image;
        }
        const icons = { games: '🎮', apps: '📱', updates: '🔄', dlc: '📦' };
        const icon = icons[game.category] || '🎮';
        return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 55'><rect fill='%231a1a1a' width='40' height='55'/><text x='20' y='35' text-anchor='middle' font-size='24'>${encodeURIComponent(icon)}</text></svg>`;
    }

    // ========== MODALS ==========
    showAddGameModal() {
        this.editingGameId = null;
        document.getElementById('modal-title').textContent = 'Tambah Game Baru';
        document.getElementById('game-form').reset();
        document.getElementById('game-id').value = '';
        this.openModal('game-modal');
    }

    editGame(id) {
        const game = this.games.find(g => g.id === id);
        if (!game) return;

        this.editingGameId = id;
        document.getElementById('modal-title').textContent = 'Edit Game';
        
        document.getElementById('game-id').value = game.id;
        document.getElementById('game-title').value = game.title || '';
        document.getElementById('game-category').value = game.category || 'games';
        document.getElementById('game-publisher').value = game.publisher || '';
        document.getElementById('game-version').value = game.version || '1.0';
        document.getElementById('game-rating').value = game.rating || 'M';
        document.getElementById('game-size').value = game.size || '';
        document.getElementById('game-url').value = game.url || '';
        document.getElementById('game-image').value = game.image || '';
        document.getElementById('game-description').value = game.description || '';
        document.getElementById('game-downloads').value = game.downloads || 0;

        this.openModal('game-modal');
    }

    closeModal() {
        document.getElementById('game-modal').style.display = 'none';
        this.editingGameId = null;
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // ========== SAVE GAME ==========
    saveGame(event) {
        event.preventDefault();

        const gameData = {
            title: document.getElementById('game-title').value.trim(),
            category: document.getElementById('game-category').value,
            publisher: document.getElementById('game-publisher').value.trim(),
            version: document.getElementById('game-version').value.trim() || '1.0',
            rating: document.getElementById('game-rating').value,
            size: parseInt(document.getElementById('game-size').value) || 0,
            url: document.getElementById('game-url').value.trim(),
            image: document.getElementById('game-image').value.trim(),
            description: document.getElementById('game-description').value.trim(),
            downloads: parseInt(document.getElementById('game-downloads').value) || 0
        };

        if (!gameData.title) {
            this.showToast('Judul game wajib diisi!', 'error');
            return;
        }

        if (!gameData.url) {
            this.showToast('URL PKG wajib diisi!', 'error');
            return;
        }

        if (!this.isValidUrl(gameData.url)) {
            this.showToast('URL tidak valid!', 'error');
            return;
        }

        if (!gameData.size || gameData.size <= 0) {
            this.showToast('Ukuran wajib diisi dan harus lebih dari 0!', 'error');
            return;
        }

        if (this.editingGameId) {
            this.updateGame(this.editingGameId, gameData);
        } else {
            this.addGame(gameData);
        }

        this.closeModal();
    }

    // ========== DELETE ==========
    showDeleteConfirm(id) {
        const game = this.games.find(g => g.id === id);
        if (!game) return;

        this.deleteGameId = id;
        document.getElementById('delete-game-title').textContent = game.title;
        this.openModal('delete-modal');
    }

    closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
        this.deleteGameId = null;
    }

    confirmDelete() {
        if (this.deleteGameId) {
            this.deleteGame(this.deleteGameId);
            this.closeDeleteModal();
        }
    }

    // ========== UTILITIES ==========
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'https:' || url.protocol === 'http:';
        } catch (_) {
            return false;
        }
    }

    formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-message">${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminManager();
});

