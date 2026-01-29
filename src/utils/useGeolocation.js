import { useEffect, useState } from "react";

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [dms, setDms] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const toDMS = (deg, type) => {
    const d = Math.floor(Math.abs(deg));
    const minFloat = (Math.abs(deg) - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(1);
    const dir = type === "lat" ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${d}°${m}'${s}"${dir}`;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        setLocation(loc);
        setDms({
          latitude: toDMS(loc.latitude, "lat"),
          longitude: toDMS(loc.longitude, "lon"),
        });
        setLoading(false);
      },
      (err) => {
        console.warn("Geolocation failed:", err.message);
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  return { location, dms, error, loading };
}
