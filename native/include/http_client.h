/**
 * B41M HEN STORE - HTTP Client
 * Header file
 */

#ifndef HTTP_CLIENT_H
#define HTTP_CLIENT_H

#include <stdbool.h>
#include <stddef.h>

typedef struct HttpClient HttpClient;
typedef struct HttpResponse HttpResponse;

struct HttpResponse {
    int status_code;
    char* body;
    size_t body_len;
    char** headers;
    size_t header_count;
};

// Initialize HTTP client
int http_client_init(void);

// Cleanup HTTP client
void http_client_cleanup(void);

// GET request
HttpResponse* http_get(const char* url, const char* headers[]);

// POST request with form data
HttpResponse* http_post(const char* url, const char* headers[], const char* form_data);

// Download file with progress callback
typedef void (*DownloadProgressCallback)(size_t downloaded, size_t total, void* user_data);
int http_download_file(const char* url, const char* output_path, 
                       DownloadProgressCallback progress_cb, void* user_data);

// Free response
void http_response_free(HttpResponse* response);

// Set default headers
void http_set_default_headers(const char* user_agent);

#endif // HTTP_CLIENT_H