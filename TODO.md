# B41M HEN STORE — TODO

> PS4 Homebrew Store
> Website: https://b4411m.github.io/store/

## 🎯 Tujuan

Mengembangkan B41M HEN STORE menjadi aplikasi PS4 Homebrew Store yang dapat:

* Menampilkan katalog game/homebrew dari database online.
* Memuat katalog secara otomatis dari JSON.
* Refresh katalog tanpa update aplikasi Store.
* Mencari game berdasarkan nama, Title ID, kategori, firmware, dan versi.
* Menampilkan informasi lengkap game.
* Download PKG langsung dari PS4.
* Menampilkan progress download.
* Memvalidasi file sebelum instalasi.
* Mengintegrasikan proses instalasi dengan environment PS4 yang mendukung homebrew.
* Mendukung update katalog secara otomatis.
* Mendukung gambar/icon/background dari server.
* Memisahkan Game, Homebrew, Apps, DLC, Update, Tools, dan Emulator.
* Menyediakan sistem fallback apabila server utama tidak tersedia.

---

# 1. 🏗️ Arsitektur

## Struktur yang direncanakan

```text
B41M HEN STORE
│
├── Store App / Web UI
│
├── Online API / JSON
│   ├── games.json
│   ├── categories.json
│   ├── featured.json
│   └── version.json
│
├── CDN / File Server
│   ├── PKG
│   ├── ICON
│   ├── BACKGROUND
│   └── SCREENSHOTS
│
└── PS4
    ├── Download Manager
    ├── PKG Validator
    └── Installer
```

---

# 2. 📁 Struktur Database

Buat repository/database terpisah:

```text
database/
├── games.json
├── categories.json
├── featured.json
├── updates.json
└── version.json
```

Contoh `games.json`:

```json
{
  "version": 1,
  "updated": "2026-09-24T00:00:00Z",
  "games": [
    {
      "id": "homebrew-example",
      "title": "Example Homebrew",
      "title_id": "HB000001",
      "type": "homebrew",
      "category": "Homebrew",
      "version": "1.0.0",
      "firmware": {
        "min": "9.00",
        "max": "13.00"
      },
      "size": 524288000,
      "pkg": {
        "url": "https://example.com/example.pkg",
        "sha256": "SHA256_HASH"
      },
      "media": {
        "icon": "https://example.com/icon.png",
        "background": "https://example.com/background.jpg"
      },
      "description": "Example homebrew application.",
      "author": "Author",
      "website": "https://example.com",
      "license": "Open Source",
      "featured": false
    }
  ]
}
```

---

# 3. 🔄 Automatic Catalog Update

* [ ] Store membaca `version.json` ketika aplikasi dibuka.
* [ ] Bandingkan versi database lokal dengan versi online.
* [ ] Jika berbeda → download database terbaru.
* [ ] Cache database secara lokal.
* [ ] Jangan download database ulang jika versi tidak berubah.
* [ ] Tambahkan tombol `Refresh`.
* [ ] Tambahkan automatic refresh saat Store dibuka.
* [ ] Tambahkan timestamp `Last Updated`.
* [ ] Jika internet/server gagal → gunakan database cache terakhir.

Contoh:

```text
Store Start
    ↓
GET version.json
    ↓
Versi sama?
 ┌──┴──┐
 YA    TIDAK
 ↓       ↓
Cache   Download games.json
 ↓       ↓
Load ← Update Cache
```

---

# 4. 🔎 Search

* [ ] Search berdasarkan nama game.
* [ ] Search berdasarkan Title ID.
* [ ] Search berdasarkan author.
* [ ] Search berdasarkan kategori.
* [ ] Search harus case-insensitive.
* [ ] Tambahkan debounce.
* [ ] Tampilkan hasil secara realtime.
* [ ] Tampilkan `No Results` jika tidak ditemukan.

---

# 5. 🎮 Category

Kategori minimal:

```text
All
Games
Homebrew
Apps
Tools
Emulators
Updates
DLC
Themes
```

TODO:

* [ ] Filter kategori.
* [ ] Filter firmware.
* [ ] Filter ukuran.
* [ ] Sort nama A-Z.
* [ ] Sort terbaru.
* [ ] Sort ukuran.
* [ ] Sort popular/download count.

