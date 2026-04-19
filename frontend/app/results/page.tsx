"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultDashboard from "@/components/ResultDashboard";
import { ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kirana_result");
      if (!raw) {
        setError(true);
        return;
      }
      setResult(JSON.parse(raw));
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/50 mb-4">No analysis result found.</p>
        <Link href="/" className="btn-primary flex items-center gap-2 w-fit">
          <ArrowLeft size={16} /> Start New Analysis
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-saffron-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-800/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-saffron-500 flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">Analysis Result</h1>
              <p className="text-xs text-white/40">Kirana Cash Flow AI</p>
            </div>
          </div>
          <Link
            href="/"
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
          >
            <ArrowLeft size={14} /> New Analysis
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <ResultDashboard result={result} />
      </main>

      <footer className="text-center text-xs text-white/20 py-4 border-t border-white/5">
        AI estimates are advisory only · Not a guarantee of creditworthiness
      </footer>
    </div>
  );
}
