/**
 * B41M HEN STORE - Storage Manager
 * Stub implementation
 */

#include "storage_manager.h"
#include "utils/log.h"
#include <sys/statvfs.h>
#include <string.h>

int storage_manager_init(void) {
    LOG_INFO("Storage manager initialized");
    return 0;
}

void storage_manager_cleanup(void) {
    LOG_INFO("Storage manager cleaned up");
}

bool storage_get_info(const char* path, StorageInfo* info) {
    if (!path || !info) return false;
    
    struct statvfs stat;
    if (statvfs(path, &stat) != 0) {
        return false;
    }
    
    info->total_space = (long long)stat.f_blocks * stat.f_frsize;
    info->free_space = (long long)stat.f_bfree * stat.f_frsize;
    info->used_space = info->total_space - info->free_space;
    
    return true;
}

bool storage_check_space(const char* path, long long required_bytes, long long* available_out) {
    if (!path) return false;
    
    StorageInfo info;
    if (!storage_get_info(path, &info)) {
        return false;
    }
    
    // Add 10% buffer
    long long required_with_buffer = required_bytes + (required_bytes / 10);
    
    if (available_out) *available_out = info.free_space;
    
    return info.free_space >= required_with_buffer;
}

void storage_format_size(long long bytes, char* buffer, size_t buffer_size) {
    if (!buffer || buffer_size == 0) return;
    
    const char* units[] = {"B", "KB", "MB", "GB", "TB"};
    int unit = 0;
    double size = (double)bytes;
    
    while (size >= 1024.0 && unit < 4) {
        size /= 1024.0;
        unit++;
    }
    
    snprintf(buffer, buffer_size, "%.2f %s", size, units[unit]);
}