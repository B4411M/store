# B41M HEN STORE - Native PS4 Application

## Overview
This directory contains the structure for building a native PS4 PKG application that loads the B41M HEN Store web interface.

## Requirements
- PS4 SDK (official) or OpenOrbis toolchain
- CMake for build system
- liborbis for PS4 homebrew development

## Structure
```
native/
├── CMakeLists.txt
├── src/
│   ├── main.c              # Entry point
│   ├── http_client.c       # HTTP/HTTPS client
│   ├── json_parser.c       # JSON parsing (cJSON)
│   ├── download_manager.c  # Download with progress
│   ├── sha256.c            # SHA256 implementation
│   ├── storage_manager.c   # Storage checking
│   ├── pkg_installer.c     # PKG installation bridge
│   ├── ui/
│   │   ├── webview.c       # Webview for store UI
│   │   ├── input.c         # Controller input
│   │   └── render.c        # Rendering
│   └── utils/
│       ├── log.c           # Logging
│       └── config.c        # Configuration
├── include/
│   ├── http_client.h
│   ├── json_parser.h
│   ├── download_manager.h
│   ├── sha256.h
│   ├── storage_manager.h
│   ├── pkg_installer.h
│   └── ui/
│       ├── webview.h
│       ├── input.h
│       └── render.h
├── assets/
│   ├── icon.png            # App icon
│   ├── background.png      # Background
│   └── param.sfo           # App metadata
└── build.sh                # Build script
```

## Build Instructions

### Using OpenOrbis (Recommended for Homebrew)
```bash
# Clone OpenOrbis
git clone https://github.com/OpenOrbis/OpenOrbis.git
cd OpenOrbis

# Build toolchain
./build-toolchain.sh

# Build the store
cd native
mkdir build && cd build
cmake -DCMAKE_TOOLCHAIN_FILE=/path/to/openorbis/toolchain.cmake ..
make
```

### Using Official PS4 SDK
```bash
# Requires official PS4 SDK (licensed developers only)
# Set up environment variables
export PS4_SDK_PATH=/path/to/ps4/sdk
export CMAKE_TOOLCHAIN_FILE=$PS4_SDK_PATH/cmake/PS4.cmake

mkdir build && cd build
cmake ..
make
```

## Integration Points

### 1. HTTP Client
- Uses libcurl or PS4 net API for HTTPS requests
- Supports custom User-Agent for PS4
- Handles redirects, timeouts, retries

### 2. JSON Parser
- Uses cJSON for lightweight parsing
- Parses games.json, categories.json, featured.json, version.json

### 3. Download Manager
- Streams download to file (not RAM)
- Progress callback for UI
- Pause/Resume/Cancel support
- SHA256 verification

### 4. SHA256
- Uses PS4 crypto library or mbedTLS
- Verifies downloaded PKG against catalog hash

### 5. Storage Manager
- Uses sceKernelGetStorageInfo or similar
- Checks free space before download

### 6. PKG Installer
- Communicates with GoldHEN payload (port 12800)
- Supports HTTP POST and WebSocket methods
- Falls back to localStorage IPC

### 7. WebView
- Uses SceWebKit or custom WebView
- Loads index.html from local files or remote
- Handles controller navigation

## Configuration
- `config.json` - App settings
- `param.sfo` - PS4 app metadata (title, version, etc.)

## Signing
- For homebrew: Use fake PKG tools (orbis-pub-gen, etc.)
- For official: Use Sony signing tools

## Testing
- Test on PS4 with GoldHEN 2.4b+
- Firmware: 9.00 - 11.00+
- Test all categories, download, install flow

## Notes
- This is a skeleton structure only
- Actual implementation requires PS4 development environment
- Web-based store (index.html) can be bundled as assets
- Consider using a WebView for rendering the UI