---

# 6. ⭐ Featured

* [ ] Buat `featured.json`.
* [ ] Hero/banner game.
* [ ] Featured carousel.
* [ ] Badge `FEATURED`.
* [ ] Badge `NEW`.
* [ ] Badge `UPDATE`.
* [ ] Tombol langsung ke detail.

---

# 7. 📦 Detail Game

Detail harus menampilkan:

```text
Game Title
Icon
Background
Description

Title ID
Version
Size
Category
Author
Firmware
Release Date

[ DOWNLOAD & INSTALL ]
[ FAVORITE ]
```

TODO:

* [ ] Screenshot gallery.
* [ ] Changelog.
* [ ] Version history.
* [ ] Required firmware.
* [ ] File size.
* [ ] SHA256.
* [ ] Source/license.
* [ ] Author website.

---

# 8. ⬇️ Download Manager

Download manager adalah bagian utama Store.

TODO:

* [ ] Download PKG melalui HTTPS.
* [ ] Tampilkan progress percentage.
* [ ] Tampilkan MB downloaded.
* [ ] Tampilkan total MB.
* [ ] Tampilkan speed.
* [ ] Tampilkan ETA.
* [ ] Pause.
* [ ] Resume.
* [ ] Cancel.
* [ ] Retry jika gagal.
* [ ] Handle network disconnect.
* [ ] Handle server timeout.
* [ ] Handle HTTP errors.
* [ ] Support file besar.
* [ ] Jangan load seluruh PKG ke RAM.

UI:

```text
Downloading...

Example Homebrew.pkg

████████████████░░░░  82%

4.1 GB / 5.0 GB

Speed: 38 MB/s
ETA: 00:24

[ PAUSE ] [ CANCEL ]
```

---

# 9. 🔐 PKG Validation

Sebelum instalasi:

* [ ] Pastikan download selesai.
* [ ] Cek ukuran file.
* [ ] Hitung SHA256.
* [ ] Bandingkan SHA256 dengan database.
* [ ] Jika hash berbeda → jangan install.
* [ ] Hapus file corrupt.
* [ ] Tawarkan retry.

Contoh:

```text
Download completed.

SHA256:
Expected: ABCDEF...
Actual:   ABCDEF...

✓ File verified
```

Jika gagal:

```text
✕ Verification failed

The downloaded file does not match
the expected SHA256.

[ RETRY ]
[ CANCEL ]
```

---

# 10. 💾 Storage Management

Sebelum download:

* [ ] Cek free space.
* [ ] Cek ukuran PKG.
* [ ] Berikan buffer storage.
* [ ] Tampilkan storage yang tersedia.
* [ ] Jangan mulai download jika storage tidak cukup.

Contoh:

```text
File size:       12.4 GB
Required space:  13.0 GB
Available:       48.2 GB

✓ Enough storage
```

---

# 11. 🧩 Instalasi PKG

Target workflow:

```text
SELECT GAME
      ↓
DOWNLOAD PKG
      ↓
VERIFY SHA256
      ↓
CHECK STORAGE
      ↓
INSTALL PKG
      ↓
INSTALL COMPLETE
      ↓
REFRESH GAME LIST
```

TODO:

* [ ] Implement installer backend untuk environment PS4 homebrew yang didukung.
* [ ] Tentukan lokasi staging PKG.
* [ ] Integrasikan dengan mekanisme instalasi yang tersedia.
* [ ] Handle install error.
* [ ] Tampilkan status instalasi.
* [ ] Cleanup PKG setelah instalasi berhasil.
* [ ] Opsi `Keep PKG`.
* [ ] Refresh database setelah instalasi.
* [ ] Refresh daftar aplikasi/game PS4.

> Catatan: jangan mengasumsikan JavaScript di browser PS4 dapat menjalankan installer PKG secara langsung. UI Store dan backend/native installer harus dipisahkan.

---

# 12. 🖥️ Native PS4 Store Application

Target jangka panjang:

```text
B41M HEN STORE
       │
       ├── UI
       │
       ├── HTTP Client
       │
       ├── JSON Parser
       │
       ├── Download Manager
       │
       ├── SHA256
       │
       ├── Storage Manager
       │
       └── PKG Installer
```

TODO:

