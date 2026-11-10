"""
=======================================================
SEL EXPORT — Simpan Model ke Format .pt (PyTorch)
=======================================================
Jalankan sel ini di Colab SETELAH semua training selesai
(setelah best_models dan breaks tersedia).

torch.save() di sini digunakan untuk serialize objek Python
(sklearn Pipeline), bukan Tensor PyTorch. Format .pt dipilih
agar konsisten dengan backend Flask berbasis torch.load().
=======================================================
"""

# ── INSTALL (jika belum ada) ──────────────────────────────────────────────────
# !pip install torch --quiet  # CPU-only, uncomment jika perlu

import os
import torch

# ── KONFIGURASI PATH ──────────────────────────────────────────────────────────
MODEL_DIR = "/content/models_pt"
os.makedirs(MODEL_DIR, exist_ok=True)

# ── 1. SIMPAN TIAP PIPELINE KE .pt ───────────────────────────────────────────
# torch.save menerima semua objek Python yang bisa di-pickle,
# termasuk sklearn Pipeline (StandardScaler + Classifier).

torch.save(
    {"pipeline": best_models["XGBoost"]},
    os.path.join(MODEL_DIR, "xgb_model.pt")
)

torch.save(
    {"pipeline": best_models["Random Forest"]},
    os.path.join(MODEL_DIR, "rf_model.pt")
)

torch.save(
    {"pipeline": best_models["SVM (RBF)"]},
    os.path.join(MODEL_DIR, "svm_model.pt")
)

print("✅ Model tersimpan:")
print(f"   xgb_model.pt   → XGBoost pipeline (StandardScaler + XGBClassifier)")
print(f"   rf_model.pt    → Random Forest pipeline (StandardScaler + RFC)")
print(f"   svm_model.pt   → SVM pipeline (StandardScaler + SVC)")

# ── 2. SIMPAN METADATA (Jenks Breaks + Fitur Terpilih) ───────────────────────
# breaks = hasil jenkspy.jenks_breaks(prob_all, n_classes=3) dari Cell 11
# Struktur: [min_val, batas_rendah_sedang, batas_sedang_tinggi, max_val]

meta = {
    "jenks_breaks":     breaks,          # list 4 elemen dari jenkspy
    "features_selected": FEATURES_SEL,   # 7 fitur setelah eliminasi TWI
    "landuse_map": {                      # LabelEncoder alphabetical
        "hutan":      0,
        "pemukiman":  1,
        "perkebunan": 2,
        "sawah":      3,
        "semak":      4,
        "tegalan":    5,
    },
    "best_model_name": best_name,         # nama model terbaik (AUC tertinggi)
    "jenks_class_labels": {
        "rendah": f"prob ≤ {breaks[1]:.4f}",
        "sedang": f"{breaks[1]:.4f} < prob ≤ {breaks[2]:.4f}",
        "tinggi": f"prob > {breaks[2]:.4f}",
    },
}

torch.save(meta, os.path.join(MODEL_DIR, "model_meta.pt"))

print(f"\n✅ Metadata tersimpan → model_meta.pt")
print(f"   Jenks: RENDAH ≤ {breaks[1]:.4f} | SEDANG ≤ {breaks[2]:.4f} | TINGGI > {breaks[2]:.4f}")
print(f"   Fitur: {FEATURES_SEL}")

# ── 3. VERIFIKASI — Load balik dan cek ───────────────────────────────────────
print("\n── Verifikasi: Load ulang dari .pt ──────────────────────────────────")
for fname in ["xgb_model.pt", "rf_model.pt", "svm_model.pt"]:
    bundle = torch.load(os.path.join(MODEL_DIR, fname), 
                        map_location="cpu", weights_only=False)
    pipe = bundle["pipeline"]
    size_kb = os.path.getsize(os.path.join(MODEL_DIR, fname)) // 1024
    print(f"   {fname:20s} ({size_kb:>5} KB) — steps: {list(pipe.named_steps.keys())}")

meta_loaded = torch.load(os.path.join(MODEL_DIR, "model_meta.pt"), 
                         map_location="cpu", weights_only=False)
print(f"   model_meta.pt        → jenks_breaks={meta_loaded['jenks_breaks']}")
print(f"\n✅ Verifikasi selesai — semua file .pt valid dan dapat dimuat ulang.")

# ── 4. DOWNLOAD KE LOKAL ─────────────────────────────────────────────────────
from google.colab import files

print("\n📥 Mengunduh semua file .pt ke komputer lokal...")
files.download(os.path.join(MODEL_DIR, "xgb_model.pt"))
files.download(os.path.join(MODEL_DIR, "rf_model.pt"))
files.download(os.path.join(MODEL_DIR, "svm_model.pt"))
files.download(os.path.join(MODEL_DIR, "model_meta.pt"))
print("✅ Download selesai! Pindahkan ke folder models/ pada proyek Flask.")
