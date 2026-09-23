#!/usr/bin/env python3
"""
Migrasi games-data.js -> data/games.json
Parser yang benar untuk format JS object
"""

import re
import json

with open('js/games-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all game objects using balanced brace matching
def extract_objects(text):
    objects = []
    start = 0
    while True:
        # Find next {
        start = text.find('{', start)
        if start == -1:
            break
        
        # Find matching }
        brace_count = 0
        end = start
        in_string = False
        escape = False
        
        for i, char in enumerate(text[start:], start):
            if char == '"' and not escape:
                in_string = not in_string
            elif char == '\\' and in_string and not escape:
                escape = True
                continue
            elif char == '{' and not in_string:
                brace_count += 1
            elif char == '}' and not in_string:
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
            escape = False
        
        if brace_count == 0:
            obj_str = text[start:end]
            # Check if it's a game object (has title or id with number)
            if 'title' in obj_str or re.search(r'id:\s*\d+', obj_str):
                objects.append(obj_str)
            start = end
        else:
            break
    
    return objects

# Extract all game objects
game_objects = extract_objects(content)
print(f'Extracted {len(game_objects)} game objects')

# Parse each game object
catalog = []
for obj_str in game_objects:
    try:
        # Convert JS object to JSON
        # 1. Add quotes to unquoted keys
        obj_str = re.sub(r'(\s+)(\w+):\s', r'\1"\2": ', obj_str)
        # 2. Remove trailing commas
        obj_str = re.sub(r',(\s*[}\]])', r'\1', obj_str)
        # 3. Fix already quoted keys (prevent double quoting)
        obj_str = re.sub(r'""(\w+)"":', r'"\1":', obj_str)
        # 4. Fix JS true/false/null
        obj_str = obj_str.replace('true', 'true').replace('false', 'false').replace('null', 'null')
        
        game = json.loads(obj_str)
        catalog.append(game)
    except json.JSONDecodeError as e:
        # Skip non-game objects
        continue

print(f'Parsed {len(catalog)} valid game objects')

# Category mapping
category_map = {
    'games': 'games',
    'apps': 'apps',
    'updates': 'updates',
    'dlc': 'dlc',
    'homebrew': 'homebrew'
}

converted = []
for game in catalog:
    old_cat = game.get('category', 'games')
    new_category = category_map.get(old_cat, old_cat)
    
    title_id = game.get('contentId') or game.get('title_id') or f'GAME{game.get("id", "")}'
    
    converted_game = {
        'id': str(game.get('id', '')),
        'title': game.get('title', ''),
        'title_id': title_id,
        'type': game.get('type', 'homebrew' if new_category == 'homebrew' else 'game'),
        'category': new_category,
        'version': game.get('version', '1.0'),
        'firmware': {
            'min': '9.00',
            'max': '13.00'
        },
        'size': game.get('size', 0),
        'pkg': {
            'url': game.get('url', ''),
            'sha256': game.get('sha256', 'SHA256_PENDING')
        },
        'media': {
            'icon': game.get('image', ''),
            'background': game.get('background', '')
        },
        'screenshots': game.get('screenshots', []),
        'description': game.get('description', ''),
        'author': game.get('author') or game.get('publisher', 'Unknown'),
        'website': game.get('website', ''),
        'source': game.get('source') or game.get('website', ''),
        'license': game.get('license', 'Unknown'),
        'changelog': game.get('changelog', ''),
        'version_history': game.get('version_history', []),
        'featured': game.get('featured', False),
        'downloads': game.get('downloads', 0),
        'createdAt': game.get('createdAt') or game.get('updatedAt') or ''
    }
    converted.append(converted_game)

# Create new games.json
new_games_json = {
    'version': 2,
    'updated': '2026-09-24T00:00:00Z',
    'games': converted
}

with open('data/games.json', 'w', encoding='utf-8') as f:
    json.dump(new_games_json, f, indent=2, ensure_ascii=False)

print(f'✅ Migrated {len(converted)} games to data/games.json')

# Stats
cats = {}
for g in converted:
    cats[g['category']] = cats.get(g['category'], 0) + 1

print('\nCategories:')
for cat, count in sorted(cats.items()):
    print(f'  {cat}: {count}')

total_size = sum(g['size'] for g in converted)
print(f'\nTotal size: {total_size / 1024 / 1024 / 1024:.2f} GB')

# List titles
print('\nGames:')
for g in converted:
    print(f'  - {g["title"]} ({g["category"]})')