/**
 * B41M HEN STORE - Input
 * Stub implementation
 */

#include "ui/input.h"
#include "utils/log.h"

#ifdef ORBIS
#include <orbis/pad.h>
#include <orbis/kernel.h>
#endif

static bool g_input_initialized = false;

#ifdef ORBIS
static int g_pad_handle = -1;
#endif

int input_init(void) {
    if (g_input_initialized) return 0;
    
#ifdef ORBIS
    int ret = scePadInit();
    if (ret < 0) {
        LOG_ERROR("Failed to initialize pad: %d", ret);
        return -1;
    }
    
    g_pad_handle = scePadOpen(0, 0, 0, NULL);
    if (g_pad_handle < 0) {
        LOG_ERROR("Failed to open pad: %d", g_pad_handle);
        return -1;
    }
#else
    LOG_INFO("Input initialized (host mode)");
#endif
    
    g_input_initialized = true;
    return 0;
}

void input_cleanup(void) {
    if (!g_input_initialized) return;
    
#ifdef ORBIS
    if (g_pad_handle >= 0) {
        scePadClose(g_pad_handle);
        g_pad_handle = -1;
    }
    scePadFinish();
#endif
    
    g_input_initialized = false;
    LOG_INFO("Input cleaned up");
}

bool input_poll(InputEvent* event) {
    if (!event || !g_input_initialized) return false;
    
#ifdef ORBIS
    ScePadData pad_data;
    int ret = scePadReadState(g_pad_handle, &pad_data);
    if (ret < 0) return false;
    
    // Check buttons
    if (pad_data.buttons & SCE_PAD_BUTTON_CROSS) {
        event->type = INPUT_SELECT;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_CIRCLE) {
        event->type = INPUT_BACK;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_TRIANGLE) {
        event->type = INPUT_MENU;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_SQUARE) {
        event->type = INPUT_SEARCH;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_UP) {
        event->type = INPUT_UP;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_DOWN) {
        event->type = INPUT_DOWN;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_LEFT) {
        event->type = INPUT_LEFT;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_RIGHT) {
        event->type = INPUT_RIGHT;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_L1) {
        event->type = INPUT_L1;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_R1) {
        event->type = INPUT_R1;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_L2) {
        event->type = INPUT_L2;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_R2) {
        event->type = INPUT_R2;
        return true;
    }
    if (pad_data.buttons & SCE_PAD_BUTTON_OPTIONS) {
        event->type = INPUT_OPTIONS;
        return true;
    }
    
    // Analog sticks
    if (pad_data.lx != 128 || pad_data.ly != 128) {
        event->type = INPUT_NAVIGATE;
        event->x = (pad_data.lx - 128) / 128.0f;
        event->y = (pad_data.ly - 128) / 128.0f;
        return true;
    }
    
    return false;
#else
    // Host mode - return false (no input)
    return false;
#endif
}

bool input_is_pressed(InputType button) {
#ifdef ORBIS
    if (!g_input_initialized) return false;
    
    ScePadData pad_data;
    int ret = scePadReadState(g_pad_handle, &pad_data);
    if (ret < 0) return false;
    
    switch (button) {
        case INPUT_SELECT: return pad_data.buttons & SCE_PAD_BUTTON_CROSS;
        case INPUT_BACK: return pad_data.buttons & SCE_PAD_BUTTON_CIRCLE;
        case INPUT_MENU: return pad_data.buttons & SCE_PAD_BUTTON_TRIANGLE;
        case INPUT_SEARCH: return pad_data.buttons & SCE_PAD_BUTTON_SQUARE;
        case INPUT_UP: return pad_data.buttons & SCE_PAD_BUTTON_UP;
        case INPUT_DOWN: return pad_data.buttons & SCE_PAD_BUTTON_DOWN;
        case INPUT_LEFT: return pad_data.buttons & SCE_PAD_BUTTON_LEFT;
        case INPUT_RIGHT: return pad_data.buttons & SCE_PAD_BUTTON_RIGHT;
        case INPUT_L1: return pad_data.buttons & SCE_PAD_BUTTON_L1;
        case INPUT_R1: return pad_data.buttons & SCE_PAD_BUTTON_R1;
        case INPUT_L2: return pad_data.buttons & SCE_PAD_BUTTON_L2;
        case INPUT_R2: return pad_data.buttons & SCE_PAD_BUTTON_R2;
        case INPUT_OPTIONS: return pad_data.buttons & SCE_PAD_BUTTON_OPTIONS;
        default: return false;
    }
#else
    return false;
#endif
}

void input_get_analog(int stick, float* x, float* y) {
    if (!x || !y) return;
    *x = 0.0f;
    *y = 0.0f;
    
#ifdef ORBIS
    if (!g_input_initialized) return;
    
    ScePadData pad_data;
    int ret = scePadReadState(g_pad_handle, &pad_data);
    if (ret < 0) return;
    
    if (stick == 0) { // Left stick
        *x = (pad_data.lx - 128) / 128.0f;
        *y = (pad_data.ly - 128) / 128.0f;
    } else if (stick == 1) { // Right stick
        *x = (pad_data.rx - 128) / 128.0f;
        *y = (pad_data.ry - 128) / 128.0f;
    }
#endif
}

void input_vibrate(float small_motor, float large_motor, int duration_ms) {
#ifdef ORBIS
    if (!g_input_initialized) return;
    
    ScePadVibrationParam vib = {0};
    vib.small_motor = (uint8_t)(small_motor * 255);
    vib.large_motor = (uint8_t)(large_motor * 255);
    vib.duration = duration_ms;
    
    scePadSetVibration(g_pad_handle, &vib);
#endif
}