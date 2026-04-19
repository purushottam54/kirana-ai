"use client";
import { CheckCircle, AlertTriangle, XCircle, ShieldAlert, Download } from "lucide-react";
import ConfidenceGauge from "./ConfidenceGauge";
import StoreMap from "./StoreMap";
import EstimationExplainer from "./EstimationExplainer";
import { formatINRRange, formatINRRangeCompact } from "@/lib/formatINR";

interface AnalysisResult {
  daily_sales_range: [number, number];
  monthly_revenue_range: [number, number];
  monthly_income_range: [number, number];
  confidence_score: number;
  recommendation: string;
  risk_flags: string[];
  vision_signals: Record<string, any>;
  geo_signals: Record<string, any>;
  reasoning: string;
  estimated_at: string;
  _diagnostics?: Record<string, any>;
}

interface Props {
  result: AnalysisResult;
}

const FLAG_LABELS: Record<string, string> = {
  inventory_footfall_mismatch: "High inventory but very low foot traffic nearby",
  possible_inspection_day_restocking: "Signs of inspection-day restocking detected",
  low_image_quality: "Image quality too low for reliable analysis",
  overstocked_high_competition_area: "Overstocked in a highly competitive area",
  estimate_exceeds_typical_kirana_range: "Revenue estimate exceeds typical kirana range",
};

