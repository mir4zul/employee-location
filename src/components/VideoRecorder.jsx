import { useEffect, useRef, useState } from "react";
import { VideoCameraIcon } from "@heroicons/react/24/outline";

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const [recording, setRecording] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        mediaRecorder.current = new MediaRecorder(stream);

        mediaRecorder.current.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.current.push(e.data);
        };

        mediaRecorder.current.onstop = () => {
          const blob = new Blob(chunks.current, { type: "video/webm" });
          chunks.current = [];
          onRecorded(blob);
        };

        setTimeout(() => startRecording(), 1000);
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setCameraError(true);
      });
  }, []);

  const startRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.start();
    setRecording(true);

    setTimeout(() => {
      mediaRecorder.current.stop();
      setRecording(false);
    }, 5000);
  };

  return (
    <div className="text-center">
      {cameraError ? (
        <div className="flex flex-col items-center text-red-500">
          <VideoCameraIcon className="h-12 w-12 mb-2" />
          <p>Camera not found. Please connect a webcam and allow access.</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            className="rounded-xl mx-auto w-80"
          />
          {recording && (
            <p className="mt-2 text-blue-600 font-semibold">
              Recording 5 seconds...
            </p>
          )}
        </>
      )}
    </div>
  );
}
