// PS4 Homebrew Store - USB Manager

class USBManager {
    constructor(app) {
        this.app = app;
        this.currentPath = '/';
        this.pathHistory = ['/'];
        this.currentFiles = [];
    }

    async refresh() {
        const statusEl = document.getElementById('usb-status');
        const browserEl = document.getElementById('usb-browser');
        
        statusEl.innerHTML = '<p>Checking for USB devices...</p>';
        browserEl.style.display = 'none';

        try {
            const devices = await this.getUSBDevices();
            if (devices.length === 0) {
                statusEl.innerHTML = '<p>No USB devices found. Please connect a USB drive (exFAT/FAT32).</p>';
            } else {
                statusEl.innerHTML = '<p>USB device detected: ' + devices[0].name + '</p>';
                this.currentPath = devices[0].mountPoint || '/mnt/usb0';
                this.pathHistory = [this.currentPath];
                await this.browsePath(this.currentPath);
            }
        } catch (error) {
            this.simulateUSB(statusEl, browserEl);
        }
    }

    async getUSBDevices() {
        return [];
    }

    simulateUSB(statusEl, browserEl) {
        statusEl.innerHTML = '<p>USB device detected: simulated-usb (exFAT)</p>';
        browserEl.style.display = 'block';
        document.getElementById('usb-current-path').textContent = '/';
        
        this.currentFiles = [
            { name: 'games', type: 'folder', size: 0 },
            { name: 'apps', type: 'folder', size: 0 },
            { name: 'pkg', type: 'folder', size: 0 },
            { name: 'backup.pkg', type: 'file', size: 2147483648 },
            { name: 'game_update.pkg', type: 'file', size: 536870912 }
        ];
        
        this.renderFileList();
    }

    async browsePath(path) {
        const browserEl = document.getElementById('usb-browser');
        const fileListEl = document.getElementById('usb-file-list');
        
        browserEl.style.display = 'block';
        document.getElementById('usb-current-path').textContent = path;
        fileListEl.innerHTML = '<p class="empty-message">Loading...</p>';

        try {
            const files = await this.getFiles(path);
            this.currentFiles = files;
            this.renderFileList();
        } catch (error) {
            this.currentFiles = [
                { name: '..', type: 'back', size: 0 },
                { name: 'games', type: 'folder', size: 0 },
                { name: 'pkg', type: 'folder', size: 0 },
                { name: 'test-game.pkg', type: 'file', size: 5368709120 },
                { name: 'homebrew-app.pkg', type: 'file', size: 104857600 }
            ];
            this.renderFileList();
        }
    }

    async getFiles(path) {
        return [];
    }

    renderFileList() {
        const container = document.getElementById('usb-file-list');
        container.innerHTML = '';

        if (this.currentFiles.length === 0) {
            container.innerHTML = '<p class="empty-message">Folder is empty</p>';
            return;
        }

        this.currentFiles.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-item';
            
            let icon = '📄';
            if (file.type === 'folder' || file.name.endsWith('/')) icon = '📁';
            if (file.name === '..') icon = '↩️';
            
            const isPkg = file.name.toLowerCase().endsWith('.pkg');
            if (isPkg && file.type === 'file') icon = '📦';
            
            fileEl.innerHTML = '<div class="file-icon">' + icon + '</div>' +
                '<div class="file-name">' + file.name + '</div>' +
                (file.size > 0 ? '<div class="file-size">' + this.formatSize(file.size) + '</div>' : '');
            
            fileEl.addEventListener('click', () => this.handleFileClick(file));
            container.appendChild(fileEl);
        });
    }

    handleFileClick(file) {
        if (file.name === '..') {
            this.navigateBack();
            return;
        }

        if (file.type === 'folder' || file.name.endsWith('/')) {
            const newPath = this.currentPath + '/' + file.name;
            this.pathHistory.push(newPath);
            this.browsePath(newPath);
        } else if (file.name.toLowerCase().endsWith('.pkg')) {
            this.showPkgInstallDialog(file);
        } else {
            this.app.showToast('Not a PKG file', 'warning');
        }
    }

    showPkgInstallDialog(file) {
        const fullPath = this.currentPath + '/' + file.name;
        this.app.showConfirm('Install PKG', 
            'Install ' + file.name + '?\nSize: ' + this.formatSize(file.size), 
            async () => {
                this.app.showLoading('Installing ' + file.name + '...');
                try {
                    await this.app.pkgInstaller.installFromUSB(fullPath);
                    this.app.showToast('Installation started!', 'success');
                } catch (error) {
                    this.app.showToast('Installation failed', 'error');
                } finally {
                    this.app.hideLoading();
                }
            }
        );
    }

    navigateBack() {
        if (this.pathHistory.length > 1) {
            this.pathHistory.pop();
            const prevPath = this.pathHistory[this.pathHistory.length - 1];
            this.browsePath(prevPath);
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

