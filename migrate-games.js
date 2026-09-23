/**
 * Migrasi games-data.js -> data/games.json
 * Run: node migrate-games.js
 */

const fs = require('fs');

// Read games-data.js
const gamesDataContent = fs.readFileSync('js/games-data.js', 'utf8');

// Extract PS4_GAME_CATALOG array
const match = gamesDataContent.match(/const PS4_GAME_CATALOG = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find PS4_GAME_CATALOG');
    process.exit(1);
}

const catalog = eval(match[1]); // Safe since we control the file
console.log(`Found ${catalog.length} games in games-data.js`);

// Convert to new format
const converted = catalog.map(game => {
    // Map old category to new category
    const categoryMap = {
        'games': 'games',
        'apps': 'apps',
        'updates': 'updates',
        'dlc': 'dlc',
        'homebrew': 'homebrew'
    };
    
    const newCategory = categoryMap[game.category] || game.category;
    
    return {
        id: String(game.id), // Convert to string
        title: game.title,
        title_id: game.contentId || game.title_id || `GAME${game.id}`,
        type: game.type || (newCategory === 'homebrew' ? 'homebrew' : 'game'),
        category: newCategory,
        version: game.version || '1.0',
        firmware: {
            min: "9.00",
            max: "13.00"
        },
        size: game.size || 0,
        pkg: {
            url: game.url || '',
            sha256: game.sha256 || 'SHA256_PENDING'
        },
        media: {
            icon: game.image || '',
            background: game.background || ''
        },
        screenshots: game.screenshots || [],
        description: game.description || '',
        author: game.author || game.publisher || 'Unknown',
        website: game.website || '',
        source: game.source || game.website || '',
        license: game.license || 'Unknown',
        changelog: game.changelog || '',
        version_history: game.version_history || [],
        featured: game.featured || false,
        downloads: game.downloads || 0,
        createdAt: game.createdAt || new Date().toISOString()
    };
});

// Create new games.json
const newGamesJson = {
    version: 2,
    updated: new Date().toISOString(),
    games: converted
};

fs.writeFileSync('data/games.json', JSON.stringify(newGamesJson, null, 2));
console.log(`✅ Migrated ${converted.length} games to data/games.json`);

// Stats
const cats = {};
converted.forEach(g => cats[g.category] = (cats[g.category] || 0) + 1);
console.log('\nCategories:');
Object.entries(cats).forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

const totalSize = converted.reduce((sum, g) => sum + g.size, 0);
console.log(`\nTotal size: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);