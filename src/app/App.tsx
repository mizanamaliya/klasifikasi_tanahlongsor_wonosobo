import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Menu, X, Activity, Database, Award, ArrowRight, BookOpen, Layers, Users } from "lucide-react";
import { predictLandslide, type PredictResult } from "../api/predict";

// ─── Tipe Data ────────────────────────────────────────────────────────────────
type LanduseOption =
  | "hutan"
  | "semak"
  | "padang rumput"
  | "pertanian"
  | "pemukiman"
  | "lahan kosong"
  | "perairan";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/klasifikasi", label: "Klasifikasi" },
    { to: "/tentang", label: "Tentang" },
  ];

  const active = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border"
      style={{ boxShadow: "0 1px 12px rgba(27,67,50,0.07)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center shrink-0"> 
          <span
            className="hidden sm:block text-xl font-semibold leading-tight text-primary"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#1B4332" }}
          >
            Longsor<span style={{ color: "#F59E0B" }}>Wonosobo</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                active(l.to)
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}
              style={
                active(l.to)
                  ? { background: "#1B4332", fontFamily: "'DM Sans', sans-serif" }
                  : { fontFamily: "'DM Sans', sans-serif" }
              }
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden p-2 rounded-md text-foreground hover:bg-muted"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 pb-4 pt-2 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                active(l.to) ? "text-white" : "text-foreground/70"
              )}
              style={active(l.to) ? { background: "#1B4332" } : {}}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="mt-auto border-t border-border"
      style={{ background: "#1B4332", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="text-white font-bold text-base mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Sistem Klasifikasi Kerawanan Tanah Longsor
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Kabupaten Wonosobo - Berbasis Komparasi Model & 7 Parameter Geospasial
          </p>
        </div>
        <div>
          <div className="text-white font-semibold text-sm mb-2">Peneliti</div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            Mizana Amaliya<br />
            Program Studi Teknik Informatika<br />
            Universitas Sains Al-Qur'an (UNSIQ)<br />
            Tahun 2026
          </p>
        </div>
        <div>
          <div className="text-white font-semibold text-sm mb-2">Disclaimer</div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Hasil prediksi bersifat estimatif dan bergantung pada pola yang dipelajari model dari data penelitian.
          </p>
        </div>
      </div>
      <div
        className="text-center text-xs py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)" }}
      >
        © 2026 - Penelitian Skripsi - Universitas Sains Al-Qur'an Wonosobo
      </div>
    </footer>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { icon: <Database size={20} />, label: "Total Data", value: "714", sub: "titik geospasial" },
    { icon: <Activity size={20} />, label: "Algoritma Terbaik", value: "XGBoost", sub: "Extreme Gradient Boosting" },
    { icon: <Award size={20} />, label: "Akurasi Tertinggi", value: "93,80%", sub: "pada data uji 20%" },
  ];

  const features = [
    {
      icon: <Layers size={22} style={{ color: "#1B4332" }} />,
      title: "Klasifikasi Komparatif",
      desc: "Menampilkan hasil klasifikasi dari tiga model machine learning (XGBoost, Random Forest, dan SVM) berdasarkan parameter geospasial wilayah yang diinputkan.",
    },
    {
      icon: <Database size={22} style={{ color: "#1B4332" }} />,
      title: "Integrasi Data Geospasial",
      desc: "Parameter geospasial telah melalui proses analisis multikolinearitas menggunakan Variance Inflation Factor (VIF) untuk memastikan tidak terdapat hubungan linear yang mengganggu performa.",
    },
    {
      icon: <BookOpen size={22} style={{ color: "#1B4332" }} />,
      title: "Visualisasi Interaktif",
      desc: "Grafik distribusi probabilitas tingkat kerawanan tanah longsor beserta visualisasi tingkat kontribusi setiap parameter geospasial (Feature Importance).",
    },
  ];

  return (
    <div>
      <section
        className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d2b1e 0%, #1B4332 55%, #2d6a4f 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 40px)",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1
            className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Sistem Klasifikasi Kerawanan<br className="hidden sm:block" /> Tanah Longsor
            <span style={{ color: "#F59E0B" }}> Kabupaten Wonosobo</span>
          </h1>
          <p
            className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Komparati algoritma Random Forest, SVM, dan XGBoost berbasis data geospasial untuk optimalisasi mitigasi bencana daerah.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/klasifikasi")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#F59E0B", color: "#0d1f17", fontFamily: "'DM Sans', sans-serif" }}
            >
              Mulai Klasifikasi Spasial <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/tentang")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Tentang Penelitian
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 mb-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-md border border-border flex items-start gap-4">
              <div className="p-2.5 rounded-lg shrink-0" style={{ background: "#edf4ef", color: "#1B4332" }}>
                {s.icon}
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {s.label}
                </div>
                <div className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-16">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
          Fitur Utama Sistem
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Arsitektur terintegrasi untuk proses klasifikasi multi-algoritma secara real-time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: "#d8ede3" }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-base mb-2" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0d1f17" }}>
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Classification Page ──────────────────────────────────────────────────────

