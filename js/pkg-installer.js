/**
 * PS4 HEN Store - PKG Installer
 * Handles PKG installation on PS4 with multiple methods
 */

class PKGInstaller {
    constructor(app) {
        this.app = app;
        this.isInstalling = false;
        this.isPS4 = this.detectPS4();
        this.installQueue = [];
        this.init();
    }

    detectPS4() {
        const userAgent = navigator.userAgent || window.navigator.userAgent;
        return /PlayStation 4/i.test(userAgent) || /Orbis/i.test(userAgent);
    }

    init() {
        console.log('PKG Installer initialized');
        console.log('Running on PS4:', this.isPS4);
    }

    /**
     * Install PKG from URL - downloads and installs
     */
    async installFromUrl(url, filename, title) {
        if (this.isInstalling) {
            this.app.showToast('Install sedang berlangsung...', 'warning');
            return { success: false, error: 'Installation already in progress' };
        }

        this.isInstalling = true;
        title = title || filename;

        this.app.showToast('Memulai install: ' + title, 'info');

        if (!this.isPS4) {
            // Demo mode - simulate installation
            return await this.simulateInstallation(title);
        }

        try {
            // First download the file
            this.app.showToast('Mendownload: ' + title, 'info');
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Download failed: ' + response.status);
            }
            
            const blob = await response.blob();
            
            // Then install
            return await this.installFromBlob(blob, filename, title);

        } catch (error) {
            console.error('Install from URL error:', error);
            this.isInstalling = false;
            this.app.showToast('Install gagal: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Install PKG from Blob - for downloaded files
     */
    async installFromBlob(blob, filename, title) {
        if (this.isInstalling) {
            this.app.showToast('Installation in progress', 'warning');
            return { success: false, error: 'Installation already in progress' };
        }

        this.isInstalling = true;
        title = title || filename;

        this.app.showToast('Installing: ' + title, 'info');

        if (!this.isPS4) {
            // Demo mode
            return await this.simulateInstallation(title);
        }

        try {
            // Method 1: Try HTTP payload communication (GoldHEN default port)
            const payloadUrl = 'http://localhost:12800';
            
            try {
                const formData = new FormData();
                formData.append('pkg', blob, filename);
                formData.append('action', 'install');

                const response = await fetch(payloadUrl + '/install', {
                    method: 'POST',
                    body: formData,
                    timeout: 10000
                });

                if (response.ok) {
                    this.isInstalling = false;
                    this.app.showToast(title + ' installation started!', 'success');
                    return { success: true };
                }
            } catch (e) {
                console.log('Payload HTTP not available, trying alternative methods');
            }

            // Method 2: Try WebSocket communication (GoldHEN)
            try {
                const ws = new WebSocket('ws://localhost:12800');
                
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        type: 'install',
                        filename: filename,
                        title: title
                    }));
                    ws.close();
                };
                
                ws.onerror = () => {
                    console.log('WebSocket not available');
                };
            } catch (e) {
                console.log('WebSocket error:', e);
            }

            // Method 3: Try using localStorage IPC
            const installData = {
                action: 'install_pkg',
                filename: filename,
                title: title,
                timestamp: Date.now(),
                blobSize: blob.size
            };
            
            try {
                localStorage.setItem('ps4_install_request', JSON.stringify(installData));
            } catch (e) {
                // localStorage might be full
            }

            // Method 4: Try postMessage to parent (for iframe scenario)
            try {
                if (window.parent !== window) {
                    window.parent.postMessage({
                        type: 'PS4_INSTALL_PKG',
                        filename: filename,
                        title: title
                    }, '*');
                }
            } catch (e) {
                console.log('postMessage not available');
            }

            // Method 5: Try Audio/Video element trigger (works with some exploits)
            try {
                // Create a temporary media element to trigger PS4 notification
                const mediaEvent = new MediaSource();
                const blobUrl = URL.createObjectURL(blob);
                const audio = new Audio(blobUrl);
                audio.load();
                URL.revokeObjectURL(blobUrl);
            } catch (e) {
                // Ignore
            }

            this.isInstalling = false;
            this.app.showToast(title + ' - Signal sent to payload', 'success');
            return { 
                success: true, 
                message: 'Installation signal sent',
                note: 'Check PS4 notification center'
            };

        } catch (error) {
            this.isInstalling = false;
            this.app.showToast('Installation error: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Install from USB path
     */
    async installFromUSB(usbPath) {
        if (this.isInstalling) {
            this.app.showToast('Installation in progress', 'warning');
            return { success: false, error: 'Installation already in progress' };
        }

        this.isInstalling = true;

        if (!this.isPS4) {
            return await this.simulateInstallation('USB Package');
        }

        try {
            // For USB installation, we typically need to send the path to the payload
            const payloadUrl = 'http://localhost:12800';

            // Try HTTP POST with path
            try {
                const formData = new FormData();
                formData.append('action', 'install_usb');
                formData.append('path', usbPath);

                const response = await fetch(payloadUrl + '/install_usb', {
                    method: 'POST',
                    body: formData,
                    timeout: 5000
                });

                if (response.ok) {
                    this.isInstalling = false;
                    this.app.showToast('USB installation started', 'success');
                    return { success: true };
                }
            } catch (e) {
                console.log('USB HTTP install failed, trying alternative');
            }

            // Try localStorage IPC
            const installData = {
                action: 'install_usb',
                path: usbPath,
                timestamp: Date.now()
            };
            
            try {
                localStorage.setItem('ps4_install_request', JSON.stringify(installData));
            } catch (e) {}

            this.isInstalling = false;
            this.app.showToast('USB install signal sent', 'success');
            return { success: true };

        } catch (error) {
            this.isInstalling = false;
            this.app.showToast('USB install error: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Simulate installation (for demo/offline mode)
     */
    async simulateInstallation(title) {
        this.app.showToast('Demo Mode: Simulating installation of ' + title, 'info');
        
        // Simulate installation steps
        const steps = [
            'Validating PKG...',
            'Extracting files...',
            'Installing...',
            'Registering content...',
            'Finalizing...'
        ];

        for (let i = 0; i < steps.length; i++) {
            await this.delay(800);
            this.app.showToast(title + ': ' + steps[i], 'info');
        }

        this.isInstalling = false;
        this.app.showToast(title + ' installed successfully (Demo)', 'success');
        
        return { success: true, simulated: true };
    }

    /**
     * Get list of installed packages
     */
    async getInstalledPackages() {
        if (!this.isPS4) {
            return this.getDemoPackages();
        }

        try {
            // Try to get from payload
            const response = await fetch('http://localhost:12800/packages', {
                timeout: 2000
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.log('Could not get installed packages');
        }

        return this.getDemoPackages();
    }

    getDemoPackages() {
        return [
            {
                titleId: 'NPWR00000',
                name: 'PS4 System Software',
                version: '11.00',
                type: 'system'
            }
        ];
    }

    /**
     * Check if a package is installed
     */
    async isInstalled(contentId) {
        const packages = await this.getInstalledPackages();
        return packages.some(p => p.contentId === contentId);
    }

    /**
     * Get installation progress
     */
    getProgress() {
        return {
            isInstalling: this.isInstalling,
            queueLength: this.installQueue.length
        };
    }

    /**
     * Cancel current installation
     */
    cancelInstall() {
        this.isInstalling = false;
        this.app.showToast('Installation cancelled', 'warning');
    }

    /**
     * Utility: delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Format size for display
     */
    formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

