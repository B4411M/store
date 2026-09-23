/**
 * B41M HEN STORE - JSON Parser
 * Header file (using cJSON)
 */

#ifndef JSON_PARSER_H
#define JSON_PARSER_H

#include <stdbool.h>

typedef struct JSONValue JSONValue;
typedef struct GameEntry GameEntry;
typedef struct CategoryEntry CategoryEntry;
typedef struct FeaturedEntry FeaturedEntry;
typedef struct VersionInfo VersionInfo;

struct GameEntry {
    char* id;
    char* title;
    char* title_id;
    char* type;
    char* category;
    char* version;
    char* firmware_min;
    char* firmware_max;
    long long size;
    char* pkg_url;
    char* pkg_sha256;
    char* icon_url;
    char* background_url;
    char** screenshots;
    int screenshot_count;
    char* description;
    char* author;
    char* website;
    char* source;
    char* license;
    char* changelog;
    bool featured;
    int downloads;
    char* created_at;
};

struct CategoryEntry {
    char* id;
    char* name;
    char* icon;
    char* description;
};

struct FeaturedEntry {
    char* id;
    char* title;
    char* type;
    char* category;
    char* badge;
    char* image;
    char* description;
};

struct VersionInfo {
    int version;
    char* updated;
    int min_app_version;
};

// Initialize JSON parser
int json_parser_init(void);

// Cleanup JSON parser
void json_parser_cleanup(void);

// Parse games.json
GameEntry** parse_games_json(const char* json_str, int* count);

// Parse categories.json
CategoryEntry** parse_categories_json(const char* json_str, int* count);

// Parse featured.json
FeaturedEntry** parse_featured_json(const char* json_str, int* count);

// Parse version.json
VersionInfo* parse_version_json(const char* json_str);

// Free functions
void free_game_entries(GameEntry** entries, int count);
void free_category_entries(CategoryEntry** entries, int count);
void free_featured_entries(FeaturedEntry** entries, int count);
void free_version_info(VersionInfo* info);

#endif // JSON_PARSER_H