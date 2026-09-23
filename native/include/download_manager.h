/**
 * B41M HEN STORE - Download Manager
 * Header file
 */

#ifndef DOWNLOAD_MANAGER_H
#define DOWNLOAD_MANAGER_H

#include <stdbool.h>

typedef struct DownloadManager DownloadManager;
typedef struct DownloadItem DownloadItem;

typedef enum {
    DOWNLOAD_STATUS_PENDING = 0,
    DOWNLOAD_STATUS_DOWNLOADING,
    DOWNLOAD_STATUS_PAUSED,
    DOWNLOAD_STATUS_COMPLETED,
    DOWNLOAD_STATUS_ERROR,
    DOWNLOAD_STATUS_CANCELLED,
    DOWNLOAD_STATUS_VERIFYING,
    DOWNLOAD_STATUS_VERIFIED,
    DOWNLOAD_STATUS_VERIFICATION_FAILED
} DownloadStatus;

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
};

// Progress callback
typedef void (*DownloadProgressCallback)(DownloadItem* item, void* user_data);

// Create download manager
DownloadManager* download_manager_create(void);

// Destroy download manager
void download_manager_destroy(DownloadManager* mgr);

// Add download to queue
int download_manager_add(DownloadManager* mgr, const char* url, const char* filename, 
                         const char* title, const char* expected_sha256, long long expected_size);

// Start download
int download_manager_start(DownloadManager* mgr, int item_id);

// Pause download
int download_manager_pause(DownloadManager* mgr, int item_id);

// Resume download
int download_manager_resume(DownloadManager* mgr, int item_id);

// Cancel download
int download_manager_cancel(DownloadManager* mgr, int item_id);

// Remove from queue
int download_manager_remove(DownloadManager* mgr, int item_id);

// Get download item
DownloadItem* download_manager_get_item(DownloadManager* mgr, int item_id);

// Poll for updates (call in main loop)
void download_manager_poll(DownloadManager* mgr);

// Set progress callback
void download_manager_set_progress_callback(DownloadManager* mgr, 
                                            DownloadProgressCallback cb, void* user_data);

// Render progress overlay
void download_manager_render_progress(DownloadManager* mgr);

#endif // DOWNLOAD_MANAGER_H