* [ ] Tentukan framework/toolchain aplikasi PS4.
* [ ] Buat native Store application.
* [ ] Implement HTTP/HTTPS client.
* [ ] Implement JSON parser.
* [ ] Implement download manager.
* [ ] Implement SHA256.
* [ ] Implement local cache.
* [ ] Implement installer bridge.
* [ ] Build `.pkg` Store application.
* [ ] Test pada firmware target.

---

# 13. 🌐 API / JSON Server

Gunakan endpoint sederhana:

```text
https://b4411m.github.io/store/data/version.json
https://b4411m.github.io/store/data/games.json
https://b4411m.github.io/store/data/categories.json
https://b4411m.github.io/store/data/featured.json
```

TODO:

* [ ] Buat `/data`.
* [ ] Buat `version.json`.
* [ ] Buat `games.json`.
* [ ] Buat `categories.json`.
* [ ] Buat `featured.json`.
* [ ] Pastikan semua JSON valid.
* [ ] Tambahkan CORS jika dibutuhkan web frontend.
* [ ] Gunakan HTTPS.
* [ ] Gunakan CDN untuk file besar.

---

# 14. 🗂️ Struktur Repository

Target:

```text
store/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── catalog.js
│   ├── search.js
│   ├── download.js
│   └── favorites.js
│
├── data/
│   ├── version.json
│   ├── games.json
│   ├── categories.json
│   └── featured.json
│
├── assets/
│   ├── icons/
│   ├── backgrounds/
│   └── screenshots/
│
└── TODO.md
```

---

# 15. ❤️ Favorites

* [ ] Add Favorite.
* [ ] Remove Favorite.
* [ ] Save favorites locally.
* [ ] Favorites tetap ada setelah restart.
* [ ] Halaman `My Favorites`.

---

# 16. 📥 Download History

Simpan:

```json
{
  "title_id": "HB000001",
  "title": "Example Homebrew",
  "version": "1.0",
  "downloaded": "2026-09-24T00:00:00Z"
}
```

TODO:

* [ ] Riwayat download.
* [ ] Clear history.
* [ ] Redownload.
* [ ] Show installed/downloaded status.

---

# 17. 🔄 Update System

Setiap item memiliki:

```text
version
previous_version
changelog
pkg.url
pkg.sha256
```

TODO:

* [ ] Detect update.
* [ ] Badge `UPDATE`.
* [ ] Show current version.
* [ ] Show available version.
* [ ] Download update.
* [ ] Verify update.
* [ ] Install update.

---

# 18. 🛡️ Security

WAJIB:

* [ ] HTTPS only.
* [ ] SHA256 setiap PKG.
* [ ] Jangan menjalankan URL arbitrary tanpa konfirmasi.
* [ ] Jangan mempercayai filename dari server.
* [ ] Validasi JSON.
* [ ] Validasi ukuran file.
* [ ] Timeout koneksi.
* [ ] Retry limit.
* [ ] Jangan menyimpan credential.
* [ ] Jangan memasukkan executable tidak dikenal ke repository.

---

# 19. 📜 Source / Distribution Policy

Database Store hanya boleh berisi:

* Homebrew.
* Open-source software.
* Game yang memang diizinkan author untuk didistribusikan.
* Demo/freeware.
* File yang pemilik haknya mengizinkan distribusi.

Untuk setiap item:

```json
{
  "license": "MIT",
  "redistribution": true,
  "source": "https://github.com/example/project"
}
```

Jangan memasukkan link PKG game komersial yang tidak memiliki izin distribusi.

---

# 20. 📊 Download Counter

Opsional:

```text
Downloads: 1,248
```

TODO:

* [ ] Counter server-side.
* [ ] Jangan mengandalkan counter lokal.
* [ ] Hindari tracking user pribadi.
* [ ] Gunakan anonymous statistics.

---

# 21. 📴 Offline Mode

Jika server tidak tersedia:

```text
Internet unavailable.

Using cached catalog...

Last update:
24 September 2026
```

TODO:

* [ ] Cache catalog.
* [ ] Cache metadata.
* [ ] Cache images opsional.
* [ ] Offline search.
* [ ] Retry server.

---

# 22. 🧪 Testing

## Web

