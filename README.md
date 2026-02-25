# 🎮 PS4 HEN Store - Web Application

**Download dan install game/aplikasi PKG langsung di PS4 dengan satu klik!**

![PS4 HEN Store](https://img.shields.io/badge/PS4-HEN%20Store-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-Educational-yellow?style=for-the-badge)

---

## ✨ Features

### 🎮 Game Catalog
- **40+ Games**: GTA V, God of War, Spider-Man, FIFA, PES, dan lainnya
- **8 Homebrew Apps**: GoldHEN Cheats, PKG Installer, Game Dumper, dll
- **5 Updates**: Patch terbaru untuk game populer
- **6 DLC**: Expansi dan bonus content

### ⬇️ Download & Install
- **Direct Download**: Download PKG langsung dari internet
- **Progress Tracking**: Real-time progress, speed, dan ETA
- **Auto-Install**: Install otomatis setelah download selesai
- **Queue Management**: Multiple downloads queue

### ⚙️ Admin Dashboard
- **Tambah Game**: Tambah game tanpa edit file
- **Edit Game**: Update info game yang ada
- **Hapus Game**: Hapus game dari katalog
- **Import/Export**: Backup dan restore catalog
- **Data tersimpan di localStorage**

### ❤️ Favorites
- **Wishlist**: Simpan game favorit
- **Quick Download**: Download langsung dari favorit
- **Persistent**: Disimpan di localStorage

### 🎨 Modern UI
- **PS4 Theme**: Dark theme seperti interface PS4
- **Responsive**: Support TV, desktop, dan mobile
- **Animations**: Smooth transitions dan hover effects
- **Toast Notifications**: Feedback yang jelas

---

## 🚀 Quick Start

### 1. Buka Admin Dashboard

```
https://your-domain.com/admin.html
```

### 2. Tambah Game

1. Klik tombol **"➕ Tambah Game"**
2. Isi form dengan:
   - Judul Game
   - Kategori (Games/Apps/Updates/DLC)
   - URL PKG (HTTPS)
   - Ukuran (dalam bytes)
   - Informasi lain (opsional)
3. Klik **"💾 Simpan Game"**

### 3. Buka Store

```
https://your-domain.com/index.html
```

---

## 📋 Admin Dashboard

### Fitur

| Fitur | Deskripsi |
|-------|-----------|
| ➕ Tambah Game | Tambah game baru ke katalog |
| ✏️ Edit Game | Update informasi game |
| 🗑️ Hapus Game | Hapus game dari katalog |
| 💾 Export | Download catalog sebagai JSON |
| 📥 Import | Upload catalog dari JSON |
| 💾 Backup | Download backup data |
| 🗑️ Hapus Semua | Hapus semua data |

### Form Tambah/Edit Game

```
Judul Game *      : [Nama game]
Kategori *        : [Games/Apps/Updates/DLC]
Publisher         : [Nama publisher]
Version          : [1.0]
Rating           : [E/T/M]
Ukuran (bytes) *  : [51539607552]
URL PKG *         : [https://...]
URL Gambar       : [https://...]
Deskripsi        : [Deskripsi game]
Downloads        : [0]
```

> * = Wajib diisi

### Format Ukuran

```
1 GB  = 1073741824 bytes
10 GB = 10737418240 bytes
40 GB = 42949672960 bytes
50 GB = 53687091200 bytes
100 GB = 107374182400 bytes
```

---

## 📦 Import/Export Catalog

### Export Catalog
1. Klik tombol **"💾 Export"**
2. File JSON akan terdownload otomatis
3. Simpan file untuk backup

### Import Catalog
1. Klik tombol **"📥 Import"**
2. Pilih file JSON backup
3. Konfirmasi import
4. Data akan diimport

### Backup Otomatis
- Data tersimpan di localStorage browser
- Auto-save setiap 5 detik
- Download manual backup secara berkala

---

## 💻 Installation

### Method 1: GitHub Pages (Recommended)

```bash
# 1. Fork repository ini
# 2. Enable GitHub Pages
# Settings → Pages → Source: main branch

# 3. Akses di PS4
https://username.github.io/repo/
```

### Method 2: Netlify Drop

1. Drag & drop folder project ke [Netlify Drop](https://app.netlify.com/drop)
2. Rename site (optional)
3. Akses di PS4 menggunakan HTTPS URL

---

## 🎯 Usage di PS4

### 1. Load Payload di PS4

Pastikan PS4 Anda sudah:
- Install HEN payload (GoldHEN 2.4b recommended)
- Aktifkan HEN sebelum membuka web app

### 2. Buka Web App

```
1. Buka browser PS4
2. Kunjungi URL hosting Anda
3. Interface akan muncul
```

### 3. Download & Install Game

#### Dari Katalog
```
1. Browse game yang ingin diinstall
2. Klik "Download & Install"
3. Tunggu download selesai
4. Install otomatis dimulai
5. Cek notification center PS4
```

#### Quick Download
```
1. Klik tombol Download di card game
2. Download dimulai otomatis
```

#### Dari URL
```
1. Klik icon ⬇️ di header
2. Masukkan URL PKG langsung
3. Klik Download
```

---

## 📁 Project Structure

```
PS4Game/
│
├── index.html              # Main Store UI
├── admin.html              # Admin Dashboard
│
├── css/
│   └── styles.css          # PS4-themed dark styling
│
├── js/
│   ├── app.js              # Main store controller
│   ├── admin-manager.js    # Admin dashboard logic
│   ├── games-data.js       # Embedded game catalog
│   ├── download-manager.js # Download queue & progress
│   ├── pkg-installer.js    # PKG installation
│   ├── usb-manager.js      # USB operations
│   └── network-manager.js  # FTP/SMB client
│
├── README.md               # Documentation
└── TODO.md                 # Development notes
```

---

## 🔧 Troubleshooting

### ❌ Download Gagal

**Masalah**: Download tidak dimulai atau gagal

**Solusi**:
1. Cek URL PKG - harus HTTPS
2. Cek koneksi internet
3. Refresh browser PS4
4. Coba restart PS4

### ❌ Install Gagal

**Masalah**: Install tidak berjalan setelah download

**Solusi**:
1. Pastikan HEN/GoldHEN sudah di-load
2. Refresh browser
3. Reload HEN payload
4. Coba install manual dari notifications

### ❌ Data Hilang

**Masalah**: Game di Admin Dashboard hilang

**Solusi**:
1. Data tersimpan di browser lokal
2. Jika cache dihapus, data akan hilang
3. **Selalu backup** dengan klik "💾 Backup" di Admin Dashboard
4. Import kembali dari file backup

### ❌ Web App Tidak Terbuka

**Masalah**: Browser PS4 tidak bisa akses web app

**Solusi**:
1. Pastikan hosting menggunakan HTTPS
2. Cek DNS settings PS4
3. Coba gunakan GitHub Pages atau Netlify
4. Clear browser cache

---

## 📊 Game Catalog Stats

| Category | Count | Examples |
|----------|-------|----------|
| Games | 20+ | GTA V, God of War, Spider-Man |
| Apps | 8 | GoldHEN, PKG Installer, Game Dumper |
| Updates | 5 | Patches for popular games |
| DLC | 6 | Expansions & bonus content |
| **Total** | **40+** | |

---

## ⚠️ Disclaimer

> **PENTING**: Project ini dibuat untuk tujuan edukasi dan homebrew use only.

### Yang Harus Anda Ketahui:

1. **Legalitas**: Hanya install konten yang Anda memiliki legalitasnya
2. **Resiko**: Penggunaan homebrew dapat membatalkan garansi
3. **Backup**: Selalu backup data penting sebelum menggunakan homebrew
4. **Firmware**: Hanya support firmware 9.00 - 11.00
5. **Data**: Data admin tersimpan di localStorage browser

### Developer Tidak Bertanggung Jawab Atas:
- Kerusakan konsol
- Banned PSN
- Kerugian finansial
- Kehilangan data

---

## 📝 Changelog

### v2.0 (2024)
- ✅ **Admin Dashboard** - Tambah/edit/hapus game tanpa edit file
- ✅ **localStorage** - Data tersimpan di browser
- ✅ **Import/Export** - Backup dan restore catalog
- ✅ **Auto-save** - Data tersimpan otomatis
- ✅ Enhanced UI dengan dark theme
- ✅ 40+ games and apps in catalog
- ✅ Download queue management
- ✅ Favorites system
- ✅ Progress tracking dengan speed/ETA
- ✅ Search dan filter functionality
- ✅ Auto-install setelah download

---

## 🔗 Useful Links

- [GoldHEN](https://github.com/GoldHEN/GoldHEN_Repository) - PS4 Homebrew Enabler
- [PS4 Guide](https://ps4guide.com/) - PS4 Jailbreak Guide
- [PS4 Homebrew](https://ps4.homebrew.community/) - Homebrew Community

---

## 📧 Contact

- **GitHub**: [Your GitHub Profile]
- **Discord**: [Your Discord Server]

---

**⭐ Rate this project jika bermanfaat!**

**⚠️ Warning**: Install hanya konten yang Anda memiliki legalitasnya. Backup data secara berkala!

