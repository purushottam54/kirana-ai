"use client";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

interface Props {
  lat: number;
  lon: number;
  competitors?: Array<{ lat: number; lon: number }>;
}

export default function StoreMap({ lat, lon, competitors = [] }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-saffron-500 shadow shadow-saffron-500/50" />
          <span className="text-white/60">Your Store</span>
        </div>
        {competitors.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow shadow-red-500/50" />
            <span className="text-white/60">{competitors.length} Competitor(s) within 300m</span>
          </div>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden border border-white/10 h-64">
        <LeafletMap lat={lat} lon={lon} competitors={competitors} />
      </div>
      <p className="text-xs text-white/30">
        Dashed circle = 300m catchment radius · Map: © OpenStreetMap contributors
      </p>
    </div>
  );
}
