"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader, { UploadedImage } from "@/components/ImageUploader";
import GPSCapture, { GeoData } from "@/components/GPSCapture";
import MetadataForm from "@/components/MetadataForm";
import { ShoppingBag, MapPin, FileText, CheckCircle, Loader2, ChevronRight, ChevronLeft, Zap } from "lucide-react";
import clsx from "clsx";

const STEPS = [
  { id: 1, label: "Shop Photos", icon: ShoppingBag },
  { id: 2, label: "GPS Location", icon: MapPin },
  { id: 3, label: "Shop Details", icon: FileText },
  { id: 4, label: "Analyze", icon: Zap },
];

const LOADING_STEPS = [
  "Analyzing shop images with Gemini AI…",
  "Checking location & competition signals…",
  "Calculating cash flow estimate…",
];

export default function WizardPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [shopSize, setShopSize] = useState("");
  const [rent, setRent] = useState("");
  const [yearsOp, setYearsOp] = useState("");

  // Loading state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canNext = () => {
    if (step === 1) return images.length >= 3;
    if (step === 2) return geoData !== null;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else void handleAnalyze();
  };

  const handleAnalyze = async () => {
    if (!geoData) return;
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      const form = new FormData();
      images.forEach((img) => form.append("images", img.file));
      form.append("lat", String(geoData.lat));
      form.append("lon", String(geoData.lon));
      if (shopSize) form.append("shop_size", shopSize);
      if (rent) form.append("rent", rent);
      if (yearsOp) form.append("years_operating", yearsOp);

      // Simulate progress steps
      const interval = setInterval(() => {
        setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
      }, 2500);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        body: form,
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error("AI service is busy. Please try again in a moment.");
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const result = await res.json();
      // Store in sessionStorage for results page
      sessionStorage.setItem("kirana_result", JSON.stringify(result));
      router.push("/results");
    } catch (e: any) {
      setError(e.message || "Analysis failed. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="glass-card p-10 max-w-sm w-full text-center space-y-8">
          {/* Spinner */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-saffron-500/20 animate-pulse-slow" />
            <div className="absolute inset-0 rounded-full border-4 border-t-saffron-500 animate-spin" />
            <ShoppingBag className="absolute inset-0 m-auto text-saffron-400" size={28} />
          </div>

          {/* Loading text */}
          <div className="space-y-3">
            {LOADING_STEPS.map((text, i) => (
              <div
                key={i}
                className={clsx(
                  "flex items-center gap-3 text-sm transition-all duration-500",
                  i < loadingStep
                    ? "text-green-400"
                    : i === loadingStep
                    ? "text-white"
                    : "text-white/20"
                )}
              >
                {i < loadingStep ? (
                  <CheckCircle size={16} className="shrink-0" />
                ) : i === loadingStep ? (
                  <Loader2 size={16} className="shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                )}
                {text}
              </div>
            ))}
          </div>

          <p className="text-xs text-white/30">This may take 10–30 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── HEADER ── */}
      <header className="border-b border-white/10 bg-dark-800/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-saffron-500 flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">Kirana Cash Flow AI</h1>
              <p className="text-xs text-white/40">Remote Underwriting Tool</p>
            </div>
          </div>
          <span className="text-xs text-white/30 hidden sm:block">
            Powered by Gemini 2.0 Flash
          </span>
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div className="bg-dark-800/60 border-b border-white/5 sticky top-[65px] z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={clsx(
                    "step-dot shrink-0",
                    step > s.id && "step-dot-done",
                    step === s.id && "step-dot-active",
                    step < s.id && "step-dot-pending"
                  )}
                >
                  {step > s.id ? <CheckCircle size={14} /> : s.id}
                </div>
                <span
                  className={clsx(
                    "text-xs font-medium hidden sm:block truncate",
                    step === s.id ? "text-saffron-400" : "text-white/30"
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={clsx(
                      "h-0.5 flex-1 rounded transition-colors duration-500",
                      step > s.id ? "bg-saffron-500/60" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WIZARD CONTENT ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="glass-card p-6 animate-fade-in">
          {/* Step header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              {step === 1 && "Upload Shop Photos"}
              {step === 2 && "Capture GPS Location"}
              {step === 3 && "Optional Shop Details"}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              {step === 1 &&
                "Upload 3–5 clear photos of the kirana store. Better photos = higher confidence."}
              {step === 2 &&
                "Your GPS location is used to detect nearby competition and footfall."}
              {step === 3 &&
                "Providing these details improves the confidence score. You can skip."}
            </p>
          </div>

          {/* Step content */}
          {step === 1 && (
            <ImageUploader images={images} onChange={setImages} />
          )}

          {step === 2 && (
            <GPSCapture geoData={geoData} onChange={setGeoData} />
          )}

          {step === 3 && (
            <MetadataForm
              shopSize={shopSize}
              rent={rent}
              yearsOp={yearsOp}
              onChange={(field, val) => {
                if (field === "shopSize") setShopSize(val);
                if (field === "rent") setRent(val);
                if (field === "yearsOp") setYearsOp(val);
              }}
            />
          )}
        </div>

        {/* ── NAVIGATION ── */}
        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext()}
            className={clsx(
              "btn-primary flex items-center gap-2 flex-1 justify-center",
              step === 3 && "bg-green-600 hover:bg-green-700"
            )}
          >
            {step === 3 ? (
              <>
                <Zap size={18} />
                Analyze Now
              </>
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {/* Skip for metadata step */}
          {step === 3 && (
            <button
              type="button"
              onClick={handleAnalyze}
              className="btn-secondary text-sm"
            >
              Skip & Analyze
            </button>
          )}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="text-center text-xs text-white/20 py-4 border-t border-white/5">
        Kirana Cash Flow AI — For NBFC internal use · AI estimates are advisory only
      </footer>
    </div>
  );
}
