/**
 * B41M HEN STORE - Logging
 * Header file
 */

#ifndef LOG_H
#define LOG_H

#include <stdbool.h>

typedef enum {
    LOG_DEBUG = 0,
    LOG_INFO,
    LOG_WARN,
    LOG_ERROR
} LogLevel;

// Initialize logging
int log_init(LogLevel level);

// Cleanup logging
void log_cleanup(void);

// Log functions
void log_debug(const char* fmt, ...);
void log_info(const char* fmt, ...);
void log_warn(const char* fmt, ...);
void log_error(const char* fmt, ...);

#define LOG_DEBUG(...) log_debug(__VA_ARGS__)
#define LOG_INFO(...) log_info(__VA_ARGS__)
#define LOG_WARN(...) log_warn(__VA_ARGS__)
#define LOG_ERROR(...) log_error(__VA_ARGS__)

// Set log level
void log_set_level(LogLevel level);

// Get log level
LogLevel log_get_level(void);

#endif // LOG_H