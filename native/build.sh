#!/bin/bash
# B41M HEN STORE - Build Script for Native PS4 Application
# Run on Linux with OpenOrbis toolchain (WSL2, native Linux, or CI)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${PROJECT_DIR}/build"
PKG_DIR="${BUILD_DIR}/pkg"
TOOLCHAIN_FILE="${OPENORBIS_TOOLCHAIN:-/opt/openorbis/toolchain.cmake}"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  B41M HEN STORE - Native PS4 Build  ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to print step
step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for toolchain
if [ ! -f "$TOOLCHAIN_FILE" ]; then
    error "Toolchain file not found at $TOOLCHAIN_FILE"
    echo ""
    echo "Install OpenOrbis toolchain:"
    echo "  git clone --recursive https://github.com/OpenOrbis/OpenOrbis.git"
    echo "  cd OpenOrbis && ./build-toolchain.sh"
    echo ""
    echo "Then set environment variable:"
    echo "  export OPENORBIS_TOOLCHAIN=/opt/openorbis/toolchain.cmake"
    echo "  echo 'export OPENORBIS_TOOLCHAIN=/opt/openorbis/toolchain.cmake' >> ~/.bashrc"
    exit 1
fi

step "Toolchain found: $TOOLCHAIN_FILE"

# Clean build
if [ "$1" == "clean" ]; then
    step "Cleaning build directory..."
    rm -rf "$BUILD_DIR" "$PKG_DIR"
    exit 0
fi

# Check for orbis-pub-gen
if ! command -v orbis-pub-gen &> /dev/null; then
    warn "orbis-pub-gen not found in PATH"
    warn "PKG creation will be skipped (only eboot.bin will be built)"
    warn "Install from: https://github.com/OpenOrbis/orbis-pub-gen"
    ORBIS_PUB_GEN=""
else
    ORBIS_PUB_GEN="orbis-pub-gen"
    step "orbis-pub-gen found: $(which orbis-pub-gen)"
fi

# Create build directory
step "Creating build directory..."
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure with CMake
step "Configuring with CMake..."
cmake -DCMAKE_TOOLCHAIN_FILE="$TOOLCHAIN_FILE" \
      -DCMAKE_BUILD_TYPE=Release \
      "$PROJECT_DIR"

if [ $? -ne 0 ]; then
    error "CMake configuration failed!"
    exit 1
fi

# Build
step "Building application..."
make -j$(nproc)

if [ $? -ne 0 ]; then
    error "Build failed!"
    exit 1
fi

step "Build successful!"

# Check if eboot.bin was created
EBOOT_PATH="${BUILD_DIR}/eboot.bin"
if [ ! -f "$EBOOT_PATH" ]; then
    error "eboot.bin not found at expected location: $EBOOT_PATH"
    echo "Checking build directory contents:"
    find "$BUILD_DIR" -type f -name "*.bin" -o -name "*.elf" -o -name "*.self" 2>/dev/null
    exit 1
fi

step "Found eboot.bin ($(stat -c%s "$EBOOT_PATH") bytes)"

