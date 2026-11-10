"""
app.py — Backend Flask untuk Sistem Klasifikasi Kerawanan Tanah Longsor Wonosobo
=================================================================================
FORMAT MODEL: PyTorch (.pt)
Model sklearn pipeline (StandardScaler + Classifier) disimpan sebagai dict Python
lalu di-serialize menggunakan torch.save(). Dimuat kembali dengan torch.load().

Endpoint:
  GET  /health   — status server & model
  POST /predict  — inferensi 7 fitur geospasial → klasifikasi RENDAH/SEDANG/TINGGI
"""

import os
import traceback
import numpy as np
import pandas as pd
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS

# ============================================================
# 1. KONFIGURASI GLOBAL
# ============================================================

# 7 fitur final setelah eliminasi VIF (TWI dihapus sesuai notebook)
FEATURES_SEL = [
    "curvature",
    "dist_rivers",
    "dist_roads",
    "elevation",
    "landuse",
    "rainfall",
    "slope",
]

# Mapping landuse ke kode ESA WorldCover (sesuai data GEE)
# 10=Tree Cover, 20=Shrubland, 30=Grassland, 40=Cropland,
# 50=Built-up, 60=Bare/Sparse Veg, 80=Permanent Water Bodies
LANDUSE_MAP = {
    "hutan":        10,
    "semak":        20,
    "padang rumput": 30,
    "pertanian":    40,
    "pemukiman":    50,
    "lahan kosong": 60,
    "perairan":     80,
}

# Batas Natural Breaks Jenks dari hasil training notebook
JENKS_BREAKS_FALLBACK = [0.0, 0.2253, 0.5985, 1.0]

FEATURE_DISPLAY_NAMES = [
    "Curvature", "Dist_Rivers", "Dist_Roads", "Elevation",
    "Landuse", "Rainfall", "Slope",
]

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
PATH_XGB  = os.path.join(MODEL_DIR, "xgb_model.pt")
PATH_RF   = os.path.join(MODEL_DIR, "rf_model.pt")
PATH_SVM  = os.path.join(MODEL_DIR, "svm_model.pt")
PATH_META = os.path.join(MODEL_DIR, "model_meta.pt")

# ============================================================
# 2. INISIALISASI FLASK & CACHING MODEL
# ============================================================

app = Flask(__name__)
CORS(app)

_xgb_pipe     = None
_rf_pipe      = None
_svm_pipe     = None
_xgb_fi       = None
_jenks_breaks = JENKS_BREAKS_FALLBACK
_ready        = False
_load_error   = None


def load_model_pt(path: str):
    bundle = torch.load(path, map_location="cpu", weights_only=False)
    if isinstance(bundle, dict) and "pipeline" in bundle:
        return bundle["pipeline"]
    return bundle


def load_models():
    global _xgb_pipe, _rf_pipe, _svm_pipe, _xgb_fi, _jenks_breaks, _ready, _load_error

    try:
        print("[SERVER] Memuat model .pt ke runtime...")

        _xgb_pipe = load_model_pt(PATH_XGB)
        _rf_pipe  = load_model_pt(PATH_RF)
        _svm_pipe = load_model_pt(PATH_SVM)

        if os.path.exists(PATH_META):
            meta = torch.load(PATH_META, map_location="cpu", weights_only=False)
            _jenks_breaks = [float(x) for x in meta.get("jenks_breaks", JENKS_BREAKS_FALLBACK)]
            print(f"[SERVER] Jenks breaks dari meta: {_jenks_breaks}")
        else:
            print(f"[SERVER] model_meta.pt tidak ditemukan — pakai fallback: {_jenks_breaks}")

        xgb_clf = (
            _xgb_pipe.named_steps["clf"]
            if hasattr(_xgb_pipe, "named_steps")
            else _xgb_pipe
        )

        if hasattr(xgb_clf, "feature_importances_"):
            fi_vals = xgb_clf.feature_importances_.tolist()
        else:
            fi_vals = [1.0 / len(FEATURES_SEL)] * len(FEATURES_SEL)

        fi_pairs = sorted(
            zip(FEATURE_DISPLAY_NAMES, fi_vals),
            key=lambda x: x[1],
            reverse=True,
        )
        _xgb_fi = [
            {"feature": name, "importance": round(val, 4)}
            for name, val in fi_pairs
        ]

        _ready = True
        print(f"[SERVER] ✅ Semua model .pt siap.")
        print(f"[SERVER]    Jenks breaks: RENDAH ≤ {_jenks_breaks[1]:.4f} | "
              f"SEDANG ≤ {_jenks_breaks[2]:.4f} | TINGGI > {_jenks_breaks[2]:.4f}")

    except FileNotFoundError as e:
        _load_error = (
            f"File model .pt tidak ditemukan: {e}. "
            f"Pastikan folder 'models/' berisi xgb_model.pt, rf_model.pt, svm_model.pt."
        )
        print(f"[SERVER] ❌ {_load_error}")
    except Exception as e:
        _load_error = str(e)
        print(f"[SERVER] ❌ Gagal memuat model: {e}")
        traceback.print_exc()


