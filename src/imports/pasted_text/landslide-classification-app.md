Oke, noted! Jadi parameter input yang digunakan ada **7 fitur** dan output kelas ada **3** (Rendah, Sedang, Tinggi). Berikut prompt yang sudah diperbarui:

---

# PROMPT: Web App Klasifikasi Kerawanan Tanah Longsor — Final Version

## Gambaran Umum

Bangun sebuah web aplikasi akademik (SPA) dengan React + Tailwind CSS berjudul:

**"Sistem Klasifikasi Kerawanan Tanah Longsor Kabupaten Wonosobo"**

Frontend dari sistem machine learning berbasis XGBoost dengan **3 halaman**: `Dashboard`, `Klasifikasi`, dan `Tentang`. Koneksi ke model ML ada di Google Colab (Flask/FastAPI), siapkan struktur fetch-nya dengan fallback mock data.

---

## Desain & Tema Visual

- **Warna utama**: Hijau tua `#1B4332`, putih `#FFFFFF`, aksen amber `#F59E0B`
- **Font**: Serif untuk judul besar, sans-serif untuk body
- **Gaya**: Clean, akademis, banyak whitespace, card dengan `shadow-md`
- **Bahasa**: Indonesia
- **Responsif**: Mobile-first

---

## Layout Global

- **Navbar atas (fixed)**: Logo di kiri, menu `Dashboard | Klasifikasi | Tentang` di kanan
- **Mobile**: hamburger menu atau bottom nav
- **Footer**: Nama peneliti, institusi, tahun, disclaimer akademis

---

## Routing

```
/            → Dashboard (Home)
/klasifikasi → Halaman Klasifikasi
/tentang     → Halaman Tentang Penelitian
```

---

## Halaman 1 — Dashboard (`/`)

### Hero Section
- Background gradien hijau tua
- Judul: `"Sistem Klasifikasi Kerawanan Tanah Longsor Kabupaten Wonosobo"`
- Subjudul: `"Menggunakan XGBoost berbasis 7 parameter geospasial untuk mendukung mitigasi bencana"`
- Tombol CTA: `"Mulai Klasifikasi"` (amber) dan `"Tentang Penelitian"` (outline putih)

### Kartu Statistik (3 kartu)
| Kartu | Isi |
|---|---|
| Total Data | "1.200 titik geospasial" |
| Model Digunakan | "XGBoost" |
| Akurasi Model | "93,02%" |

### Fitur Utama (grid 3 kolom)
1. **Klasifikasi Otomatis** — Prediksi kelas kerawanan dari 7 parameter geospasial
2. **Berbasis Data Nyata** — Data BIG, BMKG, dan BPBD Wonosobo
3. **Hasil Mudah Dipahami** — Output disajikan dengan penjelasan narasi

### Card Ringkasan Model
- XGBoost, akurasi `93,02%`, AUC `0.9743`
- Kalimat: *"XGBoost dipilih sebagai model terbaik berdasarkan evaluasi komparasi dengan Random Forest dan SVM-RBF."*

---

## Halaman 2 — Klasifikasi (`/klasifikasi`)

### Header Halaman
- Judul: `"Klasifikasi Kerawanan Tanah Longsor"`
- Subjudul: `"Masukkan 7 parameter geospasial untuk mendapatkan prediksi kelas kerawanan"`

### Form Input — 7 Parameter

Layout grid 2 kolom (desktop) / 1 kolom (mobile). Setiap field punya label, satuan, dan hint range.

| No | Parameter | Tipe Input | Range / Opsi |
|---|---|---|---|
| 1 | **Curvature** | Slider + angka | -10.0 sampai 10.0 |
| 2 | **Jarak dari Sungai** (Dist_Rivers) | Slider + angka | 0–5000 meter |
| 3 | **Jarak dari Jalan** (Dist_Roads) | Slider + angka | 0–3000 meter |
| 4 | **Ketinggian** (Elevation) | Slider + angka | 0–3000 mdpl |
| 5 | **Penggunaan Lahan** (Landuse) | Dropdown | Hutan, Perkebunan, Sawah, Pemukiman, Semak |
| 6 | **Curah Hujan Tahunan** (Rainfall) | Slider + angka | 0–5000 mm/tahun |
| 7 | **Kemiringan Lereng** (Slope) | Slider + angka | 0–90 derajat |

**Tombol `"Prediksi Sekarang"`**: full-width, hijau tua, teks putih, ukuran besar, di bawah seluruh form.

Catatan kecil: *"Prediksi menggunakan model XGBoost yang dilatih pada data geospasial Kabupaten Wonosobo"*

---

### Panel Hasil (fade-in di bawah form setelah klik prediksi)

**a. Badge Kelas Kerawanan (besar, centered)**

Hanya 3 kelas:
- `RENDAH` → background `#52B788` (hijau)
- `SEDANG` → background `#F9C74F` (kuning), teks gelap
- `TINGGI` → background `#D62828` (merah), teks putih

