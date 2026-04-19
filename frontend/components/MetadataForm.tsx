"use client";
import { IndianRupee, Calendar, Maximize2 } from "lucide-react";

interface Props {
  shopSize: string;
  rent: string;
  yearsOp: string;
  onChange: (field: "shopSize" | "rent" | "yearsOp", value: string) => void;
}

export default function MetadataForm({ shopSize, rent, yearsOp, onChange }: Props) {
  const filled = [shopSize, rent, yearsOp].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="text-sm text-white/50 glass-card px-4 py-3 rounded-xl">
        These fields are optional but improve the confidence score. Providing all 3
        can add up to <span className="text-saffron-400 font-semibold">+15%</span> to
        confidence.{" "}
        <span className="text-white/70">
          ({filled}/3 filled)
        </span>
      </div>

      {/* Shop size */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <Maximize2 size={15} className="text-saffron-400" />
          Shop Size (sq ft)
        </label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 200"
          value={shopSize}
          onChange={(e) => onChange("shopSize", e.target.value)}
          className="form-input"
        />
        <p className="text-xs text-white/30 mt-1">
          Typical kirana: 100–400 sq ft
        </p>
      </div>

      {/* Monthly rent */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <IndianRupee size={15} className="text-saffron-400" />
          Monthly Rent (₹)
        </label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 8000"
          value={rent}
          onChange={(e) => onChange("rent", e.target.value)}
          className="form-input"
        />
        <p className="text-xs text-white/30 mt-1">
          Used to cross-validate income estimate
        </p>
      </div>

      {/* Years in operation */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <Calendar size={15} className="text-saffron-400" />
          Years in Operation
        </label>
        <input
          type="number"
          min="0"
          max="50"
          step="0.5"
          placeholder="e.g. 5"
          value={yearsOp}
          onChange={(e) => onChange("yearsOp", e.target.value)}
          className="form-input"
        />
        <p className="text-xs text-white/30 mt-1">
          Older stores earn a tenure trust bonus
        </p>
      </div>
    </div>
  );
}
