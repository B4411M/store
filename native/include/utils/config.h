/**
 * B41M HEN STORE - Configuration
 * Header file
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <stdbool.h>

typedef struct {
    char* store_url;
    char* goldhen_http_url;
    char* goldhen_ws_url;
    char* download_path;
    char* cache_path;
    int log_level;
    bool auto_refresh;
    int refresh_interval_minutes;
    bool verify_sha256;
    bool keep_pkg_after_install;
    int max_concurrent_downloads;
    char* user_agent;
} AppConfig;

// Initialize config with defaults
void config_default(AppConfig* config);

// Load config from file
int config_load(AppConfig* config);

// Save config to file
int config_save(const AppConfig* config);

// Free config strings
void config_free(AppConfig* config);

#endif // CONFIG_H