**b. Kalimat Penjelasan Narasi**

Tampilkan paragraf otomatis sesuai kelas hasil. Contoh template per kelas:

> **Jika RENDAH:**
> *"Berdasarkan parameter yang dimasukkan, wilayah ini termasuk dalam zona kerawanan **RENDAH**. Kondisi lereng yang landai, jarak yang cukup jauh dari sungai, serta tutupan lahan yang baik menjadi faktor penurun risiko. Wilayah ini relatif aman, namun tetap perlu pemantauan saat musim hujan intensitas tinggi."*

> **Jika SEDANG:**
> *"Berdasarkan parameter yang dimasukkan, wilayah ini termasuk dalam zona kerawanan **SEDANG**. Kombinasi curah hujan yang cukup tinggi dan kemiringan lereng yang moderat meningkatkan potensi risiko longsor. Disarankan untuk tidak melakukan penggalian tanah di area lereng dan memastikan drainase permukaan berfungsi dengan baik."*

> **Jika TINGGI:**
> *"Berdasarkan parameter yang dimasukkan, wilayah ini termasuk dalam zona kerawanan **TINGGI**. Faktor dominan meliputi kemiringan lereng yang curam, curah hujan tinggi, dan jarak yang dekat dengan sungai. Wilayah ini memerlukan perhatian serius — hindari pembangunan permanen dan lakukan mitigasi struktural seperti pemasangan bronjong atau retaining wall."*

**c. Bar Chart Horizontal — Probabilitas per Kelas (3 bar)**
- Rendah / Sedang / Tinggi dengan persentase di ujung bar

**d. Top 5 Fitur Berpengaruh (bar chart horizontal)**
- Label fitur di kiri, panjang bar mewakili bobot pengaruh
- Warna hijau tua

**e. Skor Keyakinan Model**
- Teks: *"Keyakinan model: XX%"*

---

### Koneksi ke Backend Google Colab

Buat file `src/api/predict.js`:

```js
const COLAB_URL = "https://YOUR_NGROK_URL/predict"; // ganti saat Colab aktif

export async function predictLandslide(inputData) {
  try {
    const response = await fetch(COLAB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputData)
    });
    return await response.json();
  } catch (error) {
    // Fallback: mock response saat backend offline
    return mockResponse(inputData);
  }
}

function mockResponse(input) {
  return {
    predicted_class: "SEDANG",
    probabilities: { RENDAH: 0.15, SEDANG: 0.67, TINGGI: 0.18 },
    confidence: 0.67,
    feature_importance: [
      { feature: "Rainfall", importance: 0.31 },
      { feature: "Slope", importance: 0.27 },
      { feature: "Elevation", importance: 0.18 },
      { feature: "Dist_Rivers", importance: 0.12 },
      { feature: "Curvature", importance: 0.07 }
    ]
  };
}
```

Format input yang dikirim ke backend:
```json
{
  "Curvature": 0.5,
  "Dist_Rivers": 120.0,
  "Dist_Roads": 300.0,
  "Elevation": 850.0,
  "Landuse": "Perkebunan",
  "Rainfall": 3200.0,
  "Slope": 28.5
}
```

---

## Halaman 3 — Tentang (`/tentang`)

### Section 1 — Latar Belakang
Paragraf singkat urgensi penelitian longsor di Wonosobo.

### Section 2 — Alur Metodologi (stepper vertikal dengan nomor dan garis penghubung)
1. Pengumpulan Data Geospasial (BIG, BMKG, BPBD)
2. Preprocessing & Normalisasi
3. Seleksi 7 Fitur (setelah uji VIF — TWI dieliminasi)
4. Split Data: Train 80% / Test 20%
5. Training Model XGBoost
6. Evaluasi & Validasi (Accuracy, AUC, F1)
7. Deployment Web

### Section 3 — Dataset
Tabel: sumber data, jumlah sampel per kelas (Rendah / Sedang / Tinggi), resolusi spasial, rentang waktu.

### Section 4 — Konfigurasi Model XGBoost
Card berisi hyperparameter terbaik dan library (`xgboost`, `scikit-learn`).

### Section 5 — Profil Peneliti
Card: foto placeholder, nama, NIM, Prodi, Institusi, badge pencapaian:
- IndonesiaNEXT Batch 9 — Top 99 dari 7.000+ peserta
- Krenova Kabupaten Wonosobo 2025 — Finalist
- PMM Batch 4 — Universitas Syiah Kuala (IPK 3,91)

### Section 6 — Referensi
5 referensi format IEEE (placeholder). Tombol `"Unduh Paper (PDF)"`.

---

## Catatan Teknis

- Gunakan **React Router v6** untuk navigasi
- Gunakan **Recharts** untuk semua visualisasi chart
- Semua halaman harus berjalan penuh dalam **mode mock** tanpa backend
- Tidak ada halaman peta, tidak ada tab multi-algoritma, tidak ada confusion matrix di sini