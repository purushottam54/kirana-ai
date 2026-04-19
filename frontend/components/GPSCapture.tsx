"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";

// Leaflet must be loaded client-side only
const MapComponent = dynamic(() => import("./LeafletMap"), { ssr: false });

export interface GeoData {
  lat: number;
  lon: number;
  address?: string;
}

interface Props {
  geoData: GeoData | null;
  onChange: (data: GeoData | null) => void;
}

export default function GPSCapture({ geoData, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "KiranaCashFlowAI/1.0" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const address = await reverseGeocode(lat, lon);
        onChange({ lat, lon, address });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === 1
            ? "Location permission denied. Please allow or enter manually."
            : "Could not detect GPS. Please enter manually."
        );
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const applyManual = async () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Enter valid latitude (−90 to 90) and longitude (−180 to 180).");
      return;
    }
    setError(null);
    setLoading(true);
    const address = await reverseGeocode(lat, lon);
    onChange({ lat, lon, address });
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Auto-detect button */}
      <button
        type="button"
        onClick={detectLocation}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Navigation size={18} />
        )}
        {loading ? "Detecting location…" : "Use My Current Location"}
      </button>

      {/* Error */}
      {error && (
        <div className="flex gap-2 items-start text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Detected location info */}
      {geoData && (
        <div className="glass-card px-4 py-3 flex items-start gap-3">
          <MapPin size={18} className="text-saffron-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-white/40 mb-0.5">Detected Location</p>
            <p className="text-sm text-white font-medium leading-snug">
              {geoData.address || `${geoData.lat.toFixed(5)}, ${geoData.lon.toFixed(5)}`}
            </p>
            <p className="text-xs text-white/30 mt-1">
              {geoData.lat.toFixed(6)}, {geoData.lon.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {/* Leaflet map preview */}
      {geoData && (
        <div className="rounded-2xl overflow-hidden border border-white/10 h-52">
          <MapComponent lat={geoData.lat} lon={geoData.lon} />
        </div>
      )}

      {/* Manual entry toggle */}
      <button
        type="button"
        className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
        onClick={() => setManual(!manual)}
      >
        {manual ? "Hide manual entry" : "Enter coordinates manually"}
      </button>

      {manual && (
        <div className="glass-card p-4 space-y-3">
          <p className="text-sm text-white/60">Enter GPS coordinates</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 19.0760"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 72.8777"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={applyManual}
            disabled={loading}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            Set Location
          </button>
        </div>
      )}
    </div>
  );
}
