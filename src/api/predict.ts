/**
 * src/api/predict.ts
 */

// Sesuaikan URL ini dengan host & port backend Flask Anda saat dijalankan (local/production)
// Menggunakan type casting (import.meta as any) untuk menghindari error TypeScript
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/predict";

// ─── INTERFACES DATA INPUT (7 FITUR BERSIH DISESUAIKAN DENGAN LANDUSE_MAP BACKEND) ───
export interface PredictInput {
  curvature: number;
  dist_rivers: number;
  dist_roads: number;
  elevation: number;
  landuse: LanduseOption; 
  rainfall: number;       
  slope: number;          
}

// Opsi wajib huruf kecil (lowercase) agar tidak memicu KeyError (Error 500) di LANDUSE_MAP backend
export type LanduseOption =
  | "hutan"
  | "semak"
  | "padang rumput"
  | "pertanian"
  | "pemukiman"
  | "lahan kosong"
  | "perairan";

export type HazardClass = "RENDAH" | "SEDANG" | "TINGGI";

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface SingleModelResult {
  predicted_class: HazardClass;
  prob_longsor: number;
  confidence: number;
}

export interface PredictResult {
  xgboost: SingleModelResult;
  rf: SingleModelResult;
  svm: SingleModelResult;
  feature_importance: FeatureImportance[];
  recommended_model: "xgboost" | "rf" | "svm";
  jenks_breaks: number[];
}

/**
 * Mengirimkan data parameter geospasial lingkungan ke server Flask
 */
export async function predictLandslide(inputData: PredictInput): Promise<PredictResult> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Memastikan payload dikirim dengan struktur key huruf kecil murni sesuai kebutuhan backend
    body: JSON.stringify({
      curvature: inputData.curvature,
      dist_rivers: inputData.dist_rivers,
      dist_roads: inputData.dist_roads,
      elevation: inputData.elevation,
      landuse: inputData.landuse.trim().toLowerCase(), // Tambahan proteksi lowercase
      rainfall: inputData.rainfall,
      slope: inputData.slope,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error ?? `Koneksi gagal dengan status: ${response.status}`);
  }

  return response.json() as Promise<PredictResult>;
}

export function getRecommendedResult(result: PredictResult): SingleModelResult {
  return result[result.recommended_model];
}