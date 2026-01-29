import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import image from "../assets/Miraz.jpg";

const CHALLENGES = [
  { key: "BLINK", text: "Blink your eyes" },
  { key: "TURN_LEFT", text: "Turn your head LEFT" },
  { key: "TURN_RIGHT", text: "Turn your head RIGHT" },
  { key: "MOUTH", text: "Open your mouth" },
];

const REQUIRED = 4;
const TIME_LIMIT = 5000;

// 🔴 replace with real employee image URL
const EMPLOYEE_IMAGE_URL = image;

export default function LivenessDetector({ onPass }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const faceMeshRef = useRef(null);
  const timeoutRef = useRef(null);
  const startX = useRef(null);

  const [challenge, setChallenge] = useState(null);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("RUNNING");
  // RUNNING | LIVENESS_PASS | MATCHING | VERIFIED | FAIL

  const [capturedImage, setCapturedImage] = useState(null);

  const randomChallenge = () =>
    CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

  /* -----------------------------
     Capture photo & stop camera
  ------------------------------*/
  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    const image = canvas.toDataURL("image/jpeg");
    setCapturedImage(image);

    cameraRef.current?.stop();
  };

  /* -----------------------------
     Initialize FaceMesh + Camera
  ------------------------------*/
  useEffect(() => {
    setChallenge(randomChallenge());

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

      const lm = res.multiFaceLandmarks[0];
      const noseX = lm[1].x * 1000;

      if (!startX.current) startX.current = noseX;

      let passed = false;

      if (challenge?.key === "TURN_LEFT") passed = noseX < startX.current - 30;

      if (challenge?.key === "TURN_RIGHT") passed = noseX > startX.current + 30;

      if (challenge?.key === "BLINK") passed = lm[159].y - lm[145].y < 0.01;

      if (challenge?.key === "MOUTH") passed = lm[14].y - lm[13].y > 0.02;

      if (!passed) return;

      // ✔ challenge passed
      if (count + 1 === REQUIRED) {
        setStatus("LIVENESS_PASS");
        capturePhoto();
        clearTimeout(timeoutRef.current);
      } else {
        setCount((c) => c + 1);
        setChallenge(randomChallenge());
        startX.current = null;
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

    timeoutRef.current = setTimeout(() => {
      setStatus("FAIL");
    }, TIME_LIMIT);

    return () => {
      clearTimeout(timeoutRef.current);
      cameraRef.current?.stop();
    };
  }, []);

  /* -----------------------------
     Face comparison (BACKEND)
  ------------------------------*/
  useEffect(() => {
    if (status !== "LIVENESS_PASS" || !capturedImage) return;

    setStatus("MATCHING");

    // ⚠️ Replace with real backend API
    fetch("/api/face-compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liveImage: capturedImage,
        employeeImage: EMPLOYEE_IMAGE_URL,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.match) {
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
    setCount(0);
    setCapturedImage(null);
    setStatus("RUNNING");
    setChallenge(randomChallenge());
    startX.current = null;
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
          <p className="text-sm font-semibold">
            Step {count + 1} / {REQUIRED}
          </p>
          <p className="text-blue-600 text-sm">{challenge?.text}</p>
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
