/**
 * B41M HEN STORE - Render
 * Header file
 */

#ifndef RENDER_H
#define RENDER_H

#include <stdbool.h>

typedef struct RenderContext RenderContext;

// Initialize renderer
int render_init(void);

// Cleanup renderer
void render_cleanup(void);

// Begin frame
void render_begin_frame(void);

// End frame (swap buffers)
void render_end_frame(void);

// Clear screen
void render_clear(float r, float g, float b, float a);

// Draw rectangle
void render_draw_rect(float x, float y, float w, float h, float r, float g, float b, float a);

// Draw text
void render_draw_text(const char* text, float x, float y, float scale, 
                      float r, float g, float b, float a);

// Draw texture
void render_draw_texture(void* texture, float x, float y, float w, float h);

// Create texture from file
void* render_create_texture(const char* filepath);

// Destroy texture
void render_destroy_texture(void* texture);

// Set viewport
void render_set_viewport(int x, int y, int w, int h);

// Get screen dimensions
void render_get_screen_size(int* w, int* h);

#endif // RENDER_H