const landuseOptions = [
  { value: "hutan",         label: "Hutan (Tree Cover)" },
  { value: "semak",         label: "Semak / Belukar (Shrubland)" },
  { value: "padang rumput", label: "Padang Rumput (Grassland)" },
  { value: "pertanian",    label: "Pertanian / Sawah (Cropland)" },
  { value: "pemukiman",    label: "Pemukiman (Built-up)" },
  { value: "lahan kosong", label: "Lahan Kosong (Bare / Sparse Veg)" },
  { value: "perairan",     label: "Perairan (Permanent Water Bodies)" },
];

const narratives: Record<string, string> = {
  RENDAH:
    "Wilayah menunjukkan kombinasi parameter geospasial yang stabil seperti kemiringan lereng rendah–sedang, jarak aman dari sungai dan jalan, serta kondisi elevasi yang relatif stabil.",
  SEDANG:
    "Wilayah memiliki kombinasi parameter yang menunjukkan potensi kerentanan sedang, seperti variasi kemiringan lereng dan kedekatan moderat terhadap elemen pemicu seperti jalan atau aliran sungai.",
  TINGGI:
    " Wilayah menunjukkan kombinasi parameter yang mengindikasikan potensi kerawanan tinggi, seperti kemiringan lereng yang lebih curam, elevasi tertentu, serta kedekatan terhadap faktor pemicu longsor. ",
};

const classColors: Record<string, string> = {
  RENDAH: "#52B788",
  SEDANG: "#F9C74F",
  TINGGI: "#D62828",
};

const classTextColors: Record<string, string> = {
  RENDAH: "#ffffff",
  SEDANG: "#0d1f17",
  TINGGI: "#ffffff",
};

// ─── Slider Field ─────────────────────────────────────────────────────────────
type SliderFieldProps = {
  label: string;
  unit: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
};

