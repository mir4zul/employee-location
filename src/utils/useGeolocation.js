import { useEffect, useState } from "react";

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [dms, setDms] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ new

  const toDMS = (deg, type) => {
    const d = Math.floor(Math.abs(deg));
    const minFloat = (Math.abs(deg) - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(1);
    const dir = type === "lat" ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${d}°${m}'${s}"${dir}`;
  };

  useEffect(() => {
    function setFallback() {
      const fallback = { latitude: 23.8103, longitude: 90.4125 }; // Dhaka
      setLocation(fallback);
      setDms({
        latitude: toDMS(fallback.latitude, "lat"),
        longitude: toDMS(fallback.longitude, "lon"),
      });
      setLoading(false); // ✅ mark ready
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported by browser");
      setFallback();
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
        setLoading(false); // ✅ mark ready
      },
      (err) => {
        console.warn("Geolocation failed:", err.message);
        setError(err.message);
        setFallback();
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  return { location, dms, error, loading }; // ✅ return loading
}