# Create PKG if orbis-pub-gen is available
if [ -n "$ORBIS_PUB_GEN" ]; then
    step "Creating PKG with orbis-pub-gen..."
    
    # Create PKG directory structure
    rm -rf "$PKG_DIR"
    mkdir -p "$PKG_DIR/sce_sys"
    
    # Copy eboot.bin
    cp "$EBOOT_PATH" "$PKG_DIR/eboot.bin"
    
    # Copy param.sfo
    if [ -f "${PROJECT_DIR}/assets/param.sfo" ]; then
        cp "${PROJECT_DIR}/assets/param.sfo" "$PKG_DIR/sce_sys/param.sfo"
        step "Copied param.sfo"
    else
        error "param.sfo not found in assets/"
        exit 1
    fi
    
    # Copy icon0.png
    if [ -f "${PROJECT_DIR}/assets/icon0.png" ]; then
        cp "${PROJECT_DIR}/assets/icon0.png" "$PKG_DIR/sce_sys/icon0.png"
        step "Copied icon0.png"
    elif [ -f "${PROJECT_DIR}/assets/icon.png" ]; then
        cp "${PROJECT_DIR}/assets/icon.png" "$PKG_DIR/sce_sys/icon0.png"
        step "Copied icon.png as icon0.png"
    else
        warn "icon0.png not found, PKG may not display icon"
    fi
    
    # Copy pic0.png (background)
    if [ -f "${PROJECT_DIR}/assets/pic0.png" ]; then
        cp "${PROJECT_DIR}/assets/pic0.png" "$PKG_DIR/sce_sys/pic0.png"
        step "Copied pic0.png"
    elif [ -f "${PROJECT_DIR}/assets/background.png" ]; then
        cp "${PROJECT_DIR}/assets/background.png" "$PKG_DIR/sce_sys/pic0.png"
        step "Copied background.png as pic0.png"
    else
        warn "pic0.png not found, PKG may not display background"
    fi
    
    # Create PKG using GP4 project file
    GP4_FILE="${PROJECT_DIR}/B41M_HEN_STORE.gp4"
    if [ -f "$GP4_FILE" ]; then
        step "Using GP4 project: $GP4_FILE"
        cd "$PKG_DIR"
        "$ORBIS_PUB_GEN" --gp4 "$GP4_FILE" --pkg "${BUILD_DIR}/B41M_HEN_STORE.pkg"
    else
        step "Using direct PKG creation"
        cd "$PKG_DIR"
        "$ORBIS_PUB_GEN" --pkg "${BUILD_DIR}/B41M_HEN_STORE.pkg" .
    fi
    
    if [ $? -eq 0 ] && [ -f "${BUILD_DIR}/B41M_HEN_STORE.pkg" ]; then
        PKG_SIZE=$(stat -c%s "${BUILD_DIR}/B41M_HEN_STORE.pkg")
        step "PKG created successfully!"
        echo -e "${GREEN}  Size: $(numfmt --to=iec $PKG_SIZE)${NC}"
        echo -e "${GREEN}  Path: ${BUILD_DIR}/B41M_HEN_STORE.pkg${NC}"
    else
        error "PKG creation failed!"
        exit 1
    fi
else
    warn "Skipping PKG creation (orbis-pub-gen not available)"
    warn "Install orbis-pub-gen to create installable PKG"
fi

# Create fake PKG for testing (using orbis-pub-cmd if available)
if command -v orbis-pub-cmd &> /dev/null; then
    step "Creating fake PKG with orbis-pub-cmd..."
    orbis-pub-cmd pkg_create "${BUILD_DIR}/B41M_HEN_STORE_Fake.pkg" "$PKG_DIR" 2>/dev/null || true
    if [ -f "${BUILD_DIR}/B41M_HEN_STORE_Fake.pkg" ]; then
        step "Fake PKG also created: ${BUILD_DIR}/B41M_HEN_STORE_Fake.pkg"
    fi
fi

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}  BUILD COMPLETE!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "Output files:"
echo -e "  ${GREEN}eboot.bin${NC}     : ${BUILD_DIR}/eboot.bin"
if [ -f "${BUILD_DIR}/B41M_HEN_STORE.pkg" ]; then
    echo -e "  ${GREEN}PKG (official)${NC}: ${BUILD_DIR}/B41M_HEN_STORE.pkg"
fi
if [ -f "${BUILD_DIR}/B41M_HEN_STORE_Fake.pkg" ]; then
    echo -e "  ${GREEN}PKG (fake)${NC}    : ${BUILD_DIR}/B41M_HEN_STORE_Fake.pkg"
fi
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Copy PKG to USB drive or host on web server"
echo -e "  2. On PS4 with GoldHEN: Install via Package Installer"
echo -e "  3. Launch 'B41M HEN STORE' from dashboard"
echo -e "  4. Ensure GoldHEN is running for download/install features"
echo ""