import { MapPinIcon } from "@heroicons/react/24/outline";
import { useGeolocation } from "../utils/useGeolocation.js";
import GoogleMapIframe from "../components/GoogleMapIframe.jsx";

export default function Attendance() {
  const { location, error, loading } = useGeolocation();
  const ready = !!location && !error && !loading;

  if (loading) {
    return <p className="text-sm text-gray-500">Detecting location…</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
      <h2 className="text-2xl font-bold">Attendance</h2>

      {/* ❌ No fake fallback message */}
      {error && (
        <div className="flex items-center text-red-600 text-sm max-w-md text-center">
          <MapPinIcon className="h-5 w-5 mr-1 shrink-0" />
          Unable to detect location. Please enable location or try another
          network.
        </div>
      )}

      {/* ✅ Only show map if location REALLY exists */}
      {ready && location && (
        <>
          <GoogleMapIframe
            key={`${location.latitude}-${location.longitude}`}
            lat={location.latitude}
            lng={location.longitude}
          />
          <div className="text-sm text-gray-600">
            <p>Lat: {location.latitude}</p>
            <p>Lng: {location.longitude}</p>
          </div>
        </>
      )}

      {/* Optional hint */}
      {!location && (
        <p className="text-xs text-gray-400 text-center max-w-sm">
          Location may fail on desktop, VPN, or restricted networks. Mobile GPS
          works best.
        </p>
      )}
    </div>
  );
}
