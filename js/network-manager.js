// PS4 Homebrew Store - Network Manager

class NetworkManager {
    constructor(app) {
        this.app = app;
        this.connectionType = 'ftp';
        this.currentPath = '/';
        this.pathHistory = ['/'];
        this.currentFiles = [];
        this.ftpConnection = null;
        this.smbConnection = null;
    }

    async connectFTP(host, port, user, password) {
        if (!host) {
            this.app.showToast('Please enter host address', 'warning');
            return;
        }

        this.app.showLoading('Connecting to FTP...');

        try {
            this.ftpConnection = { host: host, port: port || '21', user: user, connected: true };
            this.app.hideLoading();
            this.app.showToast('Connected to FTP server', 'success');
            this.showBrowser();
            this.currentPath = '/';
            this.pathHistory = ['/'];
            await this.browseFTPDirectory('/');
        } catch (error) {
            this.app.hideLoading();
            this.app.showToast('FTP connection failed', 'error');
        }
    }

    async connectSMB(server, user, password) {
        if (!server) {
            this.app.showToast('Please enter server address', 'warning');
            return;
        }

        this.app.showLoading('Connecting to SMB...');

        try {
            this.smbConnection = { server: server, user: user, connected: true };
            this.app.hideLoading();
            this.app.showToast('Connected to SMB share', 'success');
            this.showBrowser();
            this.currentPath = server;
            this.pathHistory = [server];
            await this.browseSMBShare(server);
        } catch (error) {
            this.app.hideLoading();
            this.app.showToast('SMB connection failed', 'error');
        }
    }

    showBrowser() {
        document.getElementById('network-browser').style.display = 'block';
        document.getElementById('ftp-connection').style.display = 'none';
        document.getElementById('smb-connection').style.display = 'none';
    }

    async browseFTPDirectory(path) {
        const fileListEl = document.getElementById('network-file-list');
        fileListEl.innerHTML = '<p class="empty-message">Loading...</p>';
        document.getElementById('network-current-path').textContent = path;

        const files = this.simulateFTPFiles(path);
        this.currentFiles = files;
        this.renderNetworkFileList();
    }

    async browseSMBShare(server) {
        const fileListEl = document.getElementById('network-file-list');
        fileListEl.innerHTML = '<p class="empty-message">Loading...</p>';
        document.getElementById('network-current-path').textContent = server;

        const files = this.simulateSMBFiles(server);
        this.currentFiles = files;
        this.renderNetworkFileList();
    }

    simulateFTPFiles(path) {
        if (path === '/') {
            return [
                { name: 'games', type: 'folder', size: 0 },
                { name: 'homebrew', type: 'folder', size: 0 },
                { name: 'pkg_files', type: 'folder', size: 0 },
                { name: 'game1.pkg', type: 'file', size: 5368709120 },
                { name: 'app1.pkg', type: 'file', size: 104857600 }
            ];
        }
        return [
            { name: '..', type: 'back', size: 0 },
            { name: 'subdir', type: 'folder', size: 0 },
            { name: 'file1.pkg', type: 'file', size: 1073741824 }
        ];
    }

    simulateSMBFiles(server) {
        return [
            { name: 'shared', type: 'folder', size: 0 },
            { name: 'games', type: 'folder', size: 0 },
            { name: 'backup.pkg', type: 'file', size: 2147483648 },
            { name: 'update.pkg', type: 'file', size: 536870912 }
        ];
    }

    renderNetworkFileList() {
        const container = document.getElementById('network-file-list');
        container.innerHTML = '';

        if (this.currentFiles.length === 0) {
            container.innerHTML = '<p class="empty-message">Folder is empty</p>';
            return;
        }

        this.currentFiles.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-item';
            
            let icon = '📄';
            if (file.type === 'folder') icon = '📁';
            if (file.name === '..') icon = '↩️';
            if (file.name.toLowerCase().endsWith('.pkg') && file.type === 'file') icon = '📦';
            
            fileEl.innerHTML = '<div class="file-icon">' + icon + '</div>' +
                '<div class="file-name">' + file.name + '</div>' +
                (file.size > 0 ? '<div class="file-size">' + this.formatSize(file.size) + '</div>' : '');
            
            fileEl.addEventListener('click', () => this.handleNetworkFileClick(file));
            container.appendChild(fileEl);
        });
    }

    handleNetworkFileClick(file) {
        if (file.name === '..') {
            this.navigateBack();
            return;
        }

        if (file.type === 'folder') {
            const newPath = this.currentPath + '/' + file.name;
            this.pathHistory.push(newPath);
            this.currentPath = newPath;
            document.getElementById('network-current-path').textContent = newPath;
            
            if (this.ftpConnection) this.browseFTPDirectory(newPath);
            else if (this.smbConnection) this.browseSMBShare(newPath);
        } else if (file.name.toLowerCase().endsWith('.pkg')) {
            this.showNetworkPkgDialog(file);
        } else {
            this.app.showToast('Not a PKG file', 'warning');
        }
    }

    showNetworkPkgDialog(file) {
        const fullPath = this.currentPath + '/' + file.name;
        this.app.showConfirm('Download & Install', 
            'Download and install ' + file.name + '?\nSize: ' + this.formatSize(file.size), 
            async () => {
                this.app.showLoading('Downloading ' + file.name + '...');
                try {
                    const downloadUrl = await this.downloadNetworkFile(fullPath);
                    this.app.hideLoading();
                    this.app.showLoading('Installing ' + file.name + '...');
                    await this.app.pkgInstaller.installFromUrl(downloadUrl, file.name);
                    this.app.showToast('Installation complete!', 'success');
                } catch (error) {
                    this.app.hideLoading();
                    this.app.showToast('Failed: ' + error.message, 'error');
                }
            }
        );
    }

    async downloadNetworkFile(path) {
        return 'blob:http://localhost/mock-pkg-url';
    }

    navigateBack() {
        if (this.pathHistory.length > 1) {
            this.pathHistory.pop();
            const prevPath = this.pathHistory[this.pathHistory.length - 1];
            this.currentPath = prevPath;
            document.getElementById('network-current-path').textContent = prevPath;
            
            if (this.ftpConnection) this.browseFTPDirectory(prevPath);
            else if (this.smbConnection) this.browseSMBShare(prevPath);
        } else {
            document.getElementById('network-browser').style.display = 'none';
            document.getElementById(this.ftpConnection ? 'ftp-connection' : 'smb-connection').style.display = 'block';
            this.ftpConnection = null;
            this.smbConnection = null;
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    disconnect() {
        this.ftpConnection = null;
        this.smbConnection = null;
        this.currentPath = '/';
        this.pathHistory = ['/'];
        this.currentFiles = [];
        document.getElementById('network-browser').style.display = 'none';
        document.getElementById('ftp-connection').style.display = 'block';
        document.getElementById('smb-connection').style.display = 'none';
    }
}

