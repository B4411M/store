/**
 * B41M HEN STORE - Storage Manager
 * Header file
 */

#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include <stddef.h>

#include <stdbool.h>

typedef struct {
    long long total_space;
    long long free_space;
    long long used_space;
} StorageInfo;

// Initialize storage manager
int storage_manager_init(void);

// Cleanup storage manager
void storage_manager_cleanup(void);

// Get storage info for a path
bool storage_get_info(const char* path, StorageInfo* info);

// Check if enough space for download
bool storage_check_space(const char* path, long long required_bytes, long long* available_out);

// Format size for display
void storage_format_size(long long bytes, char* buffer, size_t buffer_size);

#endif // STORAGE_MANAGER_H