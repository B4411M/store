#!/bin/bash
# B41M HEN STORE - Convert SVG assets to PNG
# Run this before building PKG

set -e

ASSETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/assets"
cd "$ASSETS_DIR"

echo "Converting SVG to PNG..."

# Check for ImageMagick or Inkscape
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
elif command -v convert &> /dev/null; then
    CONVERT_CMD="convert"
elif command -v inkscape &> /dev/null; then
    CONVERT_CMD="inkscape"
else
    echo "Error: Need ImageMagick (magick/convert) or Inkscape"
    echo "Install: sudo apt install imagemagick inkscape"
    exit 1
fi

# Convert icon.svg -> icon.png (512x512)
if [ -f "icon.svg" ]; then
    if [[ "$CONVERT_CMD" == "inkscape" ]]; then
        inkscape icon.svg --export-type=png --export-filename=icon.png -w 512 -h 512
    else
        $CONVERT_CMD -background none -density 300 icon.svg -resize 512x512 icon.png
    fi
    echo "✓ icon.png created (512x512)"
fi

# Convert background.svg -> background.png (1920x1080)
if [ -f "background.svg" ]; then
    if [[ "$CONVERT_CMD" == "inkscape" ]]; then
        inkscape background.svg --export-type=png --export-filename=background.png -w 1920 -h 1080
    else
        $CONVERT_CMD -background none -density 150 background.svg -resize 1920x1080 background.png
    fi
    echo "✓ background.png created (1920x1080)"
fi

# Convert icon.svg -> icon0.png (512x512 for PKG)
if [ -f "icon.svg" ]; then
    if [[ "$CONVERT_CMD" == "inkscape" ]]; then
        inkscape icon.svg --export-type=png --export-filename=icon0.png -w 512 -h 512
    else
        $CONVERT_CMD -background none -density 300 icon.svg -resize 512x512 icon0.png
    fi
    echo "✓ icon0.png created (512x512)"
fi

# Convert background.svg -> pic0.png (1920x1080 for PKG)
if [ -f "background.svg" ]; then
    if [[ "$CONVERT_CMD" == "inkscape" ]]; then
        inkscape background.svg --export-type=png --export-filename=pic0.png -w 1920 -h 1080
    else
        $CONVERT_CMD -background none -density 150 background.svg -resize 1920x1080 pic0.png
    fi
    echo "✓ pic0.png created (1920x1080)"
fi

echo ""
echo "All assets ready for PKG build!"
ls -la *.png