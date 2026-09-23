/**
 * B41M HEN STORE - WebView
 * Stub implementation
 */

#include "ui/webview.h"
#include "utils/log.h"
#include <stdlib.h>
#include <string.h>

struct WebView {
    char* title;
    int width, height;
    char* current_url;
    WebViewLoadCallback load_cb;
    void* load_user_data;
    WebViewMessageCallback msg_cb;
    void* msg_user_data;
};

WebView* webview_create(const char* title, int width, int height) {
    WebView* wv = calloc(1, sizeof(WebView));
    if (!wv) return NULL;
    
    wv->title = title ? strdup(title) : strdup("B41M HEN STORE");
    wv->width = width > 0 ? width : 1280;
    wv->height = height > 0 ? height : 720;
    
    LOG_INFO("WebView created: %s (%dx%d)", wv->title, wv->width, wv->height);
    return wv;
}

void webview_destroy(WebView* webview) {
    if (!webview) return;
    free(webview->title);
    free(webview->current_url);
    free(webview);
    LOG_INFO("WebView destroyed");
}

int webview_load_url(WebView* webview, const char* url) {
    if (!webview || !url) return -1;
    
    free(webview->current_url);
    webview->current_url = strdup(url);
    
    LOG_INFO("WebView loading: %s", url);
    
    if (webview->load_cb) {
        webview->load_cb(webview, url, true, webview->load_user_data);
    }
    
    return 0;
}

int webview_load_html(WebView* webview, const char* html) {
    if (!webview || !html) return -1;
    LOG_INFO("WebView loading HTML (%zu bytes)", strlen(html));
    return 0;
}

int webview_eval_js(WebView* webview, const char* js) {
    if (!webview || !js) return -1;
    LOG_DEBUG("WebView eval JS: %s", js);
    return 0;
}

int webview_inject_input(WebView* webview, const void* event) {
    if (!webview || !event) return -1;
    return 0;
}

void webview_render(WebView* webview) {
    if (!webview) return;
    // Stub - would render webview texture
}

void webview_set_user_agent(WebView* webview, const char* ua) {
    (void)webview;
    (void)ua;
}

void webview_set_load_callback(WebView* webview, WebViewLoadCallback cb, void* user_data) {
    if (!webview) return;
    webview->load_cb = cb;
    webview->load_user_data = user_data;
}

void webview_set_message_callback(WebView* webview, WebViewMessageCallback cb, void* user_data) {
    if (!webview) return;
    webview->msg_cb = cb;
    webview->msg_user_data = user_data;
}