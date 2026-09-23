# B41M HEN STORE - Build Guide untuk PKG PS4

## Prasyarat (Harus di Linux/WSL2)

### 1. Install OpenOrbis Toolchain
```bash
# Clone dan build OpenOrbis
git clone --recursive https://github.com/OpenOrbis/OpenOrbis.git
cd OpenOrbis
./build-toolchain.sh

# Atau install via package manager (Arch/Manjaro)
yay -S openorbis-toolchain-git

# Set environment variable
export OPENORBIS_TOOLCHAIN=/opt/openorbis/toolchain.cmake
echo 'export OPENORBIS_TOOLCHAIN=/opt/openorbis/toolchain.cmake' >> ~/.bashrc
```

### 2. Install Dependencies
```bash
# Ubuntu/Debian/WSL2
sudo apt update
sudo apt install -y cmake make git curl libcurl4-openssl-dev \
    libmbedtls-dev libmbedx509-dev libmbedcrypto-dev \
    python3 pkg-config

# Untuk orbis-pub-gen (PKG creation)
# Download dari: https://github.com/OpenOrbis/orbis-pub-gen/releases
# Atau build dari source:
git clone https://github.com/OpenOrbis/orbis-pub-gen.git
cd orbis-pub-gen
mkdir build && cd build
cmake ..
make -j$(nproc)
sudo make install
```

### 3. Convert SVG ke PNG (untuk icon & background)
```bash
# Install inkscape atau imagemagick
sudo apt install -y inkscape

# Convert icons
cd /path/to/store/native/assets
inkscape icon.svg --export-type=png --export-filename=icon.png -w 512 -h 512
inkscape background.svg --export-type=png --export-filename=background.png -w 1920 -h 1080

# Atau pakai ImageMagick
convert -background none icon.svg icon.png
convert -background none background.svg background.png
```

## Build PKG

### Opsi 1: Build Script Otomatis
```bash
cd /path/to/store/native
chmod +x build.sh
./build.sh
```

### Opsi 2: Manual Step-by-Step
```bash
cd /path/to/store/native
mkdir build && cd build

# Configure
cmake -DCMAKE_TOOLCHAIN_FILE=$OPENORBIS_TOOLCHAIN \
      -DCMAKE_BUILD_TYPE=Release \
      ..

# Build
make -j$(nproc)

# Hasil: build/eboot.bin
```

### Opsi 3: Create PKG Manual (jika orbis-pub-gen tersedia)
```bash
# Siapkan struktur PKG
mkdir -p pkg/sce_sys
cp build/eboot.bin pkg/
cp assets/param.sfo pkg/sce_sys/
cp assets/icon.png pkg/sce_sys/icon0.png
cp assets/background.png pkg/sce_sys/pic0.png  # optional

# Create PKG
orbis-pub-gen --pkg B41M_HEN_STORE.pkg pkg/

# Hasil: B41M_HEN_STORE.pkg
```

## Install ke PS4

### Via GoldHEN (Direkt dari Browser PS4)
1. Host file `.pkg` di web server (GitHub Pages, Netlify, dll)
2. Buka browser PS4 → arahkan ke URL PKG
3. Download akan muncul di notifikasi PS4
4. Klik notifikasi → Install

### Via USB
1. Copy PKG ke USB drive (FAT32/exFAT)
2. Colok USB ke PS4
3. Settings → Debug Settings → Game → Package Installer
4. Pilih PKG dari USB

### Via GoldHEN FTP
```bash
# Upload via FTP ke PS4
ftp <PS4_IP>
put B41M_HEN_STORE.pkg /data/B41M_HEN_STORE.pkg
# Lalu install via GoldHEN Package Installer
```

## Troubleshooting

### Error: "Toolchain not found"
```bash
# Cek lokasi toolchain
find / -name "toolchain.cmake" 2>/dev/null | grep openorbis
export OPENORBIS_TOOLCHAIN=/path/to/toolchain.cmake
```

### Error: "orbis-pub-gen not found"
```bash
# Install orbis-pub-gen
git clone https://github.com/OpenOrbis/orbis-pub-gen.git
cd orbis-pub-gen && mkdir build && cd build
cmake .. && make -j$(nproc)
sudo cp orbis-pub-gen /usr/local/bin/
```

### Error: "libcurl/mbedtls not found"
```bash
# Pastikan library terinstall di toolchain sysroot
ls /opt/openorbis/sysroot/usr/lib/ | grep -E "curl|mbed"
```

### PKG tidak bisa diinstall
- Cek `param.sfo` Content ID: `B41MHEN01_00-0000000000000000`
- Pastikan PKG unsigned (fake PKG) untuk HEN
- Gunakan GoldHEN 2.4b+ di FW 9.00-11.00

## Struktur Output
```
native/
├── build/
│   ├── eboot.bin          # Executable PS4
│   ├── B41M_HEN_STORE.pkg # Final PKG (jika orbis-pub-gen ada)
│   └── pkg/               # Temp PKG structure
│       ├── eboot.bin
│       └── sce_sys/
│           ├── param.sfo
│           ├── icon0.png
│           └── pic0.png
├── assets/
│   ├── param.sfo
│   ├── icon.png (512x512)
│   ├── background.png (1920x1080)
│   ├── icon.svg
│   └── background.svg
└── src/...                # Source code
```

## Testing di PS4
1. Install PKG
2. Jalankan aplikasi dari dashboard PS4
3. Aplikasi akan load `https://b4411m.github.io/store/`
4. Pastikan GoldHEN aktif untuk download/install
5. Test download game → cek notifikasi PS4

## Catatan Penting
- **Fake PKG only** - untuk HEN/CFW only, bukan official PSN
- **WebView** - menggunakan SceWebKit, perlu FW 9.00+
- **GoldHEN** - wajib aktif untuk download/install PKG
- **Network** - PS4 harus terkoneksi internet