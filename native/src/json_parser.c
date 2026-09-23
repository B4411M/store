/**
 * B41M HEN STORE - JSON Parser
 * Stub implementation (using cJSON)
 */

#include "json_parser.h"
#include "utils/log.h"
#include <cjson/cJSON.h>
#include <stdlib.h>
#include <string.h>

int json_parser_init(void) {
    LOG_INFO("JSON parser initialized");
    return 0;
}

void json_parser_cleanup(void) {
    LOG_INFO("JSON parser cleaned up");
}

static char* cjson_get_string(cJSON* obj, const char* key, const char* default_val) {
    cJSON* item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsString(item) && item->valuestring) {
        return strdup(item->valuestring);
    }
    return default_val ? strdup(default_val) : NULL;
}

static long long cjson_get_int64(cJSON* obj, const char* key, long long default_val) {
    cJSON* item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsNumber(item)) {
        return (long long)item->valuedouble;
    }
    return default_val;
}

static bool cjson_get_bool(cJSON* obj, const char* key, bool default_val) {
    cJSON* item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsBool(item)) {
        return cJSON_IsTrue(item);
    }
    return default_val;
}

GameEntry** parse_games_json(const char* json_str, int* count) {
    if (!json_str || !count) return NULL;
    
    cJSON* root = cJSON_Parse(json_str);
    if (!root) {
        LOG_ERROR("Failed to parse games JSON");
        *count = 0;
        return NULL;
    }
    
    cJSON* games = cJSON_GetObjectItemCaseSensitive(root, "games");
    if (!cJSON_IsArray(games)) {
        LOG_ERROR("No games array in JSON");
        cJSON_Delete(root);
        *count = 0;
        return NULL;
    }
    
    int num_games = cJSON_GetArraySize(games);
    GameEntry** entries = calloc(num_games, sizeof(GameEntry*));
    
    for (int i = 0; i < num_games; i++) {
        cJSON* game = cJSON_GetArrayItem(games, i);
        if (!game) continue;
        
        GameEntry* entry = calloc(1, sizeof(GameEntry));
        entry->id = cjson_get_string(game, "id", NULL);
        entry->title = cjson_get_string(game, "title", NULL);
        entry->title_id = cjson_get_string(game, "title_id", NULL);
        entry->type = cjson_get_string(game, "type", NULL);
        entry->category = cjson_get_string(game, "category", NULL);
        entry->version = cjson_get_string(game, "version", NULL);
        
        cJSON* firmware = cJSON_GetObjectItemCaseSensitive(game, "firmware");
        if (firmware) {
            entry->firmware_min = cjson_get_string(firmware, "min", "9.00");
            entry->firmware_max = cjson_get_string(firmware, "max", "13.00");
        }
        
        entry->size = cjson_get_int64(game, "size", 0);
        
        cJSON* pkg = cJSON_GetObjectItemCaseSensitive(game, "pkg");
        if (pkg) {
            entry->pkg_url = cjson_get_string(pkg, "url", NULL);
            entry->pkg_sha256 = cjson_get_string(pkg, "sha256", NULL);
        }
        
        cJSON* media = cJSON_GetObjectItemCaseSensitive(game, "media");
        if (media) {
            entry->icon_url = cjson_get_string(media, "icon", NULL);
            entry->background_url = cjson_get_string(media, "background", NULL);
        }
        
        // Screenshots array
        cJSON* screenshots = cJSON_GetObjectItemCaseSensitive(game, "screenshots");
        if (cJSON_IsArray(screenshots)) {
            entry->screenshot_count = cJSON_GetArraySize(screenshots);
            entry->screenshots = calloc(entry->screenshot_count, sizeof(char*));
            for (int j = 0; j < entry->screenshot_count; j++) {
                cJSON* ss = cJSON_GetArrayItem(screenshots, j);
                if (cJSON_IsString(ss)) {
                    entry->screenshots[j] = strdup(ss->valuestring);
                }
            }
        }
        
        entry->description = cjson_get_string(game, "description", NULL);
        entry->author = cjson_get_string(game, "author", NULL);
        entry->website = cjson_get_string(game, "website", NULL);
        entry->source = cjson_get_string(game, "source", NULL);
        entry->license = cjson_get_string(game, "license", NULL);
        entry->changelog = cjson_get_string(game, "changelog", NULL);
        entry->featured = cjson_get_bool(game, "featured", false);
        entry->downloads = (int)cjson_get_int64(game, "downloads", 0);
        entry->created_at = cjson_get_string(game, "createdAt", NULL);
        
        entries[i] = entry;
    }
    
    *count = num_games;
    cJSON_Delete(root);
    return entries;
}

CategoryEntry** parse_categories_json(const char* json_str, int* count) {
    // Stub
    *count = 0;
    return NULL;
}

FeaturedEntry** parse_featured_json(const char* json_str, int* count) {
    // Stub
    *count = 0;
    return NULL;
}

VersionInfo* parse_version_json(const char* json_str) {
    if (!json_str) return NULL;
    
    cJSON* root = cJSON_Parse(json_str);
    if (!root) return NULL;
    
    VersionInfo* info = calloc(1, sizeof(VersionInfo));
    info->version = (int)cjson_get_int64(root, "version", 1);
    info->updated = cjson_get_string(root, "updated", NULL);
    info->min_app_version = (int)cjson_get_int64(root, "min_app_version", 10000);
    
    cJSON_Delete(root);
    return info;
}

void free_game_entries(GameEntry** entries, int count) {
    if (!entries) return;
    for (int i = 0; i < count; i++) {
        GameEntry* e = entries[i];
        if (!e) continue;
        free(e->id);
        free(e->title);
        free(e->title_id);
        free(e->type);
        free(e->category);
        free(e->version);
        free(e->firmware_min);
        free(e->firmware_max);
        free(e->pkg_url);
        free(e->pkg_sha256);
        free(e->icon_url);
        free(e->background_url);
        if (e->screenshots) {
            for (int j = 0; j < e->screenshot_count; j++) free(e->screenshots[j]);
            free(e->screenshots);
        }
        free(e->description);
        free(e->author);
        free(e->website);
        free(e->source);
        free(e->license);
        free(e->changelog);
        free(e->created_at);
        free(e);
    }
    free(entries);
}

void free_category_entries(CategoryEntry** entries, int count) {
    // Stub
}

void free_featured_entries(FeaturedEntry** entries, int count) {
    // Stub
}

void free_version_info(VersionInfo* info) {
    if (!info) return;
    free(info->updated);
    free(info);
}