export default function ResultDashboard({ result }: Props) {
  const rec = result.recommendation;

  const recConfig = {
    pre_approve: {
      icon: <CheckCircle size={20} />,
      label: "✓ Pre-Approve",
      cls: "badge-approve",
      bg: "bg-green-500/5 border-green-500/20",
    },
    standard_review: {
      icon: <AlertTriangle size={20} />,
      label: "⚠ Standard Review",
      cls: "badge-review",
      bg: "bg-amber-500/5 border-amber-500/20",
    },
    needs_verification: {
      icon: <XCircle size={20} />,
      label: "✗ Needs Verification",
      cls: "badge-verify",
      bg: "bg-red-500/5 border-red-500/20",
    },
  }[rec] ?? {
    icon: <AlertTriangle size={20} />,
    label: "⚠ Standard Review",
    cls: "badge-review",
    bg: "bg-amber-500/5 border-amber-500/20",
  };

  const downloadPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const saffron: [number, number, number] = [255, 107, 53];
    const dark: [number, number, number] = [26, 26, 46];

    // Header
    doc.setFillColor(...dark);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Kirana Cash Flow AI", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("Remote Underwriting Report", 14, 26);
    doc.text(`Generated: ${new Date(result.estimated_at).toLocaleString("en-IN")}`, 14, 34);

    // Recommendation badge
    doc.setFillColor(...saffron);
    doc.roundedRect(130, 12, 65, 14, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(recConfig.label, 162.5, 20.5, { align: "center" });

    // Metrics section
    let y = 50;
    doc.setTextColor(...dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Estimates", 14, y);
    y += 8;

    const metrics = [
      ["Daily Sales Range", formatINRRange(...result.daily_sales_range)],
      ["Monthly Revenue Range", formatINRRangeCompact(...result.monthly_revenue_range)],
      ["Monthly Income Range", formatINRRangeCompact(...result.monthly_income_range)],
      ["Confidence Score", `${Math.round(result.confidence_score * 100)}%`],
    ];

    metrics.forEach(([label, value]) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(label as string, 14, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(value as string, 100, y);
      y += 8;
    });

    // Risk flags
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text("Risk Flags", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (result.risk_flags.length === 0) {
      doc.setTextColor(0, 180, 0);
      doc.text("✓ No risk flags detected", 14, y);
      y += 8;
    } else {
      result.risk_flags.forEach((flag) => {
        doc.setTextColor(200, 50, 50);
        doc.text(`• ${FLAG_LABELS[flag] || flag}`, 14, y);
        y += 7;
      });
    }

    // Reasoning
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...dark);
    doc.text("AI Reasoning", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(result.reasoning || "N/A", 182);
    doc.text(lines, 14, y);
    y += lines.length * 6 + 6;

    // Location
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text("Location", 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `${result.geo_signals.lat?.toFixed(5)}, ${result.geo_signals.lon?.toFixed(5)}`,
      14,
      y
    );
    y += 6;
    const addrLines = doc.splitTextToSize(result.geo_signals.address || "", 182);
    doc.text(addrLines, 14, y);

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      "This report is generated by AI for NBFC internal use only. Not a guarantee of creditworthiness.",
      14,
      285
    );

    doc.save("kirana-cashflow-report.pdf");
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── TOP METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Daily Sales
          </p>
          <p className="text-2xl font-bold gradient-text leading-tight">
            {formatINRRange(...result.daily_sales_range)}
          </p>
          <p className="text-xs text-white/30">Estimated daily cash in</p>
        </div>

        <div className="metric-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Monthly Revenue
          </p>
          <p className="text-2xl font-bold gradient-text leading-tight">
            {formatINRRangeCompact(...result.monthly_revenue_range)}
          </p>
          <p className="text-xs text-white/30">26 operating days/month</p>
        </div>

        <div className="metric-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Monthly Income
          </p>
          <p className="text-2xl font-bold gradient-text leading-tight">
            {formatINRRangeCompact(...result.monthly_income_range)}
          </p>
          <p className="text-xs text-white/30">Net EBITDA proxy (12–20%)</p>
        </div>
      </div>

      {/* ── CONFIDENCE + RECOMMENDATION ── */}
      <div className={`glass-card p-5 border ${recConfig.bg}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ConfidenceGauge score={result.confidence_score} size={160} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Underwriting Decision</h3>
            <div className={`inline-flex items-center gap-2 ${recConfig.cls} text-sm`}>
              {recConfig.icon}
              {recConfig.label}
            </div>
            <p className="text-sm text-white/50">
              {rec === "pre_approve" &&
                "Strong signals with no fraud flags. Proceed with standard documentation checks."}
              {rec === "standard_review" &&
                "Some uncertainty in signals. Run standard KYC and field verification."}
              {rec === "needs_verification" &&
                "Multiple risk flags raised. Physical inspection is recommended before proceeding."}
            </p>
          </div>
        </div>
      </div>

      {/* ── RISK FLAGS ── */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldAlert size={18} className="text-saffron-400" />
          Risk Flags
        </h3>
        {result.risk_flags.length === 0 ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={16} />
            No flags detected ✓
          </div>
        ) : (
          <ul className="space-y-2">
            {result.risk_flags.map((flag) => (
              <li key={flag} className="flex items-start gap-2 text-sm text-amber-300">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                {FLAG_LABELS[flag] || flag}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── MAP ── */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-3">Store Location & Competition</h3>
        <StoreMap
          lat={result.geo_signals.lat}
          lon={result.geo_signals.lon}
          competitors={[]}
        />
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="glass-card px-3 py-2">
            <p className="text-white/40 text-xs">Competition (300m)</p>
            <p className="font-semibold text-white">{result.geo_signals.competition_density} stores</p>
          </div>
          <div className="glass-card px-3 py-2">
            <p className="text-white/40 text-xs">Footfall Index</p>
            <p className="font-semibold text-white">{result.geo_signals.footfall_proxy_index}/100</p>
          </div>
        </div>
      </div>

      {/* ── EXPLAINABILITY ── */}
      <EstimationExplainer
        visionSignals={result.vision_signals}
        geoSignals={result.geo_signals}
        diagnostics={result._diagnostics}
        reasoning={result.reasoning}
      />

      {/* ── DOWNLOAD ── */}
      <button
        type="button"
        onClick={downloadPDF}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Download size={18} />
        Download Report (PDF)
      </button>

      <p className="text-xs text-center text-white/20">
        Estimated at {new Date(result.estimated_at).toLocaleString("en-IN")} · Powered by Gemini 2.0 Flash
      </p>
    </div>
  );
}
