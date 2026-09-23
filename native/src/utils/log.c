/**
 * B41M HEN STORE - Logging
 * Implementation
 */

#include "utils/log.h"
#include <stdio.h>
#include <stdarg.h>
#include <time.h>

static LogLevel g_log_level = LOG_INFO;
static FILE* g_log_file = NULL;

const char* log_level_names[] = {
    "DEBUG",
    "INFO",
    "WARN",
    "ERROR"
};

const char* log_level_colors[] = {
    "\033[36m",  // DEBUG - cyan
    "\033[32m",  // INFO - green
    "\033[33m",  // WARN - yellow
    "\033[31m"   // ERROR - red
};

const char* log_reset_color = "\033[0m";

int log_init(LogLevel level) {
    g_log_level = level;
    
    // Open log file
    g_log_file = fopen("b41m_store.log", "a");
    if (!g_log_file) {
        // Not fatal, just log to stdout
    }
    
    LOG_INFO("Logging initialized at level %s", log_level_names[level]);
    return 0;
}

void log_cleanup(void) {
    if (g_log_file) {
        fclose(g_log_file);
        g_log_file = NULL;
    }
}

static void log_write(LogLevel level, const char* fmt, va_list args) {
    if (level < g_log_level) return;
    
    // Get timestamp
    time_t now = time(NULL);
    struct tm* tm_info = localtime(&now);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);
    
    // Format message
    char message[1024];
    vsnprintf(message, sizeof(message), fmt, args);
    
    // Print to stdout with color
    printf("%s[%s] %s: %s%s\n", log_level_colors[level], timestamp, log_level_names[level], message, log_reset_color);
    
    // Write to file
    if (g_log_file) {
        fprintf(g_log_file, "[%s] %s: %s\n", timestamp, log_level_names[level], message);
        fflush(g_log_file);
    }
}

void log_debug(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log_write(LOG_DEBUG, fmt, args);
    va_end(args);
}

void log_info(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log_write(LOG_INFO, fmt, args);
    va_end(args);
}

void log_warn(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log_write(LOG_WARN, fmt, args);
    va_end(args);
}

void log_error(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log_write(LOG_ERROR, fmt, args);
    va_end(args);
}

void log_set_level(LogLevel level) {
    g_log_level = level;
}

LogLevel log_get_level(void) {
    return g_log_level;
}