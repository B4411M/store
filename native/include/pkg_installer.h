/**
 * B41M HEN STORE - PKG Installer
 * Header file
 */

#ifndef PKG_INSTALLER_H
#define PKG_INSTALLER_H

#include <stdbool.h>

typedef struct PKGInstaller PKGInstaller;
typedef struct InstallResult InstallResult;

struct InstallResult {
    bool success;
    char* error;
    bool simulated;
};

typedef enum {
    INSTALL_METHOD_GOLDHEN_HTTP = 0,
    INSTALL_METHOD_GOLDHEN_WS,
    INSTALL_METHOD_LOCALSTORAGE,
    INSTALL_METHOD_POSTMESSAGE,
    INSTALL_METHOD_USB
} InstallMethod;

// Create PKG installer
PKGInstaller* pkg_installer_create(void);

// Destroy PKG installer
void pkg_installer_destroy(PKGInstaller* installer);

// Install from file
InstallResult pkg_installer_install_file(PKGInstaller* installer, const char* filepath, 
                                         const char* title, InstallMethod method);

// Install from memory/blob
InstallResult pkg_installer_install_blob(PKGInstaller* installer, const void* data, size_t size,
                                         const char* filename, const char* title, InstallMethod method);

// Install from USB path
InstallResult pkg_installer_install_usb(PKGInstaller* installer, const char* usb_path, 
                                        const char* title, InstallMethod method);

// Poll for installation events
void pkg_installer_poll(PKGInstaller* installer);

// Get installed packages list
int pkg_installer_get_installed(PKGInstaller* installer, char*** titles, char*** title_ids, int* count);

// Check if package is installed
bool pkg_installer_is_installed(PKGInstaller* installer, const char* title_id);

// Set GoldHEN endpoint
void pkg_installer_set_endpoint(PKGInstaller* installer, const char* http_url, const char* ws_url);

#endif // PKG_INSTALLER_H