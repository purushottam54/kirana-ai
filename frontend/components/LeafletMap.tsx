"use client";
import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lon: number;
  competitors?: Array<{ lat: number; lon: number }>;
  zoom?: number;
}

export default function LeafletMap({ lat, lon, competitors = [], zoom = 15 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    (async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      // Remove previous map instance
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current).setView([lat, lon], zoom);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Store pin — saffron colored
      const storeIcon = L.divIcon({
        html: `<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(255,107,53,0.6)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: "",
      });
      L.marker([lat, lon], { icon: storeIcon })
        .addTo(map)
        .bindPopup("🏪 Kirana Store")
        .openPopup();

      // Competitor pins — red
      competitors.forEach((c, i) => {
        const compIcon = L.divIcon({
          html: `<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(239,68,68,0.5)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          className: "",
        });
        L.marker([c.lat, c.lon], { icon: compIcon })
          .addTo(map)
          .bindPopup(`🏬 Competitor ${i + 1}`);
      });

      // Circle showing 300m radius
      L.circle([lat, lon], {
        radius: 300,
        color: "#FF6B35",
        fillColor: "#FF6B35",
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: "4 4",
      }).addTo(map);
    })();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lon, competitors, zoom]);

  return <div ref={mapRef} className="w-full h-full" />;
}
