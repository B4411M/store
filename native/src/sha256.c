/**
 * B41M HEN STORE - SHA256
 * Implementation using mbedTLS
 */

#include "sha256.h"
#include "utils/log.h"
#include <mbedtls/sha256.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

struct SHA256Context {
    mbedtls_sha256_context ctx;
};

bool sha256_compute(const void* data, size_t len, char* output_hex) {
    if (!data || !output_hex) return false;
    
    unsigned char hash[32];
    int ret = mbedtls_sha256_ret((const unsigned char*)data, len, hash, 0);
    if (ret != 0) {
        LOG_ERROR("SHA256 computation failed: %d", ret);
        return false;
    }
    
    for (int i = 0; i < 32; i++) {
        sprintf(output_hex + (i * 2), "%02x", hash[i]);
    }
    output_hex[64] = '\0';
    
    return true;
}

bool sha256_compute_file(const char* filepath, char* output_hex) {
    if (!filepath || !output_hex) return false;
    
    FILE* f = fopen(filepath, "rb");
    if (!f) {
        LOG_ERROR("Failed to open file: %s", filepath);
        return false;
    }
    
    mbedtls_sha256_context ctx;
    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts_ret(&ctx, 0);
    
    unsigned char buffer[8192];
    size_t bytes_read;
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), f)) > 0) {
        mbedtls_sha256_update_ret(&ctx, buffer, bytes_read);
    }
    fclose(f);
    
    unsigned char hash[32];
    int ret = mbedtls_sha256_finish_ret(&ctx, hash);
    mbedtls_sha256_free(&ctx);
    
    if (ret != 0) {
        LOG_ERROR("SHA256 file computation failed: %d", ret);
        return false;
    }
    
    for (int i = 0; i < 32; i++) {
        sprintf(output_hex + (i * 2), "%02x", hash[i]);
    }
    output_hex[64] = '\0';
    
    return true;
}

SHA256Context* sha256_init(void) {
    SHA256Context* ctx = calloc(1, sizeof(SHA256Context));
    if (!ctx) return NULL;
    
    mbedtls_sha256_init(&ctx->ctx);
    mbedtls_sha256_starts_ret(&ctx->ctx, 0);
    
    return ctx;
}

bool sha256_update(SHA256Context* ctx, const void* data, size_t len) {
    if (!ctx || !data) return false;
    
    int ret = mbedtls_sha256_update_ret(&ctx->ctx, (const unsigned char*)data, len);
    return ret == 0;
}

bool sha256_final(SHA256Context* ctx, char* output_hex) {
    if (!ctx || !output_hex) return false;
    
    unsigned char hash[32];
    int ret = mbedtls_sha256_finish_ret(&ctx->ctx, hash);
    mbedtls_sha256_free(&ctx->ctx);
    
    if (ret != 0) return false;
    
    for (int i = 0; i < 32; i++) {
        sprintf(output_hex + (i * 2), "%02x", hash[i]);
    }
    output_hex[64] = '\0';
    
    return true;
}

void sha256_free(SHA256Context* ctx) {
    if (!ctx) return;
    mbedtls_sha256_free(&ctx->ctx);
    free(ctx);
}

bool sha256_verify(const char* expected_hex, const char* actual_hex) {
    if (!expected_hex || !actual_hex) return false;
    
    // Case-insensitive comparison
    for (int i = 0; i < 64; i++) {
        char e = expected_hex[i];
        char a = actual_hex[i];
        if (e >= 'A' && e <= 'F') e = e - 'A' + 'a';
        if (a >= 'A' && a <= 'F') a = a - 'A' + 'a';
        if (e != a) return false;
    }
    return true;
}