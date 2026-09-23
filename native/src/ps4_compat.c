#include "http_client.h"
#include "json_parser.h"
#include "download_manager.h"
#include "sha256.h"
#include "pkg_installer.h"
#include "utils/log.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct HttpClient {
    int unused;
};

static char* g_user_agent;

int http_client_init(void) {
    LOG_INFO("HTTP client initialized (OpenOrbis compatibility mode)");
    return 0;
}

void http_client_cleanup(void) {
    free(g_user_agent);
    g_user_agent = NULL;
}

HttpResponse* http_get(const char* url, const char* headers[]) {
    (void)headers;
    LOG_WARN("HTTP GET is not implemented for the PS4 target: %s", url ? url : "(null)");
    return NULL;
}

HttpResponse* http_post(const char* url, const char* headers[], const char* form_data) {
    (void)headers;
    (void)form_data;
    LOG_WARN("HTTP POST is not implemented for the PS4 target: %s", url ? url : "(null)");
    return NULL;
}

int http_download_file(const char* url, const char* output_path,
                       DownloadProgressCallback progress_cb, void* user_data) {
    (void)progress_cb;
    (void)user_data;
    LOG_WARN("Downloads are not implemented for the PS4 target: %s -> %s",
             url ? url : "(null)", output_path ? output_path : "(null)");
    return -1;
}

void http_response_free(HttpResponse* response) {
    if (!response) return;
    free(response->body);
    free(response);
}

void http_set_default_headers(const char* user_agent) {
    free(g_user_agent);
    g_user_agent = user_agent ? strdup(user_agent) : NULL;
}

int json_parser_init(void) { return 0; }
void json_parser_cleanup(void) {}

GameEntry** parse_games_json(const char* json_str, int* count) {
    (void)json_str;
    if (count) *count = 0;
    return NULL;
}

CategoryEntry** parse_categories_json(const char* json_str, int* count) {
    (void)json_str;
    if (count) *count = 0;
    return NULL;
}

FeaturedEntry** parse_featured_json(const char* json_str, int* count) {
    (void)json_str;
    if (count) *count = 0;
    return NULL;
}

VersionInfo* parse_version_json(const char* json_str) {
    (void)json_str;
    return NULL;
}

void free_game_entries(GameEntry** entries, int count) {
    (void)count;
    free(entries);
}
void free_category_entries(CategoryEntry** entries, int count) {
    (void)count;
    free(entries);
}
void free_featured_entries(FeaturedEntry** entries, int count) {
    (void)count;
    free(entries);
}
void free_version_info(VersionInfo* info) { free(info); }

struct DownloadManager {
    DownloadManagerProgressCallback progress_cb;
    void* user_data;
};

DownloadManager* download_manager_create(void) {
    return calloc(1, sizeof(DownloadManager));
}

void download_manager_destroy(DownloadManager* mgr) { free(mgr); }

int download_manager_add(DownloadManager* mgr, const char* url, const char* filename,
                         const char* title, const char* expected_sha256,
                         long long expected_size) {
    (void)mgr; (void)url; (void)filename; (void)title;
    (void)expected_sha256; (void)expected_size;
    return -1;
}

int download_manager_start(DownloadManager* mgr, int item_id) { (void)mgr; (void)item_id; return -1; }
int download_manager_pause(DownloadManager* mgr, int item_id) { (void)mgr; (void)item_id; return -1; }
int download_manager_resume(DownloadManager* mgr, int item_id) { (void)mgr; (void)item_id; return -1; }
int download_manager_cancel(DownloadManager* mgr, int item_id) { (void)mgr; (void)item_id; return -1; }
int download_manager_remove(DownloadManager* mgr, int item_id) { (void)mgr; (void)item_id; return -1; }
DownloadItem* download_manager_get_item(DownloadManager* mgr, int item_id) { (void)mgr; (void)item_id; return NULL; }
void download_manager_poll(DownloadManager* mgr) { (void)mgr; }
void download_manager_set_progress_callback(DownloadManager* mgr,
                                            DownloadManagerProgressCallback cb,
                                            void* user_data) {
    if (!mgr) return;
    mgr->progress_cb = cb;
    mgr->user_data = user_data;
}
void download_manager_render_progress(DownloadManager* mgr) { (void)mgr; }

struct SHA256Context {
    unsigned long long length;
};

static void empty_hash(char* output_hex) {
    if (!output_hex) return;
    for (int i = 0; i < 64; i++) output_hex[i] = '0';
    output_hex[64] = '\0';
}

bool sha256_compute(const void* data, size_t len, char* output_hex) {
    (void)data; (void)len;
    empty_hash(output_hex);
    return output_hex != NULL;
}

bool sha256_compute_file(const char* filepath, char* output_hex) {
    (void)filepath;
    empty_hash(output_hex);
    return output_hex != NULL;
}

SHA256Context* sha256_init(void) { return calloc(1, sizeof(SHA256Context)); }
bool sha256_update(SHA256Context* ctx, const void* data, size_t len) {
    (void)data;
    if (!ctx) return false;
    ctx->length += len;
    return true;
}
bool sha256_final(SHA256Context* ctx, char* output_hex) {
    if (!ctx) return false;
    empty_hash(output_hex);
    return output_hex != NULL;
}
void sha256_free(SHA256Context* ctx) { free(ctx); }
bool sha256_verify(const char* expected_hex, const char* actual_hex) {
    return expected_hex && actual_hex && strcmp(expected_hex, actual_hex) == 0;
}

struct PKGInstaller {
    char* http_endpoint;
    char* ws_endpoint;
};

PKGInstaller* pkg_installer_create(void) { return calloc(1, sizeof(PKGInstaller)); }
void pkg_installer_destroy(PKGInstaller* installer) {
    if (!installer) return;
    free(installer->http_endpoint);
    free(installer->ws_endpoint);
    free(installer);
}

static InstallResult install_unavailable(void) {
    InstallResult result = {0};
    result.simulated = true;
    result.error = strdup("PKG installer is not implemented for the PS4 target");
    return result;
}

InstallResult pkg_installer_install_file(PKGInstaller* installer, const char* filepath,
                                         const char* title, InstallMethod method) {
    (void)installer; (void)filepath; (void)title; (void)method;
    return install_unavailable();
}

InstallResult pkg_installer_install_blob(PKGInstaller* installer, const void* data, size_t size,
                                         const char* filename, const char* title,
                                         InstallMethod method) {
    (void)installer; (void)data; (void)size; (void)filename; (void)title; (void)method;
    return install_unavailable();
}

InstallResult pkg_installer_install_usb(PKGInstaller* installer, const char* usb_path,
                                        const char* title, InstallMethod method) {
    (void)installer; (void)usb_path; (void)title; (void)method;
    return install_unavailable();
}

void pkg_installer_poll(PKGInstaller* installer) { (void)installer; }
int pkg_installer_get_installed(PKGInstaller* installer, char*** titles,
                                char*** title_ids, int* count) {
    (void)installer; (void)titles; (void)title_ids;
    if (count) *count = 0;
    return 0;
}
bool pkg_installer_is_installed(PKGInstaller* installer, const char* title_id) {
    (void)installer; (void)title_id;
    return false;
}
void pkg_installer_set_endpoint(PKGInstaller* installer, const char* http_url,
                                const char* ws_url) {
    if (!installer) return;
    free(installer->http_endpoint);
    free(installer->ws_endpoint);
    installer->http_endpoint = http_url ? strdup(http_url) : NULL;
    installer->ws_endpoint = ws_url ? strdup(ws_url) : NULL;
}
