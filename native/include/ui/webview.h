/**
 * B41M HEN STORE - WebView
 * Header file
 */

#ifndef WEBVIEW_H
#define WEBVIEW_H

#include <stdbool.h>

typedef struct WebView WebView;

// Create webview
WebView* webview_create(const char* title, int width, int height);

// Destroy webview
void webview_destroy(WebView* webview);

// Load URL
int webview_load_url(WebView* webview, const char* url);

// Load HTML string
int webview_load_html(WebView* webview, const char* html);

// Evaluate JavaScript
int webview_eval_js(WebView* webview, const char* js);

// Inject input event
int webview_inject_input(WebView* webview, const void* event);

// Render webview
void webview_render(WebView* webview);

// Set user agent
void webview_set_user_agent(WebView* webview, const char* ua);

// Set callbacks
typedef void (*WebViewLoadCallback)(WebView* webview, const char* url, bool success, void* user_data);
typedef void (*WebViewMessageCallback)(WebView* webview, const char* message, void* user_data);

void webview_set_load_callback(WebView* webview, WebViewLoadCallback cb, void* user_data);
void webview_set_message_callback(WebView* webview, WebViewMessageCallback cb, void* user_data);

#endif // WEBVIEW_H