import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import employee from "../assets/Miraz.jpg";

const EMPLOYEE_IMAGE_URL = employee;

export default function LivenessDetector({ onPass }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const faceMeshRef = useRef(null);

  const eyeBaselineRef = useRef(null);
  const blinkedRef = useRef(false);

  const [status, setStatus] = useState("RUNNING");
  const [capturedImage, setCapturedImage] = useState(null);

  /* -----------------------------
     Capture photo
  ------------------------------*/
  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    setCapturedImage(canvas.toDataURL("image/jpeg"));
    cameraRef.current?.stop();
  };

  /* -----------------------------
     Init FaceMesh
  ------------------------------*/
  useEffect(() => {
    faceMeshRef.current = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMeshRef.current.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
    });

    faceMeshRef.current.onResults((res) => {
      if (!res.multiFaceLandmarks?.length) return;
      if (status !== "RUNNING") return;
      if (blinkedRef.current) return;

      const lm = res.multiFaceLandmarks[0];

      // 👁 Both eyes openness
      const leftEye = Math.abs(lm[159].y - lm[145].y);
      const rightEye = Math.abs(lm[386].y - lm[374].y);

      const eyeOpenValue = (leftEye + rightEye) / 2;

      // 1️⃣ Set baseline (first few frames)
      if (!eyeBaselineRef.current) {
        eyeBaselineRef.current = eyeOpenValue;
        return;
      }

      const baseline = eyeBaselineRef.current;

      // 2️⃣ Blink = 40% drop from baseline
      if (eyeOpenValue < baseline * 0.6) {
        blinkedRef.current = true;

        setStatus("LIVENESS_PASS");
        capturePhoto();
      }
    });

    cameraRef.current = new Camera(videoRef.current, {
      width: 320,
      height: 240,
      onFrame: async () => {
        await faceMeshRef.current.send({ image: videoRef.current });
      },
    });

    cameraRef.current.start();

    return () => cameraRef.current?.stop();
  }, []);

  /* -----------------------------
     Face comparison
  ------------------------------*/
  useEffect(() => {
    if (status !== "LIVENESS_PASS" || !capturedImage) return;

    setStatus("MATCHING");

    fetch("/api/face-compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liveImage: capturedImage,
        employeeImage: EMPLOYEE_IMAGE_URL,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.match) {
          setStatus("VERIFIED");
          onPass?.();
        } else {
          setStatus("FAIL");
        }
      })
      .catch(() => setStatus("FAIL"));
  }, [status, capturedImage]);

  /* -----------------------------
     Retry
  ------------------------------*/
  const retry = () => {
    blinkedRef.current = false;
    eyeBaselineRef.current = null;
    setCapturedImage(null);
    setStatus("RUNNING");
    cameraRef.current?.start();
  };

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="flex flex-col items-center space-y-3 border p-4 rounded-lg">
      {status === "RUNNING" && (
        <>
          <video ref={videoRef} autoPlay muted className="w-64 rounded" />
          <p className="text-blue-600 text-sm font-semibold">
            👁 Please blink your eyes
          </p>
        </>
      )}

      {status === "MATCHING" && (
        <p className="text-blue-600 text-sm">
          🔍 Verifying employee identity...
        </p>
      )}

      {status === "VERIFIED" && (
        <p className="text-green-600 font-semibold">
          ✅ Verification completed successfully
        </p>
      )}

      {status === "FAIL" && (
        <>
          <p className="text-red-600 text-sm">❌ Verification failed</p>
          <button
            onClick={retry}
            className="px-3 py-1 text-sm rounded bg-gray-200"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
}
