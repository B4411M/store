/**
 * B41M HEN STORE - Configuration
 * Implementation
 */

#include "utils/config.h"
#include "utils/log.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static const char* CONFIG_FILE = "config.json";

void config_default(AppConfig* config) {
    if (!config) return;
    
    config->store_url = strdup("https://b4411m.github.io/store/");
    config->goldhen_http_url = strdup("http://localhost:12800");
    config->goldhen_ws_url = strdup("ws://localhost:12800");
    config->download_path = strdup("/mnt/sandbox/pfsmnt/");
    config->cache_path = strdup("/data/b41m_store/cache/");
    config->log_level = LOG_INFO;
    config->auto_refresh = true;
    config->refresh_interval_minutes = 60;
    config->verify_sha256 = true;
    config->keep_pkg_after_install = false;
    config->max_concurrent_downloads = 1;
    config->user_agent = strdup("Mozilla/5.0 (PlayStation 4) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/601.1");
}

int config_load(AppConfig* config) {
    if (!config) return -1;
    
    FILE* f = fopen(CONFIG_FILE, "r");
    if (!f) {
        LOG_WARN("Config file not found, using defaults");
        config_default(config);
        return -1;
    }
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char* json_str = malloc(size + 1);
    fread(json_str, 1, size, f);
    json_str[size] = '\0';
    fclose(f);
    
    // Simple JSON parsing (could use cJSON)
    // For now, just use defaults and override with parsed values
    config_default(config);
    
    // Parse store_url
    char* pos = strstr(json_str, "\"store_url\"");
    if (pos) {
        pos = strchr(pos, ':');
        if (pos) {
            pos = strchr(pos, '"');
            if (pos) {
                pos++;
                char* end = strchr(pos, '"');
                if (end) {
                    *end = '\0';
                    free(config->store_url);
                    config->store_url = strdup(pos);
                }
            }
        }
    }
    
    // Parse other fields similarly...
    // (omitted for brevity - would use cJSON in real implementation)
    
    free(json_str);
    LOG_INFO("Config loaded from %s", CONFIG_FILE);
    return 0;
}

int config_save(const AppConfig* config) {
    if (!config) return -1;
    
    FILE* f = fopen(CONFIG_FILE, "w");
    if (!f) {
        LOG_ERROR("Failed to open config file for writing");
        return -1;
    }
    
    fprintf(f, "{\n");
    fprintf(f, "  \"store_url\": \"%s\",\n", config->store_url ? config->store_url : "");
    fprintf(f, "  \"goldhen_http_url\": \"%s\",\n", config->goldhen_http_url ? config->goldhen_http_url : "");
    fprintf(f, "  \"goldhen_ws_url\": \"%s\",\n", config->goldhen_ws_url ? config->goldhen_ws_url : "");
    fprintf(f, "  \"download_path\": \"%s\",\n", config->download_path ? config->download_path : "");
    fprintf(f, "  \"cache_path\": \"%s\",\n", config->cache_path ? config->cache_path : "");
    fprintf(f, "  \"log_level\": %d,\n", config->log_level);
    fprintf(f, "  \"auto_refresh\": %s,\n", config->auto_refresh ? "true" : "false");
    fprintf(f, "  \"refresh_interval_minutes\": %d,\n", config->refresh_interval_minutes);
    fprintf(f, "  \"verify_sha256\": %s,\n", config->verify_sha256 ? "true" : "false");
    fprintf(f, "  \"keep_pkg_after_install\": %s,\n", config->keep_pkg_after_install ? "true" : "false");
    fprintf(f, "  \"max_concurrent_downloads\": %d,\n", config->max_concurrent_downloads);
    fprintf(f, "  \"user_agent\": \"%s\"\n", config->user_agent ? config->user_agent : "");
    fprintf(f, "}\n");
    
    fclose(f);
    LOG_INFO("Config saved to %s", CONFIG_FILE);
    return 0;
}

void config_free(AppConfig* config) {
    if (!config) return;
    free(config->store_url);
    free(config->goldhen_http_url);
    free(config->goldhen_ws_url);
    free(config->download_path);
    free(config->cache_path);
    free(config->user_agent);
}