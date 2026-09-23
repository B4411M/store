/**
 * B41M HEN STORE - Native PS4 Application
 * Main entry point
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "http_client.h"
#include "json_parser.h"
#include "download_manager.h"
#include "sha256.h"
#include "storage_manager.h"
#include "pkg_installer.h"
#include "ui/webview.h"
#include "ui/input.h"
#include "ui/render.h"
#include "utils/log.h"
#include "utils/config.h"

// Application state
typedef struct {
    bool running;
    bool initialized;
    AppConfig config;
    WebView* webview;
    DownloadManager* download_mgr;
    PKGInstaller* installer;
} AppState;

static AppState g_app = {0};

// Forward declarations
static int init_app(void);
static void cleanup_app(void);
static void main_loop(void);
static void handle_events(void);
static void update_ui(void);

int main(int argc, char* argv[]) {
    LOG_INFO("B41M HEN STORE starting...");
    LOG_INFO("Version: 1.0.0");
    
    // Initialize application
    if (init_app() != 0) {
        LOG_ERROR("Failed to initialize application");
        return -1;
    }
    
    LOG_INFO("Application initialized successfully");
    
    // Main loop
    main_loop();
    
    // Cleanup
    cleanup_app();
    
    LOG_INFO("B41M HEN STORE exiting...");
    return 0;
}

static int init_app(void) {
    // Load configuration
    if (config_load(&g_app.config) != 0) {
        LOG_WARN("Using default configuration");
        config_default(&g_app.config);
    }
    
    // Initialize logging
    log_init(g_app.config.log_level);
    
    // Initialize subsystems
    if (http_client_init() != 0) {
        LOG_ERROR("Failed to initialize HTTP client");
        return -1;
    }
    
    if (json_parser_init() != 0) {
        LOG_ERROR("Failed to initialize JSON parser");
        return -1;
    }
    
    g_app.download_mgr = download_manager_create();
    if (!g_app.download_mgr) {
        LOG_ERROR("Failed to create download manager");
        return -1;
    }
    
    g_app.installer = pkg_installer_create();
    if (!g_app.installer) {
        LOG_ERROR("Failed to create PKG installer");
        return -1;
    }
    
    // Initialize UI
    g_app.webview = webview_create("B41M HEN STORE", 1280, 720);
    if (!g_app.webview) {
        LOG_ERROR("Failed to create webview");
        return -1;
    }
    
    if (input_init() != 0) {
        LOG_ERROR("Failed to initialize input");
        return -1;
    }
    
    if (render_init() != 0) {
        LOG_ERROR("Failed to initialize renderer");
        return -1;
    }
    
    // Load store URL
    const char* store_url = g_app.config.store_url;
    if (!store_url || strlen(store_url) == 0) {
        store_url = "https://b4411m.github.io/store/";
    }
    
    LOG_INFO("Loading store: %s", store_url);
    webview_load_url(g_app.webview, store_url);
    
    g_app.running = true;
    g_app.initialized = true;
    
    return 0;
}

static void cleanup_app(void) {
    LOG_INFO("Cleaning up...");
    
    if (g_app.webview) {
        webview_destroy(g_app.webview);
        g_app.webview = NULL;
    }
    
    if (g_app.download_mgr) {
        download_manager_destroy(g_app.download_mgr);
        g_app.download_mgr = NULL;
    }
    
    if (g_app.installer) {
        pkg_installer_destroy(g_app.installer);
        g_app.installer = NULL;
    }
    
    input_cleanup();
    render_cleanup();
    http_client_cleanup();
    json_parser_cleanup();
    log_cleanup();
    
    g_app.initialized = false;
}

static void main_loop(void) {
    while (g_app.running) {
        handle_events();
        update_ui();
        
        // Small delay to prevent 100% CPU usage
        #ifdef ORBIS
        sceKernelUsleep(1000); // 1ms
        #else
        usleep(1000);
        #endif
    }
}

static void handle_events(void) {
    // Handle controller input
    InputEvent event;
    while (input_poll(&event)) {
        switch (event.type) {
            case INPUT_QUIT:
                g_app.running = false;
                break;
            case INPUT_NAVIGATE:
                webview_inject_input(g_app.webview, &event);
                break;
            case INPUT_DOWNLOAD:
                // Handle download request from webview
                break;
            case INPUT_INSTALL:
                // Handle install request from webview
                break;
        }
    }
    
    // Handle download manager events
    download_manager_poll(g_app.download_mgr);
    
    // Handle installer events
    pkg_installer_poll(g_app.installer);
}

static void update_ui(void) {
    // Render frame
    render_begin_frame();
    
    // Draw webview
    if (g_app.webview) {
        webview_render(g_app.webview);
    }
    
    // Draw download progress overlay
    download_manager_render_progress(g_app.download_mgr);
    
    render_end_frame();
}