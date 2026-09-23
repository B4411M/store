/**
 * B41M HEN STORE - Input
 * Header file
 */

#ifndef INPUT_H
#define INPUT_H

#include <stdbool.h>

typedef enum {
    INPUT_QUIT = 0,
    INPUT_NAVIGATE,
    INPUT_SELECT,
    INPUT_BACK,
    INPUT_DOWNLOAD,
    INPUT_INSTALL,
    INPUT_SEARCH,
    INPUT_MENU,
    INPUT_UP,
    INPUT_DOWN,
    INPUT_LEFT,
    INPUT_RIGHT,
    INPUT_L1,
    INPUT_R1,
    INPUT_L2,
    INPUT_R2,
    INPUT_L3,
    INPUT_R3,
    INPUT_OPTIONS,
    INPUT_TOUCHPAD
} InputType;

typedef struct {
    InputType type;
    int value;  // For analog sticks, etc.
    float x, y; // For touchpad
} InputEvent;

// Initialize input system
int input_init(void);

// Cleanup input system
void input_cleanup(void);

// Poll for next event (returns true if event available)
bool input_poll(InputEvent* event);

// Get button state
bool input_is_pressed(InputType button);

// Get analog stick values
void input_get_analog(int stick, float* x, float* y); // 0 = left, 1 = right

// Vibrate controller
void input_vibrate(float small_motor, float large_motor, int duration_ms);

#endif // INPUT_H