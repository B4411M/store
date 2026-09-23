/**
 * B41M HEN STORE - SHA256
 * Header file
 */

#ifndef SHA256_H
#define SHA256_H

#include <stdbool.h>
#include <stddef.h>

typedef struct SHA256Context SHA256Context;

// Compute SHA256 of data
bool sha256_compute(const void* data, size_t len, char* output_hex);

// Compute SHA256 of file
bool sha256_compute_file(const char* filepath, char* output_hex);

// Initialize streaming context
SHA256Context* sha256_init(void);

// Update streaming hash
bool sha256_update(SHA256Context* ctx, const void* data, size_t len);

// Finalize streaming hash
bool sha256_final(SHA256Context* ctx, char* output_hex);

// Free context
void sha256_free(SHA256Context* ctx);

// Verify hash
bool sha256_verify(const char* expected_hex, const char* actual_hex);

#endif // SHA256_H