function SliderField({ label, unit, hint, min, max, step, value, onChange }: SliderFieldProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div
      className="rounded-xl p-4 border transition-all hover:shadow-md"
      style={{ background: "#f8fdf9", borderColor: "#c8e6d0" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <label
          className="text-sm font-semibold leading-tight"
          style={{ fontFamily: "'DM Sans', sans-serif", color: "#1B4332" }}
        >
          {label}
        </label>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 text-right text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            style={{
              fontFamily: "'DM Mono', monospace",
              borderColor: "#1B4332",
              color: "#1B4332",
              fontWeight: 700,
              background: "#ffffff",
            }}
          />
          <span
            className="text-xs font-medium w-12"
            style={{ color: "#52B788", fontFamily: "'DM Sans', sans-serif" }}
          >
            {unit}
          </span>
        </div>
      </div>

      {/* Slider track */}
      <div className="relative" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
        {/* Track background */}
        <div
          className="w-full rounded-full"
          style={{ height: "6px", background: "#d1e8da" }}
        />
        {/* Track fill */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            height: "6px",
            width: `${pct}%`,
            background: "#1B4332",
            top: "10px",
            left: 0,
          }}
        />
        {/* Native input — transparent, on top */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full cursor-pointer"
          style={{
            top: "4px",
            left: 0,
            height: "18px",
            opacity: 0,
            margin: 0,
            zIndex: 2,
          }}
        />
        {/* Custom thumb */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `calc(${pct}% - 11px)`,
            top: "50%",
            transform: "translateY(-50%)",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#1B4332",
            border: "3px solid #ffffff",
            boxShadow: "0 0 0 2px #1B4332, 0 2px 6px rgba(27,67,50,0.4)",
            zIndex: 1,
          }}
        />
      </div>

      {/* Min / hint / max */}
      <div
        className="flex justify-between text-xs mt-1"
        style={{ fontFamily: "'DM Mono', monospace", color: "#7aab8a" }}
      >
        <span>{min}</span>
        <span style={{ color: "#52B788" }}>{hint}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── Klasifikasi Page ─────────────────────────────────────────────────────────
function Klasifikasi() {
  const [form, setForm] = useState({
    curvature:   5.0,
    dist_rivers: 5.0,
    dist_roads:  3.0,
    elevation:   800,
    landuse:     "hutan" as LanduseOption,
    rainfall:    8.5,
    slope:       15.0,
  });

  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, val: number | string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const payload = { ...form, landuse: form.landuse as LanduseOption };
      const res = await predictLandslide(payload);
      setResult(res);
      setTimeout(() => {
        document.getElementById("hasil-prediksi")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan inferensi ke server Flask backend.");
    } finally {
      setLoading(false);
    }
  };

  const probData = result?.xgboost
    ? [
        { name: "Probabilitas Longsor", value: Math.round(result.xgboost.prob_longsor * 100), color: "#D62828" },
        { name: "Tidak Longsor", value: Math.round((1 - result.xgboost.prob_longsor) * 100), color: "#52B788" },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      <div className="mb-10">
        <span
          className="text-xs font-semibold tracking-widest uppercase mb-3 block"
          style={{ color: "#1B4332", fontFamily: "'DM Mono', monospace" }}
        >
          Komparasi Model Machine Learning Berbasis Data Geospasial
        </span>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
          Sistem Klasifikasi Kerawanan Tanah Longsor
        </h1>
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Masukkan nilai tujuh parameter geospasial untuk memperoleh hasil klasifikasi kerawanan tanah longsor menggunakan model XGBoost, Random Forest, dan SVM.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-md p-6 md:p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Curvature */}
          <SliderField
            label="Kelengkungan Lereng (Curvature)"
            unit="—"
            hint="Rentang: 0 – 27.32"
            min={0}
            max={30}
            step={0.01}
            value={form.curvature}
            onChange={(v) => set("curvature", v)}
          />

          {/* Dist Rivers */}
          <SliderField
            label="Jarak dari Sungai (Dist_Rivers)"
            unit="m"
            hint="Rentang: 0.09 – 26.82"
            min={0}
            max={27}
            step={0.01}
            value={form.dist_rivers}
            onChange={(v) => set("dist_rivers", v)}
          />

          {/* Dist Roads */}
          <SliderField
            label="Jarak dari Jalan (Dist_Roads)"
            unit="m"
            hint="Rentang: 0.005 – 44.12"
            min={0}
            max={45}
            step={0.01}
            value={form.dist_roads}
            onChange={(v) => set("dist_roads", v)}
          />

          {/* Elevation */}
          <SliderField
            label="Ketinggian (Elevation)"
            unit="mdpl"
            hint="Rentang: 190 – 1919"
            min={190}
            max={1919}
            step={1}
            value={form.elevation}
            onChange={(v) => set("elevation", v)}
          />

          {/* Landuse */}
          <div
            className="rounded-xl p-4 border transition-all hover:shadow-md"
            style={{ background: "#f8fdf9", borderColor: "#c8e6d0" }}
          >
            <label
              className="text-sm font-semibold block mb-3"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#1B4332" }}
            >
              Penggunaan Lahan (Landuse)
            </label>
            <select
              value={form.landuse}
              onChange={(e) => set("landuse", e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                borderColor: "#1B4332",
                color: "#1B4332",
                background: "#ffffff",
              }}
            >
              {landuseOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs mt-2" style={{ color: "#7aab8a", fontFamily: "'DM Sans', sans-serif" }}>
              Berdasarkan dataset ESA WorldCover yang diproses melalui Google Earth Engine.
            </p>
          </div>

          {/* Rainfall */}
          <SliderField
            label="Curah Hujan Rata-rata Harian (Rainfall)"
            unit="mm/hari"
            hint="Rentang: 5.95 – 12.33"
            min={5}
            max={13}
            step={0.01}
            value={form.rainfall}
            onChange={(v) => set("rainfall", v)}
          />

          {/* Slope — full width */}
          <div className="md:col-span-2">
            <SliderField
              label="Kemiringan Lereng (Slope)"
              unit="derajat"
              hint="Rentang: 0 – 30"
              min={0}
              max={30}
              step={0.1}
              value={form.slope}
              onChange={(v) => set("slope", v)}
            />
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            style={{ background: "#1B4332", color: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}
          >
            {loading ? "Memproses Prediksi..." : "Klasifikasikan Kerawanan"}
          </button>
          {error && <p className="text-sm text-center text-red-600 font-medium">❌ {error}</p>}
        </div>
      </div>

      {/* ── Hasil Prediksi ── */}
      {result && result.xgboost && (
        <div id="hasil-prediksi" className="space-y-6" style={{ animation: "fadeInUp 0.4s ease-out" }}>
          <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

          {/* Header kelas */}
          <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden">
            <div className="px-8 py-8 text-center" style={{ background: classColors[result.xgboost.predicted_class] }}>
              <div
                className="text-xs font-semibold tracking-widest uppercase mb-2 opacity-80"
                style={{ color: classTextColors[result.xgboost.predicted_class], fontFamily: "'DM Mono', monospace" }}
              >
                Model Terbaik (XGBoost)
              </div>
              <div
                className="text-5xl font-bold mb-1"
                style={{ fontFamily: "'Playfair Display', serif", color: classTextColors[result.xgboost.predicted_class] }}
              >
                {result.xgboost.predicted_class}
              </div>
              <div
                className="text-sm opacity-80"
                style={{ color: classTextColors[result.xgboost.predicted_class], fontFamily: "'DM Sans', sans-serif" }}
              >
                Tingkat Kerawanan Tanah Longsor Spasial
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Narasi */}
              <div className="p-5 rounded-xl" style={{ background: "#edf4ef" }}>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "#1B4332" }}>Interpretasi Spasial Wilayah</h3>
                <p className="text-sm leading-relaxed text-foreground">{narratives[result.xgboost.predicted_class]}</p>
              </div>

              {/* Confidence */}
              <div className="text-sm font-medium">
                Tingkat Kepercayaan Model Terbaik:{" "}
                <span className="font-bold text-emerald-800">{Math.round(result.xgboost.confidence * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Tabel Perbandingan */}
          <div className="bg-card border border-border rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-base mb-4" style={{ color: "#1B4332" }}>
              Tabel Komparasi Hasil Prediksi Multi-Model
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase font-mono text-muted-foreground">
                    <th className="p-3">Model Machine Learning</th>
                    <th className="p-3">Hasil Klasifikasi</th>
                    <th className="p-3">Tingkat Kepercayaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="bg-emerald-50/40">
                    <td className="p-3 font-semibold">1. XGBoost (Rekomendasi)</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold font-mono"
                        style={{ background: classColors[result.xgboost.predicted_class], color: classTextColors[result.xgboost.predicted_class] }}
                      >
                        {result.xgboost.predicted_class}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{(result.xgboost.confidence * 100).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">2. Random Forest</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold font-mono"
                        style={{ background: classColors[result.rf.predicted_class], color: classTextColors[result.rf.predicted_class] }}
                      >
                        {result.rf.predicted_class}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{(result.rf.confidence * 100).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">3. Support Vector Machine (SVM)</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold font-mono"
                        style={{ background: classColors[result.svm.predicted_class], color: classTextColors[result.svm.predicted_class] }}
                      >
                        {result.svm.predicted_class}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{(result.svm.confidence * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Importance */}
          {result.feature_importance && (
            <div className="bg-card border border-border rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-sm mb-4 text-foreground">
                Matriks Nilai Kontribusi Fitur (Feature Importance - XGBoost)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={result.feature_importance.map((f) => ({
                    name: f.feature,
                    value: Math.round(f.importance * 100),
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 24, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: "DM Mono" }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Bobot Relatif"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {result.feature_importance.map((_, i) => (
                      <Cell key={i} fill="#1B4332" opacity={1 - i * 0.12} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Data Pendukung Komponen Tentang ─────────────────────────────────────────
const steps = [
  { n: "01", title: "Pengumpulan & Ekstraksi Data", desc: "Data kejadian longsor dari BPBD Wonosobo (321 titik, 2015–2025) dan 8 fitur kondisional (elevasi, slope, curvature, TWI, rainfall, dist_roads, dist_rivers, landuse) diekstraksi via Google Earth Engine pada resolusi 30 m." },
  { n: "02", title: "Praproses Data", desc: "Winsorization (IQR 1.5×) untuk outlier, seleksi non-longsor berbasis Mahalanobis Distance, eliminasi TWI via VIF (>10), dan uji Mann-Whitney U untuk validasi signifikansi fitur." },
  { n: "03", title: "Pelatihan & Optimasi Model", desc: "Tiga algoritma (RF, SVM-RBF, XGBoost) dilatih dalam sklearn Pipeline dengan StandardScaler. Hyperparameter dioptimalkan via GridSearchCV (inner 5-fold, metrik F1-weighted), rasio 80:20." },
  { n: "04", title: "Evaluasi & Interpretasi", desc: "Evaluasi menggunakan akurasi, Cohen's Kappa, MCC, AUC-ROC, dan 10-fold stratified CV. Uji McNemar (α=0,05) untuk signifikansi antar model. Analisis SHAP (TreeExplainer) untuk interpretasi fitur." },
];

const datasets = [
  { sumber: "Titik Kejadian Longsor (BPBD Wonosobo)", kelas: "321 titik longsor (presence)", resolusi: "Koordinat titik", tahun: "2015 – 2025" },
  { sumber: "DEM SRTM & Turunannya (GEE)", kelas: "Elevasi, Slope, Curvature, TWI", resolusi: "30 Meter", tahun: "2024 – 2026" },
  { sumber: "CHIRPS (GEE)", kelas: "Rainfall rata-rata harian", resolusi: "~5 km → reproject 30 m", tahun: "2015 – 2025" },
  { sumber: "ESA WorldCover (GEE)", kelas: "Landuse (hutan, pertanian, dll.)", resolusi: "10 Meter → 30 m", tahun: "2025" },
  { sumber: "OpenStreetMap via GEE", kelas: "Dist_Roads, Dist_Rivers", resolusi: "Euclidean distance (m)", tahun: "2024 – 2026" },
];


// ─── Tentang Page ─────────────────────────────────────────────────────────────
export function Tentang() {
  return (
    <div className="py-12 bg-background pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
        <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: "#52B788", fontFamily: "'DM Mono', monospace" }}>
          Dokumentasi Penelitian
        </span>
        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
          Tentang Penelitian
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Kabupaten Wonosobo merupakan salah satu wilayah dengan kerawanan tanah longsor tertinggi di Jawa Tengah. Kondisi topografi berbukit dengan curah hujan tinggi dan aktivitas alih fungsi lahan menjadi faktor utama. Penelitian ini mengembangkan sistem klasifikasi berbasis Machine Learning untuk mendukung deteksi dini dan perencanaan mitigasi bencana.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <h2 className="text-xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
          Alur Metodologi Penelitian
        </h2>
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: "#d8ede3" }} />
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-5 relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 relative z-10"
                  style={{ background: "#1B4332", color: "#ffffff", fontFamily: "'DM Mono', monospace" }}
                >
                  {s.n}
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex-1 shadow-sm">
                  <div className="font-semibold text-sm mb-1" style={{ color: "#0d1f17", fontFamily: "'DM Sans', sans-serif" }}>
                    {s.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
          Dataset Penelitian
        </h2>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: "#1B4332" }}>
              <tr>
                {["Sumber Data", "Sampel per Kelas", "Resolusi Spasial", "Rentang Waktu"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datasets.map((d, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/40"}>
                  <td className="px-5 py-3 font-medium">{d.sumber}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{d.kelas}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{d.resolusi}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{d.tahun}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#1B4332" }}>
          Profil Peneliti
        </h2>
        <div className="bg-card border border-border rounded-2xl shadow-md p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-emerald-800 to-emerald-500">
              <Users size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1" style={{ color: "#0d1f17" }}>Mizana Amaliya</h3>
              <p className="text-sm text-muted-foreground mb-1">Program Studi Teknik Informatika</p>
              <p className="text-sm text-muted-foreground mb-4">Universitas Sains Al-Qur'an (UNSIQ)</p>
              <div className="flex flex-wrap gap-2">
                
              
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/klasifikasi" element={<Klasifikasi />} />
            <Route path="/tentang" element={<Tentang />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}