"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface Props {
  visionSignals: Record<string, any>;
  geoSignals: Record<string, any>;
  diagnostics?: Record<string, any>;
  reasoning: string;
}

export default function EstimationExplainer({
  visionSignals,
  geoSignals,
  diagnostics,
  reasoning,
}: Props) {
  const [open, setOpen] = useState(false);

  const Row = ({ label, value, note }: { label: string; value: string | number; note?: string }) => (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white/70">{label}</p>
        {note && <p className="text-xs text-white/30">{note}</p>}
      </div>
      <span className="text-sm font-semibold text-saffron-400 whitespace-nowrap">{value}</span>
    </div>
  );

  const roadTierScore = (tier: string) => {
    const m: Record<string, number> = {
      motorway: 80, trunk: 80, primary: 80,
      secondary: 60, tertiary: 60,
      residential: 35, unclassified: 35,
      service: 20, track: 20, footway: 20,
    };
    return m[tier] ?? 35;
  };

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={18} className="text-saffron-400" />
          <span className="font-semibold text-white">How was this estimated?</span>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-white/40" />
        ) : (
          <ChevronDown size={18} className="text-white/40" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 animate-fade-in">
          {/* Gemini Reasoning */}
          <div className="bg-saffron-500/5 border border-saffron-500/20 rounded-xl p-4">
            <p className="text-xs text-saffron-400 font-semibold mb-2">🤖 Gemini AI Observation</p>
            <p className="text-sm text-white/80 leading-relaxed italic">"{reasoning}"</p>
          </div>

          {/* Vision Signals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Vision Signals (from shop images)
            </h4>
            <div className="space-y-0">
              <Row
                label="Shelf Density Index"
                value={`${visionSignals.shelf_density_index}/100`}
                note="30% weight in composite score"
              />
              <Row
                label="SKU Diversity Score"
                value={`${visionSignals.sku_diversity_score}/100`}
                note="20% weight — variety of product categories"
              />
              <Row
                label="Inventory Tier"
                value={visionSignals.inventory_value_tier?.toUpperCase()}
                note="25% weight via multiplier (0.6×–1.8×)"
              />
              <Row
                label="Store Condition"
                value={visionSignals.store_condition?.toUpperCase()}
              />
              <Row
                label="Counter Activity"
                value={visionSignals.counter_activity_level?.toUpperCase()}
              />
              {(visionSignals.category_mix || []).length > 0 && (
                <Row
                  label="Product Categories Detected"
                  value={(visionSignals.category_mix || []).join(", ")}
                />
              )}
            </div>
          </div>

          {/* Geo Signals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Location Signals (OpenStreetMap)
            </h4>
            <div className="space-y-0">
              <Row
                label="Footfall Proxy Index"
                value={`${geoSignals.footfall_proxy_index}/100`}
                note="15% weight — nearby schools, offices, transport"
              />
              <Row
                label="Catchment Score"
                value={geoSignals.catchment_score?.toFixed(1)}
                note="10% weight — footfall × 0.6 + road tier × 0.4"
              />
              <Row
                label="Competition Nearby (300m)"
                value={`${geoSignals.competition_density} stores`}
                note="Discount factor: max(0.70, 1 − n×0.05)"
              />
              <Row
                label="Road Type"
                value={`${geoSignals.road_tier} (score: ${roadTierScore(geoSignals.road_tier)})`}
              />
            </div>
          </div>

          {/* Model Logic */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              Model Logic
            </h4>
            <div className="bg-white/5 rounded-xl p-4 font-mono text-xs text-white/60 space-y-1 leading-relaxed">
              <p>raw_score = shelf × 0.30 + sku × 0.20 + inv_tier × 0.25</p>
              <p>         + footfall × 0.15 + catchment × 0.10</p>
              {diagnostics && (
                <>
                  <p className="text-saffron-400 mt-1">
                    = {diagnostics.raw_score} (before competition)
                  </p>
                  <p>competition_factor = {diagnostics.competition_factor}</p>
                  <p className="text-green-400">
                    adjusted = {diagnostics.adjusted_score}
                  </p>
                </>
              )}
              <p className="mt-1">daily_low  = adjusted × 1.4 (clamped ₹1.5K–₹80K)</p>
              <p>daily_high = adjusted × 2.8 (clamped ₹3K–₹1.5L)</p>
              <p>monthly_revenue = daily × 26 days</p>
              <p>monthly_income  = revenue × 12–20% (EBITDA margin)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
