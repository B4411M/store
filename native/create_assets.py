#!/usr/bin/env python3
"""
Create proper PS4 assets from SVG
Generates: icon0.png (512x512), pic0.png (1920x1080), icon.png (512x512), background.png (1920x1080)
"""

import subprocess
import os
import sys

ASSETS_DIR = os.path.dirname(os.path.abspath(__file__))

def run_cmd(cmd, check=True):
    """Run command and return result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=ASSETS_DIR)
        if check and result.returncode != 0:
            print(f"Error running: {cmd}")
            print(result.stderr)
            return False
        return True
    except Exception as e:
        print(f"Exception running {cmd}: {e}")
        return False

def check_inkscape():
    """Check if inkscape is available"""
    return run_cmd("which inkscape", check=False)

def create_png_from_svg(svg_file, png_file, width, height):
    """Convert SVG to PNG with specific dimensions using inkscape"""
    cmd = f'inkscape "{svg_file}" --export-type=png --export-filename="{png_file}" -w {width} -h {height}'
    print(f"Creating {png_file} ({width}x{height})...")
    return run_cmd(cmd)

def create_proper_param_sfo():
    """Create a proper param.sfo using Python"""
    import struct
    
    # SFO structure
    # Header: magic(4) + version(4) + key_ofs(4) + val_ofs(4) + entry_count(4) = 20 bytes
    # Entries: 20 bytes each
    # Key table: null-terminated strings
    # Value table: data
    
    entries = [
        ('TITLE_ID', 'utf8', 'B41MHEN01'),
        ('TITLE', 'utf8', 'B41M HEN STORE'),
        ('VERSION', 'utf8', '01.00'),
        ('APP_VER', 'utf8', '01.00'),
        ('CATEGORY', 'utf8', 'gd'),
        ('CONTENT_ID', 'utf8', 'B41MHEN01_00-0000000000000000'),
        ('DESCRIPTION', 'utf8', 'PS4 Homebrew Store for downloading and installing homebrew applications'),
        ('DETAIL', 'utf8', 'B41M HEN STORE - Download homebrew games, apps, and tools directly on your PS4'),
        ('ATTRIBUTE', 'int', 0),
        ('PARENTAL_LEVEL', 'int', 1),
        ('RESOLUTION', 'utf8', '1920x1080'),
        ('SOUND_FORMAT', 'int', 2),
        ('VIDEO_RECORDING', 'int', 0),
        ('SCREENSHOT', 'int', 1),
        ('VIDEO_STREAMING', 'int', 0),
        ('LOCAL_MULTIPLAYER', 'int', 0),
        ('VR_MODE', 'int', 0),
        ('NP_COMM_ID', 'utf8', 'B41MHENSTORE'),
        ('NP_COMM_SIGNATURE', 'utf8', 'b41mhenstore'),
    ]
    
    # Build key table
    key_table = b''
    key_offsets = []
    for key, _, _ in entries:
        key_offsets.append(len(key_table))
        key_table += key.encode('utf-8') + b'\x00'
    
    # Build value table and entries
    val_table = b''
    val_offsets = []
    entry_data = b''
    
    for i, (key, fmt, value) in enumerate(entries):
        val_offsets.append(len(val_table))
        
        if fmt == 'utf8':
            val_data = value.encode('utf-8') + b'\x00'
            param_fmt = 0x0400
            param_len = len(val_data)
            param_max = len(val_data)
        elif fmt == 'int':
            val_data = struct.pack('<I', value)
            param_fmt = 0x0200
            param_len = 4
            param_max = 4
        
        val_table += val_data
        
        # Entry: fmt(2) + unused(2) + len(4) + max_len(4) + key_ofs(4) + val_ofs(4) = 20 bytes
        entry_data += struct.pack('<HHI', param_fmt, 0, param_len)
        entry_data += struct.pack('<I', param_max)
        entry_data += struct.pack('<I', key_offsets[i])
        entry_data += struct.pack('<I', val_offsets[i])
    
    # Calculate offsets
    header_size = 20
    entries_size = len(entry_data)
    key_ofs = header_size + entries_size
    val_ofs = key_ofs + len(key_table)
    
    # Build header
    header = struct.pack('<4sIIII', b'\x00PSF', 1, key_ofs, val_ofs, len(entries))
    
    # Write file
    with open(os.path.join(ASSETS_DIR, 'param.sfo'), 'wb') as f:
        f.write(header)
        f.write(entry_data)
        f.write(key_table)
        f.write(val_table)
    
    print(f"Created param.sfo ({header_size + entries_size + len(key_table) + len(val_table)} bytes)")
    return True

def main():
    print("=" * 60)
    print("Creating proper PS4 assets for B41M HEN STORE")
    print("=" * 60)
    
    # Check inkscape
    if not check_inkscape():
        print("ERROR: inkscape not found. Install with: brew install inkscape (macOS) or apt install inkscape (Linux)")
        sys.exit(1)
    
    print("✓ Inkscape found")
    
    # Create proper param.sfo first
    print("\n1. Creating proper param.sfo...")
    create_proper_param_sfo()
    
    # Convert SVGs to proper PNG sizes
    print("\n2. Converting SVGs to proper PNG sizes...")
    
    # icon0.png - 512x512 (for PKG icon)
    create_png_from_svg('icon.svg', 'icon0.png', 512, 512)
    
    # icon.png - 512x512 (for app)
    create_png_from_svg('icon.svg', 'icon.png', 512, 512)
    
    # pic0.png - 1920x1080 (for PKG background)
    create_png_from_svg('background.svg', 'pic0.png', 1920, 1080)
    
    # background.png - 1920x1080 (for app)
    create_png_from_svg('background.svg', 'background.png', 1920, 1080)
    
    # Verify files
    print("\n3. Verifying created files...")
    for fname in ['icon0.png', 'icon.png', 'pic0.png', 'background.png', 'param.sfo']:
        fpath = os.path.join(ASSETS_DIR, fname)
        if os.path.exists(fpath):
            size = os.path.getsize(fpath)
            print(f"   ✓ {fname}: {size} bytes")
        else:
            print(f"   ✗ {fname}: MISSING!")
    
    # Verify PNG dimensions using file command
    print("\n4. Verifying PNG dimensions...")
    for fname in ['icon0.png', 'icon.png', 'pic0.png', 'background.png']:
        fpath = os.path.join(ASSETS_DIR, fname)
        if os.path.exists(fpath):
            result = subprocess.run(['file', fpath], capture_output=True, text=True)
            print(f"   {fname}: {result.stdout.strip()}")
    
    print("\n" + "=" * 60)
    print("✅ All assets created successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. cd native && ./build.sh")
    print("2. Install generated PKG on PS4")

if __name__ == '__main__':
    main()