import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function TripMap({ lat, lng, small = false }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (instanceRef.current) {
      instanceRef.current.remove();
    }
    const map = L.map(mapRef.current).setView([lat, lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.marker([lat, lng]).addTo(map);
    instanceRef.current = map;
    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      className={
        small ? "h-48 w-full rounded-lg z-0" : "h-64 w-full rounded-lg z-0"
      }
    />
  );
}
