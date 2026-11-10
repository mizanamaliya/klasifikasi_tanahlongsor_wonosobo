# Migrasi Model: `.pkl` → `.pt` (PyTorch)

## Ringkasan Perubahan

| File | Perubahan |
|------|-----------|
| `app.py` | `joblib.load()` → `torch.load()` |
| `requirements_app.txt` | Tambah `torch>=2.0.0` |
| `models/*.pkl` | Hapus, ganti dengan `models/*.pt` |
| `models/model_meta.pt` | **Baru** — menyimpan Jenks breaks & metadata |

---

## Langkah 1 — Export Model di Colab

Tempelkan dan jalankan sel berikut di Colab **setelah semua training selesai**
(variabel `best_models`, `breaks`, `FEATURES_SEL`, `best_name` harus sudah ada):

```python
import os, torch

MODEL_DIR = "/content/models_pt"
os.makedirs(MODEL_DIR, exist_ok=True)

# Simpan tiap pipeline sklearn ke .pt
torch.save({"pipeline": best_models["XGBoost"]},       f"{MODEL_DIR}/xgb_model.pt")
torch.save({"pipeline": best_models["Random Forest"]},  f"{MODEL_DIR}/rf_model.pt")
torch.save({"pipeline": best_models["SVM (RBF)"]},      f"{MODEL_DIR}/svm_model.pt")

# Simpan metadata
torch.save({
    "jenks_breaks":      breaks,        # [min, batas_RS, batas_ST, max]
    "features_selected": FEATURES_SEL,
    "best_model_name":   best_name,
}, f"{MODEL_DIR}/model_meta.pt")

print("✅ Semua .pt tersimpan!")

# Download
from google.colab import files
for f in ["xgb_model.pt", "rf_model.pt", "svm_model.pt", "model_meta.pt"]:
    files.download(f"{MODEL_DIR}/{f}")
```

---

## Langkah 2 — Susun Folder Proyek

```
website/
├── app.py                  ← sudah diupdate (torch.load)
├── requirements_app.txt    ← sudah diupdate (+ torch)
├── models/
│   ├── xgb_model.pt        ← dari Colab
│   ├── rf_model.pt         ← dari Colab
│   ├── svm_model.pt        ← dari Colab
│   └── model_meta.pt       ← dari Colab (Jenks breaks, dll)
└── src/
    └── ...                 ← frontend tidak berubah
```

> **Hapus** file `.pkl` lama dari folder `models/` setelah file `.pt` sudah ada.

---

## Langkah 3 — Install Dependencies & Jalankan

```bash
pip install -r requirements_app.txt
python app.py
```

Untuk install PyTorch CPU-only (lebih ringan, cukup untuk inferensi):
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

---

## Mengapa `.pt` Bukan `.pkl`?

| Aspek | `.pkl` (joblib) | `.pt` (PyTorch) |
|-------|----------------|-----------------|
| Format | Pickle Python | PyTorch serialize |
| Keamanan | Rentan pickle exploit | Sama (tapi torch.load punya `weights_only`) |
| Kompatibilitas | scikit-learn saja | sklearn + PyTorch model |
| Ukuran | Kecil | Sedikit lebih besar |
| Ekosistem ke depan | Statis | Bisa evolusi ke pure PyTorch neural net |

**Catatan:** Model yang disimpan tetap sklearn Pipeline (bukan neural network PyTorch).
Format `.pt` di sini digunakan sebagai **container serialisasi** via `torch.save/load`,
yang bekerja persis seperti pickle namun dengan ekstensi file `.pt`.

---

## LANDUSE_MAP (LabelEncoder Alphabetical)

```python
LANDUSE_MAP = {
    "hutan":      0,
    "pemukiman":  1,
    "perkebunan": 2,
    "sawah":      3,
    "semak":      4,
    "tegalan":    5,
}
```

> **Penting:** Mapping ini harus konsisten antara notebook, `app.py`, dan frontend.
