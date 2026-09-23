/**
 * B41M HEN STORE - Render
 * Stub implementation using libGXM or similar
 */

#include "ui/render.h"
#include "utils/log.h"
#include <stdlib.h>

#ifdef ORBIS
#include <gxm.h>
#include <vita2d.h>
#else
#include <stdio.h>
#endif

static bool g_render_initialized = false;

int render_init(void) {
    if (g_render_initialized) return 0;
    
#ifdef ORBIS
    // Initialize libGXM / vita2d
    // vita2d_init();
    LOG_INFO("Renderer initialized (PS4)");
#else
    LOG_INFO("Renderer initialized (host mode - stub)");
#endif
    
    g_render_initialized = true;
    return 0;
}

void render_cleanup(void) {
    if (!g_render_initialized) return;
    
#ifdef ORBIS
    // vita2d_fini();
#endif
    
    g_render_initialized = false;
    LOG_INFO("Renderer cleaned up");
}

void render_begin_frame(void) {
    if (!g_render_initialized) return;
    
#ifdef ORBIS
    // vita2d_start_drawing();
    // vita2d_clear_screen();
#else
    // Stub
#endif
}

void render_end_frame(void) {
    if (!g_render_initialized) return;
    
#ifdef ORBIS
    // vita2d_end_drawing();
    // vita2d_swap_buffers();
#else
    // Stub
#endif
}

void render_clear(float r, float g, float b, float a) {
    if (!g_render_initialized) return;
    
#ifdef ORBIS
    // vita2d_clear_screen();
    // Color would be set via RGBA8
#else
    // Stub
#endif
}

void render_draw_rect(float x, float y, float w, float h, float r, float g, float b, float a) {
    if (!g_render_initialized) return;
    
#ifdef ORBIS
    // vita2d_draw_rectangle(x, y, w, h, RGBA8(r*255, g*255, b*255, a*255));
#else
    // Stub
#endif
}

void render_draw_text(const char* text, float x, float y, float scale, 
                      float r, float g, float b, float a) {
    if (!g_render_initialized || !text) return;
    
#ifdef ORBIS
    // vita2d_pgf_draw_text or similar
#else
    // Stub
#endif
}

void render_draw_texture(void* texture, float x, float y, float w, float h) {
    if (!g_render_initialized || !texture) return;
    
#ifdef ORBIS
    // vita2d_draw_texture(texture, x, y);
    // vita2d_draw_texture_scale(texture, x, y, w/orig_w, h/orig_h);
#else
    // Stub
#endif
}

void* render_create_texture(const char* filepath) {
    if (!filepath) return NULL;
    
#ifdef ORBIS
    // return vita2d_load_PNG_file(filepath);
    LOG_INFO("Loading texture: %s", filepath);
    return NULL;
#else
    LOG_INFO("Loading texture (stub): %s", filepath);
    return NULL;
#endif
}

void render_destroy_texture(void* texture) {
    if (!texture) return;
    
#ifdef ORBIS
    // vita2d_free_texture(texture);
#else
    // Stub
#endif
}

void render_set_viewport(int x, int y, int w, int h) {
    // Stub
}

void render_get_screen_size(int* w, int* h) {
    if (w) *w = 1280;
    if (h) *h = 720;
}