* [ ] Chrome.
* [ ] Firefox.
* [ ] Safari.
* [ ] PS4 browser.

## PS4

* [ ] Firmware target 1.
* [ ] Firmware target 2.
* [ ] Firmware target 3.
* [ ] GoldHEN environment.
* [ ] Network disconnect.
* [ ] Low storage.
* [ ] Corrupt PKG.
* [ ] Interrupted download.
* [ ] Server unavailable.

---

# 23. 🚀 Milestone

## Phase 1 — Catalog

* [ ] `games.json`
* [ ] Dynamic loading
* [ ] Search
* [ ] Categories
* [ ] Detail page
* [ ] Featured
* [ ] Favorites

## Phase 2 — Download

* [ ] PKG URL
* [ ] Download manager
* [ ] Progress
* [ ] Retry
* [ ] Cancel
* [ ] SHA256
* [ ] Storage check

## Phase 3 — Native PS4

* [ ] Native application
* [ ] JSON API
* [ ] HTTP client
* [ ] Download manager
* [ ] PKG staging
* [ ] Installer integration

## Phase 4 — Production

* [ ] Auto update
* [ ] Update detection
* [ ] Offline cache
* [ ] Download history
* [ ] Statistics
* [ ] Error reporting
* [ ] Performance optimization

---

# 24. ⭐ Target User Experience

Target akhirnya:

```text
┌──────────────────────────────────────────┐
│ B41M HEN STORE                           │
│                                          │
│ 🔎 Search games...                       │
├──────────────────────────────────────────┤
│ ⭐ FEATURED                              │
│                                          │
│     [ GAME BANNER ]                      │
│                                          │
├──────────────────────────────────────────┤
│ 🎮 Games  📱 Apps  🛠 Tools  🔄 Updates │
├──────────────────────────────────────────┤
│                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │  ICON    │ │  ICON    │ │  ICON    │  │
│ │ Game 1   │ │ Game 2   │ │ Game 3   │  │
│ │ 2.4 GB   │ │ 5.1 GB   │ │ 1.2 GB   │  │
│ │ DOWNLOAD │ │ DOWNLOAD │ │ DOWNLOAD │  │
│ └──────────┘ └──────────┘ └──────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

Klik:

```text
DOWNLOAD
    ↓
CHECK INTERNET
    ↓
CHECK STORAGE
    ↓
DOWNLOAD PKG
    ↓
VERIFY SHA256
    ↓
INSTALL
    ↓
DONE ✓
```

---

# 25. 🔥 Prioritas Sekarang

Urutan pengerjaan yang disarankan:

1. [ ] Buat `data/games.json`.
2. [ ] Buat `data/version.json`.
3. [ ] Ubah `app.js` agar katalog tidak hard-code.
4. [ ] Load katalog dari JSON online.
5. [ ] Tambahkan automatic refresh.
6. [ ] Tambahkan cache.
7. [ ] Tambahkan search.
8. [ ] Tambahkan category/filter.
9. [ ] Tambahkan detail game.
10. [ ] Tambahkan metadata PKG.
11. [ ] Tambahkan SHA256.
12. [ ] Buat Download Manager.
13. [ ] Buat native PS4 Store.
14. [ ] Integrasikan installer.
15. [ ] Testing firmware.
16. [ ] Release B41M HEN STORE v1.0.

---

# 26. 🏁 Definition of Done

B41M HEN STORE dianggap selesai apabila:

* [ ] Admin cukup mengedit `games.json`.
* [ ] PS4 otomatis mendapatkan katalog terbaru.
* [ ] Tidak perlu update aplikasi untuk menambah game baru.
* [ ] User dapat mencari game.
* [ ] User dapat melihat detail.
* [ ] User dapat download PKG.
* [ ] Download memiliki progress.
* [ ] Download dapat di-cancel/retry.
* [ ] PKG diverifikasi SHA256.
* [ ] Storage diperiksa sebelum download.
* [ ] PKG dapat diteruskan ke mekanisme instalasi PS4 yang didukung.
* [ ] Setelah instalasi selesai, game muncul di PS4.
* [ ] Katalog dapat di-update tanpa reinstall Store.

---

## Version

```text
B41M HEN STORE
TODO Version: 1.0
Date: 2026-09-24
Status: DEVELOPMENT
```
