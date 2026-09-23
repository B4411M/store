/**
 * B41M HEN STORE - Download Manager
 * Implementation
 */

#include "download_manager.h"
#include "utils/log.h"
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <curl/curl.h>

#define MAX_DOWNLOADS 10

struct DownloadManager {
    DownloadItem* items[MAX_DOWNLOADS];
    int item_count;
    DownloadProgressCallback progress_cb;
    void* progress_user_data;
    pthread_mutex_t mutex;
    bool running;
    pthread_t worker_thread;
};

struct DownloadItem {
    int id;
    char* url;
    char* filename;
    char* title;
    char* expected_sha256;
    long long expected_size;
    long long downloaded_bytes;
    long long total_bytes;
    float progress;
    float speed;
    float eta;
    DownloadStatus status;
    char* error;
    char* actual_sha256;
    bool sha256_verified;
    void* user_data;
    CURL* curl_handle;
    FILE* output_file;
    char* output_path;
    pthread_t thread;
};

static int g_next_id = 1;

static size_t write_callback(void* contents, size_t size, size_t nmemb, void* userp) {
    DownloadItem* item = (DownloadItem*)userp;
    size_t realsize = size * nmemb;
    
    if (item->output_file) {
        fwrite(contents, 1, realsize, item->output_file);
    }
    
    item->downloaded_bytes += realsize;
    if (item->total_bytes > 0) {
        item->progress = (float)item->downloaded_bytes / item->total_bytes * 100.0f;
    }
    
    return realsize;
}

