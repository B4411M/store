#!/bin/sh

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BUILD_DIR="$PROJECT_DIR/build"
PKG_DIR="$BUILD_DIR/pkg"
TOOLCHAIN=${OO_PS4_TOOLCHAIN:-${OPENORBIS_TOOLCHAIN:-/opt/openorbis}}

if [ -f "$TOOLCHAIN" ]; then
    TOOLCHAIN=$(dirname "$TOOLCHAIN")
fi

case "$(uname -s)" in
    Darwin)
        LLVM_PREFIX=${LLVM_PREFIX:-/usr/local/opt/llvm@18/bin}
        PLATFORM_BIN=macos
        FSELF=create-fself-macos
        ;;
    *)
        LLVM_PREFIX=${LLVM_PREFIX:-}
        PLATFORM_BIN=linux
        FSELF=create-fself
        ;;
esac

CC=${CC:-${LLVM_PREFIX:+$LLVM_PREFIX/}clang}
LD=${LD:-${LLVM_PREFIX:+$LLVM_PREFIX/}ld.lld}
CREATE_FSELF="$TOOLCHAIN/bin/$PLATFORM_BIN/$FSELF"
CREATE_GP4="$TOOLCHAIN/bin/$PLATFORM_BIN/create-gp4"
PKG_TOOL="$TOOLCHAIN/bin/$PLATFORM_BIN/PkgTool.Core"

# Try to find tools in alternative locations
for tool in CREATE_FSELF CREATE_GP4 PKG_TOOL; do
    eval "tool_path=\$$tool"
    if [ ! -x "$tool_path" ] && [ ! -f "$tool_path" ]; then
        # Try alternative locations
        for alt in \
            "$TOOLCHAIN/bin/$tool" \
            "$TOOLCHAIN/bin/linux/$tool" \
            "$TOOLCHAIN/bin/$PLATFORM_BIN/$tool" \
            "$TOOLCHAIN/$tool"; do
            if [ -x "$alt" ] || [ -f "$alt" ]; then
                eval "$tool=$alt"
                break
            fi
        done
    fi
done

echo "Using toolchain: $TOOLCHAIN"
echo "CC: $CC"
echo "LD: $LD"
echo "CREATE_FSELF: $CREATE_FSELF"
echo "CREATE_GP4: $CREATE_GP4"
echo "PKG_TOOL: $PKG_TOOL"

# Check required files
for required in "$CC" "$LD" "$CREATE_FSELF" "$CREATE_GP4" "$PKG_TOOL" "$TOOLCHAIN/link.x" "$TOOLCHAIN/lib/crt1.o"; do
    if [ ! -x "$required" ] && [ ! -f "$required" ]; then
        echo "Missing OpenOrbis build dependency: $required" >&2
        echo "Toolchain contents:"
        find "$TOOLCHAIN" -type f -name "*.o" -o -name "create-fself*" -o -name "create-gp4*" -o -name "PkgTool*" -o -name "clang*" -o -name "ld.lld*" -o -name "link.x" 2>/dev/null | head -30
        exit 1
    fi
done

if [ "${1:-}" = clean ]; then
    rm -rf "$BUILD_DIR"
    exit 0
fi

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/obj" "$PKG_DIR/sce_sys"

CFLAGS="--target=x86_64-pc-freebsd12-elf -DSTORE_PS4 -fPIC -funwind-tables -I$TOOLCHAIN/include -I$TOOLCHAIN/include/c++/v1 -I$PROJECT_DIR/include"

sources="
src/main.c
src/storage_manager.c
src/ui/input.c
src/ui/render.c
src/ui/webview.c
src/utils/config.c
src/utils/log.c
src/ps4_compat.c
"

objects=""
for source_file in $sources; do
    object_file="$BUILD_DIR/obj/$(basename "${source_file%.c}.o")"
    echo "Compiling $source_file..."
    "$CC" $CFLAGS -c "$PROJECT_DIR/$source_file" -o "$object_file"
    objects="$objects $object_file"
done

echo "Linking..."
"$LD" -m elf_x86_64 -pie --script "$TOOLCHAIN/link.x" --eh-frame-hdr \
    -L"$TOOLCHAIN/lib" -lc -lkernel -lc++ \
    -o "$BUILD_DIR/b41m_hen_store.elf" "$TOOLCHAIN/lib/crt1.o" $objects

echo "Creating eboot.bin..."
"$CREATE_FSELF" \
    -in="$BUILD_DIR/b41m_hen_store.elf" \
    -out="$BUILD_DIR/b41m_hen_store.oelf" \
    --eboot "$BUILD_DIR/eboot.bin" \
    --paid 0x3800000000000011

cp "$BUILD_DIR/eboot.bin" "$PKG_DIR/eboot.bin"

echo "Creating PKG..."
"$PKG_TOOL" sfo_new "$PKG_DIR/sce_sys/param.sfo"
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" APP_TYPE --type Integer --maxsize 4 --value 1
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" APP_VER --type Utf8 --maxsize 8 --value 01.00
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" ATTRIBUTE --type Integer --maxsize 4 --value 0
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" CATEGORY --type Utf8 --maxsize 4 --value gd
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" CONTENT_ID --type Utf8 --maxsize 48 --value UP0000-B41MHEN01_00-0000000000000000
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" DOWNLOAD_DATA_SIZE --type Integer --maxsize 4 --value 0
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" SYSTEM_VER --type Integer --maxsize 4 --value 0
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" TITLE --type Utf8 --maxsize 128 --value "B41M HEN STORE"
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" TITLE_ID --type Utf8 --maxsize 12 --value B41MHEN01
"$PKG_TOOL" sfo_setentry "$PKG_DIR/sce_sys/param.sfo" VERSION --type Utf8 --maxsize 8 --value 01.00
if [ -f "$PROJECT_DIR/assets/icon0.png" ]; then
    cp "$PROJECT_DIR/assets/icon0.png" "$PKG_DIR/sce_sys/icon0.png"
else
    cp "$PROJECT_DIR/assets/icon.png" "$PKG_DIR/sce_sys/icon0.png"
fi
if [ -f "$PROJECT_DIR/assets/pic0.png" ]; then
    cp "$PROJECT_DIR/assets/pic0.png" "$PKG_DIR/sce_sys/pic0.png"
elif [ -f "$PROJECT_DIR/assets/background.png" ]; then
    cp "$PROJECT_DIR/assets/background.png" "$PKG_DIR/sce_sys/pic0.png"
fi

cd "$PKG_DIR"
"$CREATE_GP4" -out B41M_HEN_STORE.gp4 \
    --content-id=UP0000-B41MHEN01_00-0000000000000000 \
    --files "eboot.bin sce_sys/param.sfo sce_sys/icon0.png sce_sys/pic0.png"
"$PKG_TOOL" pkg_build B41M_HEN_STORE.gp4 .

PKG_OUTPUT="$PKG_DIR/UP0000-B41MHEN01_00-0000000000000000.pkg"
if [ ! -f "$PKG_OUTPUT" ]; then
    echo "PKG creation did not produce $PKG_OUTPUT" >&2
    ls -la
    exit 1
fi

cp "$PKG_OUTPUT" "$BUILD_DIR/B41M_HEN_STORE.pkg"
echo "PKG created: $BUILD_DIR/B41M_HEN_STORE.pkg"