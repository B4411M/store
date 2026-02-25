/**
 * PS4 HEN Store - Enhanced Download Manager
 * Handles PKG downloads with progress tracking, queue management, and auto-install
 */

class DownloadManager {
    constructor(app) {
        this.app = app;
        this.queue = [];
        this.activeDownloads = new Map();
        this.currentDownload = null;
        this.history = this.loadHistory();
        this.isPS4 = this.detectPS4();
        this.maxConcurrent = 1; // One at a time for stability
        this.init();
    }

    detectPS4() {
        const userAgent = navigator.userAgent;
        return /PlayStation 4/i.test(userAgent) || /Orbis/i.test(userAgent);
    }

    init() {
        console.log('Download Manager initialized');
        this.loadFromStorage();
    }

    // ========== ADD DOWNLOAD ==========
    async addDownload(url, filename, title) {
        if (!url || !this.isValidUrl(url)) {
            this.app.showToast('URL tidak valid: ' + url, 'error');
            return false;
        }

        // Check if already in queue
        const existing = this.queue.find(d => d.url === url && d.status === 'pending');
        if (existing) {
            this.app.showToast('Sudah dalam antrian: ' + title, 'warning');
            return false;
        }

        const item = {
            id: Date.now(),
            url: url,
            filename: filename || 'game.pkg',
            title: title || filename,
            status: 'pending',
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
            speed: 0,
            eta: 0,
            addedAt: new Date().toISOString(),
            error: null
        };

        this.queue.push(item);
        this.saveToStorage();
        
        this.app.showToast('Ditambahkan ke antrian: ' + item.title, 'success');

        // Start download if no active download
        if (!this.currentDownload) {
            this.startNextDownload();
        }

        return true;
    }

    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'https:' || url.protocol === 'http:';
        } catch (_) {
            return false;
        }
    }

    // ========== START DOWNLOAD ==========
    async startNextDownload() {
        if (this.queue.length === 0) {
            this.currentDownload = null;
            return;
        }

        const nextItem = this.queue.find(d => d.status === 'pending');
        if (!nextItem) return;

        this.currentDownload = nextItem;
        nextItem.status = 'downloading';
        nextItem.startedAt = new Date().toISOString();
        this.saveToStorage();

        try {
            this.updateProgressUI(nextItem);
            await this.downloadFile(nextItem);
            
            nextItem.status = 'completed';
            nextItem.completedAt = new Date().toISOString();
            nextItem.progress = 100;
            this.saveToStorage();

            this.app.showToast('Download selesai: ' + nextItem.title, 'success');

            // Auto-install after download
            if (nextItem.downloadedBlob) {
                await this.autoInstall(nextItem);
            }

            // Start next download
            setTimeout(() => this.startNextDownload(), 500);

        } catch (error) {
            console.error('Download error:', error);
            nextItem.status = 'error';
            nextItem.error = error.message;
            this.saveToStorage();

            this.app.showToast('Download gagal: ' + error.message, 'error');

            // Try next download
            setTimeout(() => this.startNextDownload(), 1000);
        }
    }

    // ========== DOWNLOAD FILE ==========
    async downloadFile(item) {
        const controller = new AbortController();
        item.abortController = controller;

        // First, get file info
        try {
            const fileInfo = await this.getFileInfo(item.url);
            if (fileInfo && fileInfo.size) {
                item.totalBytes = fileInfo.size;
            }
        } catch (e) {
            console.warn('Could not get file info:', e);
        }

        // Start actual download
        const response = await fetch(item.url, {
            signal: controller.signal,
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Server returned: ' + response.status + ' ' + response.statusText);
        }

        const reader = response.body.getReader();
        const contentLength = item.totalBytes || parseInt(response.headers.get('content-length') || '0');
        let receivedLength = 0;
        const chunks = [];
        let lastUpdate = Date.now();
        let lastBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            // Update progress
            item.downloadedBytes = receivedLength;
            if (contentLength > 0) {
                item.progress = Math.round((receivedLength / contentLength) * 100);
            }

            // Calculate speed and ETA
            const now = Date.now();
            const elapsed = (now - lastUpdate) / 1000;
            if (elapsed >= 0.5) {
                const bytesDelta = receivedLength - lastBytes;
                item.speed = bytesDelta / elapsed;
                item.eta = item.speed > 0 ? (contentLength - receivedLength) / item.speed : 0;
                lastUpdate = now;
                lastBytes = receivedLength;
                
                // Update UI every 500ms
                this.updateProgressUI(item);
            }
        }

        // Create blob
        const blob = new Blob(chunks, { type: 'application/octet-stream' });
        item.downloadedBlob = blob;
        item.downloadedUrl = URL.createObjectURL(blob);
        item.progress = 100;

        this.updateProgressUI(item);
    }

    async getFileInfo(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return {
                size: parseInt(response.headers.get('content-length') || '0'),
                type: response.headers.get('content-type')
            };
        } catch (error) {
            console.warn('Could not get file info:', error);
            return null;
        }
    }

    getHeaders() {
        const headers = {
            'User-Agent': this.isPS4 
                ? 'Mozilla/5.0 (PlayStation 4) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/601.1'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        return headers;
    }

    // ========== PROGRESS UI ==========
    updateProgressUI(item) {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const progressBytes = document.getElementById('progress-bytes');
        const progressSpeed = document.getElementById('progress-speed');
        const progressEta = document.getElementById('progress-eta');
        const progressStatus = document.getElementById('progress-status');

        if (progressFill) {
            progressFill.style.width = item.progress + '%';
        }

        if (progressPercent) {
            progressPercent.textContent = item.progress + '%';
        }

        if (progressBytes) {
            const downloaded = this.formatSize(item.downloadedBytes);
            const total = this.formatSize(item.totalBytes || item.downloadedBytes);
            progressBytes.textContent = `${downloaded} / ${total}`;
        }

        if (progressSpeed && item.speed) {
            progressSpeed.textContent = this.formatSpeed(item.speed);
        }

        if (progressEta && item.eta) {
            progressEta.textContent = 'ETA: ' + this.formatTime(item.eta);
        }

        if (progressStatus) {
            const statusText = item.status === 'downloading' ? 'Mengunduh...' : 
                              item.status === 'completed' ? 'Selesai!' :
                              item.status === 'error' ? 'Gagal' : 'Menunggu...';
            progressStatus.textContent = statusText;
        }
    }

    // ========== AUTO INSTALL ==========
    async autoInstall(item) {
        try {
            if (item.downloadedBlob) {
                this.app.showToast('Memulai install: ' + item.title, 'info');
                
                const result = await this.app.pkgInstaller.installFromBlob(
                    item.downloadedBlob,
                    item.filename,
                    item.title
                );

                if (result.success) {
                    this.app.showToast('Install selesai: ' + item.title, 'success');
                    
                    // Show open button
                    const openGameBtn = document.getElementById('open-game-btn');
                    if (openGameBtn) {
                        openGameBtn.style.display = 'flex';
                    }
                } else if (!result.simulated) {
                    this.app.showToast('Install error: ' + result.error, 'error');
                }
            }
        } catch (error) {
            console.error('Auto-install error:', error);
            this.app.showToast('Install gagal: ' + error.message, 'error');
        }
    }

    // ========== CANCEL DOWNLOAD ==========
    cancelDownload(id) {
        const item = this.activeDownloads.get(id) || 
                     this.queue.find(d => d.id === id && d.status === 'pending');
        
        if (item && item.abortController) {
            item.abortController.abort();
            item.status = 'cancelled';
        }
        
        if (item.id === this.currentDownload?.id) {
            this.currentDownload = null;
        }

        this.saveToStorage();
        this.app.showToast('Download dibatalkan', 'warning');
    }

    cancelCurrentDownload() {
        if (this.currentDownload) {
            this.cancelDownload(this.currentDownload.id);
        }
    }

    // ========== QUEUE MANAGEMENT ==========
    removeFromQueue(id) {
        this.queue = this.queue.filter(d => d.id !== id);
        this.saveToStorage();
    }

    clearQueue() {
        this.queue.forEach(item => {
            if (item.abortController) {
                item.abortController.abort();
            }
        });
        this.queue = [];
        this.currentDownload = null;
        this.saveToStorage();
        this.app.showToast('Antrian dihapus', 'success');
    }

    getQueueStatus() {
        const pending = this.queue.filter(d => d.status === 'pending').length;
        const downloading = this.queue.filter(d => d.status === 'downloading').length;
        const completed = this.queue.filter(d => d.status === 'completed').length;
        const errors = this.queue.filter(d => d.status === 'error').length;

        return {
            pending,
            downloading,
            completed,
            errors,
            total: this.queue.length
        };
    }

    // ========== HISTORY ==========
    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('downloadHistory') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveToHistory(item) {
        this.history.push({
            ...item,
            completedAt: new Date().toISOString()
        });
        // Keep last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
        }
        localStorage.setItem('downloadHistory', JSON.stringify(this.history));
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('downloadHistory');
        this.app.showToast('Riwayat dihapus', 'success');
    }

    // ========== STORAGE ==========
    saveToStorage() {
        try {
            localStorage.setItem('downloadQueue', JSON.stringify(this.queue));
        } catch (e) {
            console.warn('Could not save queue to storage:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('downloadQueue');
            if (saved) {
                this.queue = JSON.parse(saved);
                // Reset statuses
                this.queue.forEach(item => {
                    if (item.status === 'downloading') {
                        item.status = 'pending';
                    }
                });
            }
        } catch (e) {
            console.warn('Could not load queue from storage:', e);
        }
    }

    // ========== UTILITIES ==========
    formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatSpeed(bytesPerSecond) {
        if (!bytesPerSecond) return '0 MB/s';
        return this.formatSize(bytesPerSecond) + '/s';
    }

    formatTime(seconds) {
        if (!seconds || seconds === Infinity) return '--:--';
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