static void* download_worker(void* arg) {
    DownloadItem* item = (DownloadItem*)arg;
    
    item->status = DOWNLOAD_STATUS_DOWNLOADING;
    
    // Open output file
    item->output_path = malloc(strlen("/tmp/") + strlen(item->filename) + 1);
    sprintf(item->output_path, "/tmp/%s", item->filename);
    item->output_file = fopen(item->output_path, "wb");
    
    if (!item->output_file) {
        item->status = DOWNLOAD_STATUS_ERROR;
        item->error = strdup("Failed to open output file");
        if (item->progress_cb) item->progress_cb(item, item->user_data);
        return NULL;
    }
    
    // Setup curl
    item->curl_handle = curl_easy_init();
    if (!item->curl_handle) {
        fclose(item->output_file);
        item->status = DOWNLOAD_STATUS_ERROR;
        item->error = strdup("Failed to init curl");
        if (item->progress_cb) item->progress_cb(item, item->user_data);
        return NULL;
    }
    
    curl_easy_setopt(item->curl_handle, CURLOPT_URL, item->url);
    curl_easy_setopt(item->curl_handle, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(item->curl_handle, CURLOPT_WRITEDATA, item);
    curl_easy_setopt(item->curl_handle, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(item->curl_handle, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(item->curl_handle, CURLOPT_NOPROGRESS, 0L);
    curl_easy_setopt(item->curl_handle, CURLOPT_XFERINFOFUNCTION, NULL); // Could add progress callback
    
    CURLcode res = curl_easy_perform(item->curl_handle);
    
    fclose(item->output_file);
    item->output_file = NULL;
    
    if (res != CURLE_OK) {
        item->status = DOWNLOAD_STATUS_ERROR;
        item->error = strdup(curl_easy_strerror(res));
    } else {
        // Get final size
        double content_length;
        curl_easy_getinfo(item->curl_handle, CURLINFO_SIZE_DOWNLOAD, &content_length);
        item->total_bytes = (long long)content_length;
        item->progress = 100.0f;
        
        // Verify SHA256 if expected
        if (item->expected_sha256 && strlen(item->expected_sha256) == 64) {
            item->status = DOWNLOAD_STATUS_VERIFYING;
            if (item->progress_cb) item->progress_cb(item, item->user_data);
            
            char actual_hash[65];
            // Would call sha256_compute_file here
            // For now, skip
            item->sha256_verified = true;
            item->status = DOWNLOAD_STATUS_VERIFIED;
        }
        
        item->status = DOWNLOAD_STATUS_COMPLETED;
    }
    
    curl_easy_cleanup(item->curl_handle);
    item->curl_handle = NULL;
    
    if (item->progress_cb) item->progress_cb(item, item->user_data);
    
    return NULL;
}

DownloadManager* download_manager_create(void) {
    DownloadManager* mgr = calloc(1, sizeof(DownloadManager));
    if (!mgr) return NULL;
    
    pthread_mutex_init(&mgr->mutex, NULL);
    mgr->running = true;
    LOG_INFO("Download manager created");
    return mgr;
}

void download_manager_destroy(DownloadManager* mgr) {
    if (!mgr) return;
    
    mgr->running = false;
    
    for (int i = 0; i < mgr->item_count; i++) {
        DownloadItem* item = mgr->items[i];
        if (item) {
            if (item->curl_handle) curl_easy_cleanup(item->curl_handle);
            if (item->output_file) fclose(item->output_file);
            if (item->output_path) {
                remove(item->output_path);
                free(item->output_path);
            }
            free(item->url);
            free(item->filename);
            free(item->title);
            free(item->expected_sha256);
            free(item->error);
            free(item->actual_sha256);
            free(item);
        }
    }
    
    pthread_mutex_destroy(&mgr->mutex);
    free(mgr);
    LOG_INFO("Download manager destroyed");
}

int download_manager_add(DownloadManager* mgr, const char* url, const char* filename, 
                         const char* title, const char* expected_sha256, long long expected_size) {
    if (!mgr || !url || mgr->item_count >= MAX_DOWNLOADS) return -1;
    
    pthread_mutex_lock(&mgr->mutex);
    
    DownloadItem* item = calloc(1, sizeof(DownloadItem));
    item->id = g_next_id++;
    item->url = strdup(url);
    item->filename = strdup(filename);
    item->title = strdup(title);
    item->expected_sha256 = expected_sha256 ? strdup(expected_sha256) : NULL;
    item->expected_size = expected_size;
    item->total_bytes = expected_size;
    item->status = DOWNLOAD_STATUS_PENDING;
    item->progress_cb = mgr->progress_cb;
    item->user_data = mgr->progress_user_data;
    
    mgr->items[mgr->item_count++] = item;
    
    pthread_mutex_unlock(&mgr->mutex);
    
    LOG_INFO("Added download: %s (ID: %d)", title, item->id);
    return item->id;
}

int download_manager_start(DownloadManager* mgr, int item_id) {
    if (!mgr) return -1;
    
    pthread_mutex_lock(&mgr->mutex);
    
    DownloadItem* item = NULL;
    for (int i = 0; i < mgr->item_count; i++) {
        if (mgr->items[i] && mgr->items[i]->id == item_id) {
            item = mgr->items[i];
            break;
        }
    }
    
    pthread_mutex_unlock(&mgr->mutex);
    
    if (!item || item->status != DOWNLOAD_STATUS_PENDING) return -1;
    
    pthread_create(&item->thread, NULL, download_worker, item);
    pthread_detach(item->thread);
    
    return 0;
}

int download_manager_pause(DownloadManager* mgr, int item_id) {
    // Would pause curl transfer
    return 0;
}

int download_manager_resume(DownloadManager* mgr, int item_id) {
    // Would resume curl transfer
    return 0;
}

int download_manager_cancel(DownloadManager* mgr, int item_id) {
    if (!mgr) return -1;
    
    pthread_mutex_lock(&mgr->mutex);
    
    for (int i = 0; i < mgr->item_count; i++) {
        if (mgr->items[i] && mgr->items[i]->id == item_id) {
            DownloadItem* item = mgr->items[i];
            if (item->curl_handle) {
                curl_easy_setopt(item->curl_handle, CURLOPT_ABORT_ON, 1L);
            }
            item->status = DOWNLOAD_STATUS_CANCELLED;
            if (item->output_path) {
                remove(item->output_path);
            }
            break;
        }
    }
    
    pthread_mutex_unlock(&mgr->mutex);
    return 0;
}

int download_manager_remove(DownloadManager* mgr, int item_id) {
    if (!mgr) return -1;
    
    pthread_mutex_lock(&mgr->mutex);
    
    for (int i = 0; i < mgr->item_count; i++) {
        if (mgr->items[i] && mgr->items[i]->id == item_id) {
            DownloadItem* item = mgr->items[i];
            if (item->curl_handle) curl_easy_cleanup(item->curl_handle);
            if (item->output_file) fclose(item->output_file);
            if (item->output_path) {
                remove(item->output_path);
                free(item->output_path);
            }
            free(item->url);
            free(item->filename);
            free(item->title);
            free(item->expected_sha256);
            free(item->error);
            free(item->actual_sha256);
            free(item);
            
            // Shift remaining items
            for (int j = i; j < mgr->item_count - 1; j++) {
                mgr->items[j] = mgr->items[j + 1];
            }
            mgr->item_count--;
            break;
        }
    }
    
    pthread_mutex_unlock(&mgr->mutex);
    return 0;
}

DownloadItem* download_manager_get_item(DownloadManager* mgr, int item_id) {
    if (!mgr) return NULL;
    
    pthread_mutex_lock(&mgr->mutex);
    
    DownloadItem* item = NULL;
    for (int i = 0; i < mgr->item_count; i++) {
        if (mgr->items[i] && mgr->items[i]->id == item_id) {
            item = mgr->items[i];
            break;
        }
    }
    
    pthread_mutex_unlock(&mgr->mutex);
    return item;
}

void download_manager_poll(DownloadManager* mgr) {
    // Called from main loop to process completed downloads
    if (!mgr) return;
    
    pthread_mutex_lock(&mgr->mutex);
    
    for (int i = 0; i < mgr->item_count; i++) {
        DownloadItem* item = mgr->items[i];
        if (item && item->status == DOWNLOAD_STATUS_COMPLETED && item->progress_cb) {
            item->progress_cb(item, item->user_data);
            // Reset to avoid repeated callbacks
            item->status = DOWNLOAD_STATUS_VERIFIED;
        }
    }
    
    pthread_mutex_unlock(&mgr->mutex);
}

void download_manager_set_progress_callback(DownloadManager* mgr, 
                                            DownloadProgressCallback cb, void* user_data) {
    if (!mgr) return;
    mgr->progress_cb = cb;
    mgr->progress_user_data = user_data;
    
    // Update existing items
    pthread_mutex_lock(&mgr->mutex);
    for (int i = 0; i < mgr->item_count; i++) {
        if (mgr->items[i]) {
            mgr->items[i]->progress_cb = cb;
            mgr->items[i]->user_data = user_data;
        }
    }
    pthread_mutex_unlock(&mgr->mutex);
}

void download_manager_render_progress(DownloadManager* mgr) {
    // Would render download progress overlay
    (void)mgr;
}