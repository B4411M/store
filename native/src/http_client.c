/**
 * B41M HEN STORE - HTTP Client
 * Stub implementation
 */

#include "http_client.h"
#include "utils/log.h"

#include <curl/curl.h>
#include <stdlib.h>
#include <string.h>

static CURL* g_curl = NULL;
static char* g_user_agent = "Mozilla/5.0 (PlayStation 4) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/601.1";

struct HttpClient {
    CURL* handle;
};

struct HttpResponse {
    int status_code;
    char* body;
    size_t body_len;
    char** headers;
    size_t header_count;
};

static size_t write_callback(void* contents, size_t size, size_t nmemb, void* userp) {
    size_t realsize = size * nmemb;
    HttpResponse* response = (HttpResponse*)userp;
    
    char* new_body = realloc(response->body, response->body_len + realsize + 1);
    if (!new_body) return 0;
    
    response->body = new_body;
    memcpy(&(response->body[response->body_len]), contents, realsize);
    response->body_len += realsize;
    response->body[response->body_len] = '\0';
    
    return realsize;
}

static size_t header_callback(char* buffer, size_t size, size_t nitems, void* userdata) {
    // Parse headers if needed
    return size * nitems;
}

int http_client_init(void) {
    if (curl_global_init(CURL_GLOBAL_ALL) != CURLE_OK) {
        LOG_ERROR("Failed to initialize libcurl");
        return -1;
    }
    
    g_curl = curl_easy_init();
    if (!g_curl) {
        LOG_ERROR("Failed to create curl handle");
        return -1;
    }
    
    curl_easy_setopt(g_curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(g_curl, CURLOPT_HEADERFUNCTION, header_callback);
    curl_easy_setopt(g_curl, CURLOPT_USERAGENT, g_user_agent);
    curl_easy_setopt(g_curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(g_curl, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(g_curl, CURLOPT_SSL_VERIFYHOST, 2L);
    curl_easy_setopt(g_curl, CURLOPT_TIMEOUT, 30L);
    curl_easy_setopt(g_curl, CURLOPT_CONNECTTIMEOUT, 10L);
    
    LOG_INFO("HTTP client initialized");
    return 0;
}

void http_client_cleanup(void) {
    if (g_curl) {
        curl_easy_cleanup(g_curl);
        g_curl = NULL;
    }
    curl_global_cleanup();
    LOG_INFO("HTTP client cleaned up");
}

HttpResponse* http_get(const char* url, const char* headers[]) {
    if (!g_curl || !url) return NULL;
    
    HttpResponse* response = calloc(1, sizeof(HttpResponse));
    if (!response) return NULL;
    
    curl_easy_setopt(g_curl, CURLOPT_URL, url);
    curl_easy_setopt(g_curl, CURLOPT_HTTPGET, 1L);
    curl_easy_setopt(g_curl, CURLOPT_WRITEDATA, response);
    
    struct curl_slist* chunk = NULL;
    if (headers) {
        for (int i = 0; headers[i]; i++) {
            chunk = curl_slist_append(chunk, headers[i]);
        }
    }
    if (chunk) curl_easy_setopt(g_curl, CURLOPT_HTTPHEADER, chunk);
    
    CURLcode res = curl_easy_perform(g_curl);
    
    if (chunk) curl_slist_free_all(chunk);
    
    if (res != CURLE_OK) {
        LOG_ERROR("HTTP GET failed: %s", curl_easy_strerror(res));
        http_response_free(response);
        return NULL;
    }
    
    curl_easy_getinfo(g_curl, CURLINFO_RESPONSE_CODE, &response->status_code);
    return response;
}

HttpResponse* http_post(const char* url, const char* headers[], const char* form_data) {
    if (!g_curl || !url) return NULL;
    
    HttpResponse* response = calloc(1, sizeof(HttpResponse));
    if (!response) return NULL;
    
    curl_easy_setopt(g_curl, CURLOPT_URL, url);
    curl_easy_setopt(g_curl, CURLOPT_POST, 1L);
    curl_easy_setopt(g_curl, CURLOPT_POSTFIELDS, form_data);
    curl_easy_setopt(g_curl, CURLOPT_WRITEDATA, response);
    
    struct curl_slist* chunk = NULL;
    if (headers) {
        for (int i = 0; headers[i]; i++) {
            chunk = curl_slist_append(chunk, headers[i]);
        }
    }
    if (chunk) curl_easy_setopt(g_curl, CURLOPT_HTTPHEADER, chunk);
    
    CURLcode res = curl_easy_perform(g_curl);
    
    if (chunk) curl_slist_free_all(chunk);
    
    if (res != CURLE_OK) {
        LOG_ERROR("HTTP POST failed: %s", curl_easy_strerror(res));
        http_response_free(response);
        return NULL;
    }
    
    curl_easy_getinfo(g_curl, CURLINFO_RESPONSE_CODE, &response->status_code);
    return response;
}

int http_download_file(const char* url, const char* output_path, 
                       DownloadProgressCallback progress_cb, void* user_data) {
    // Stub implementation
    LOG_INFO("Downloading %s to %s", url, output_path);
    return 0;
}

void http_response_free(HttpResponse* response) {
    if (!response) return;
    free(response->body);
    if (response->headers) {
        for (size_t i = 0; i < response->header_count; i++) {
            free(response->headers[i]);
        }
        free(response->headers);
    }
    free(response);
}

void http_set_default_headers(const char* user_agent) {
    if (user_agent) {
        free(g_user_agent);
        g_user_agent = strdup(user_agent);
        if (g_curl) {
            curl_easy_setopt(g_curl, CURLOPT_USERAGENT, g_user_agent);
        }
    }
}