# ============================================================
# 3. HELPER FUNCTIONS
# ============================================================

def build_feature_df(data: dict) -> pd.DataFrame:
    """
    Parsing payload JSON → DataFrame dengan 7 fitur geospasial.
    Landuse diterima sebagai string lowercase → dikonversi ke kode ESA WorldCover (integer).
    """
    def get_float(keys, default=0.0):
        for k in keys:
            if k in data and data[k] is not None:
                try:
                    return float(data[k])
                except (ValueError, TypeError):
                    pass
        return default

    # Landuse: string lowercase → kode ESA integer
    landuse_raw  = str(data.get("landuse", data.get("Landuse", "hutan"))).strip().lower()
    landuse_code = float(LANDUSE_MAP.get(landuse_raw, LANDUSE_MAP["hutan"]))

    raw_curvature   = get_float(["curvature",  "Curvature"],   0.0)
    raw_dist_rivers = get_float(["dist_rivers", "Dist_Rivers"], 0.0)
    raw_dist_roads  = get_float(["dist_roads",  "Dist_Roads"],  0.0)
    raw_elevation   = get_float(["elevation",   "Elevation"],   0.0)
    raw_rainfall    = get_float(["rainfall",    "Rainfall"],    0.0)
    raw_slope       = get_float(["slope",       "Slope"],       0.0)

    row = {
        "curvature":   [raw_curvature],
        "dist_rivers": [raw_dist_rivers],
        "dist_roads":  [raw_dist_roads],
        "elevation":   [raw_elevation],
        "landuse":     [landuse_code],
        "rainfall":    [raw_rainfall],
        "slope":       [raw_slope],
    }

    print(f"[PREPROCESSING] slope={raw_slope}° | rainfall={raw_rainfall} mm/hari | "
          f"landuse={landuse_raw} (ESA={int(landuse_code)})")
    return pd.DataFrame(row)[FEATURES_SEL]


def classify_to_tier(prob_longsor: float) -> str:
    """Klasifikasi probabilitas ke label kerawanan via Natural Breaks Jenks."""
    low  = _jenks_breaks[1]
    high = _jenks_breaks[2]
    if prob_longsor <= low:
        return "RENDAH"
    elif prob_longsor <= high:
        return "SEDANG"
    else:
        return "TINGGI"


def process_prediction(pipe, features_df: pd.DataFrame) -> dict:

    clf = pipe.named_steps["clf"]
    probs = pipe.predict_proba(features_df)
    idx = list(clf.classes_).index(1)
    prob_longsor = float(probs[0][idx])
    tier = classify_to_tier(prob_longsor)

    return {
        "predicted_class": tier,
        "prob_longsor": round(prob_longsor, 4),
        "confidence": round(
            prob_longsor if tier == "TINGGI" else (1.0 - prob_longsor), 4
        ),
    }


# ============================================================
# 4. ENDPOINTS API
# ============================================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":        "ok" if _ready else "error",
        "models_loaded": _ready,
        "model_format":  ".pt (PyTorch serialization)",
        "error":         _load_error,
        "jenks_breaks": {
            "rendah": f"prob ≤ {_jenks_breaks[1]:.4f}",
            "sedang": f"{_jenks_breaks[1]:.4f} < prob ≤ {_jenks_breaks[2]:.4f}",
            "tinggi": f"prob > {_jenks_breaks[2]:.4f}",
        },
        "features":    FEATURES_SEL,
        "landuse_map": LANDUSE_MAP,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if not _ready:
        return jsonify({"error": _load_error or "Model belum siap di runtime server."}), 503

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "Request body harus berupa JSON valid."}), 400

    landuse_val = str(data.get("landuse", data.get("Landuse", ""))).strip().lower()
    if landuse_val and landuse_val not in LANDUSE_MAP:
        return jsonify({
            "error": (
                f"Nilai landuse '{landuse_val}' tidak dikenal. "
                f"Pilih dari: {list(LANDUSE_MAP.keys())}"
            )
        }), 400

    try:
        features_df = build_feature_df(data)

        res_xgb = process_prediction(_xgb_pipe, features_df)
        res_rf  = process_prediction(_rf_pipe,  features_df)

        try:
            res_svm = process_prediction(_svm_pipe, features_df)
        except AttributeError:
            pred_class = int(_svm_pipe.predict(features_df)[0])
            tier_svm   = "TINGGI" if pred_class == 1 else "RENDAH"
            res_svm    = {
                "predicted_class": tier_svm,
                "prob_longsor":    1.0 if pred_class == 1 else 0.0,
                "confidence":      1.0,
            }

        return jsonify({
            "xgboost":            res_xgb,
            "rf":                 res_rf,
            "svm":                res_svm,
            "feature_importance": _xgb_fi,
            "recommended_model":  "xgboost",
            "jenks_breaks":       [float(x) for x in _jenks_breaks],
        })

    except Exception as e:
        print("[SERVER ERROR]")
        traceback.print_exc()
        return jsonify({"error": f"Gagal menjalankan inferensi: {str(e)}"}), 500


# ============================================================
# 5. ENTRY POINT
# ============================================================

if __name__ == "__main__":
    load_models()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)