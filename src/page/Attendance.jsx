import { useState, useEffect } from "react";
import VideoRecorder from "../components/VideoRecorder.jsx";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useGeolocation } from "../utils/useGeolocation.js";
import GoogleMapIframe from "../components/GoogleMapIframe.jsx";

export default function Attendance() {
  const [videoBlob, setVideoBlob] = useState(null);
  const { location, dms, error, loading } = useGeolocation();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!location) return;

    setReady(false);

    const t = setTimeout(() => setReady(true), 500); // small delay for iframe
    return () => clearTimeout(t);
  }, [location]);

  if (loading) {
    return <p className="text-sm text-gray-500">Detecting location…</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
      <h2 className="text-2xl font-bold">Attendance</h2>

      <VideoRecorder onRecorded={setVideoBlob} />

      {error && (
        <div className="flex items-center text-yellow-600 text-sm">
          <MapPinIcon className="h-5 w-5 mr-1" />
          Location auto-detect failed, using fallback
        </div>
      )}

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

      {videoBlob && ready && (
        <button className="btn-primary mt-4">Submit Attendance</button>
      )}
    </div>
  );
}
