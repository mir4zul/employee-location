import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import des from "./assets/descriptor.json";

export default function FaceAuth({ userId }) {
  const videoRef = useRef(null);
  const eyeClosedRef = useRef(false);

  const [status, setStatus] = useState("Loading models...");
  const [blinked, setBlinked] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  /* =======================
     LOAD MODELS FROM CDN
  ======================= */
  useEffect(() => {
    const loadModels = async () => {
      try {
        // CDN models for face-api.js v0.22.2
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";

        console.log("Loading models from CDN:", MODEL_URL);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("Models loaded from CDN");
        setModelsLoaded(true);
        setStatus("Starting camera...");
        startCamera();
      } catch (err) {
        console.error("Model loading failed:", err);
        setStatus("Model loading failed");
      }
    };

    loadModels();
  }, []);

  /* =======================
     START CAMERA
  ======================= */
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Camera not supported");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();
        setStatus("Camera ready");
      };
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("Camera permission denied");
    }
  };

  /* =======================
     BLINK DETECTION LOGIC
  ======================= */
  const eyeAspectRatio = (eye) => {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const A = dist(eye[1], eye[5]);
    const B = dist(eye[2], eye[4]);
    const C = dist(eye[0], eye[3]);
    return (A + B) / (2.0 * C);
  };

  const detectBlink = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const ear = eyeAspectRatio(leftEye);

    if (ear < 0.2) eyeClosedRef.current = true;

    if (ear > 0.25 && eyeClosedRef.current) {
      setBlinked(true);
      eyeClosedRef.current = false;
    }
  };

  /* =======================
     LIVE FACE TRACKING
  ======================= */
  useEffect(() => {
    if (!modelsLoaded) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5,
          }),
        )
        .withFaceLandmarks();

      if (detection) {
        detectBlink(detection.landmarks);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [modelsLoaded]);

  /* =======================
     CAPTURE FACE DESCRIPTOR
  ======================= */
  const captureFaceDescriptor = async () => {
    const detection = await faceapi
      .detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5,
        }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("Face not detected. Look at the camera.");
      return null;
    }

    return detection.descriptor;
  };

  /* =======================
     REGISTER FACE
  ======================= */
  const registerFace = async () => {
    const descriptor = await captureFaceDescriptor();
    if (!descriptor) return;

    console.log("descriptor", descriptor);

    await fetch("/api/register-face", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        face_descriptor: Array.from(descriptor),
      }),
    });

    alert("✅ Face registered successfully");
  };

  /* =======================
     VERIFY FACE
  ======================= */
  const verifyFace = async () => {
    if (!blinked) {
      alert("❗ Blink your eyes to verify liveness");
      return;
    }

    const liveDescriptor = await captureFaceDescriptor();
    if (!liveDescriptor) return;

    const res = await fetch(`/api/user-face/${userId}`);
    const { face_descriptor } = await res.json();

    const storedDescriptor = new Float32Array(des);
    const distance = faceapi.euclideanDistance(
      liveDescriptor,
      storedDescriptor,
    );

    console.log("distance", distance);

    if (distance < 0.5) {
      alert("✅ Real person verified");
    } else {
      alert("❌ Face does not match");
    }
  };

  /* =======================
     UI
  ======================= */
  return (
    <div style={{ textAlign: "center" }}>
      <h3>{status}</h3>

      <video
        ref={videoRef}
        width="320"
        height="240"
        autoPlay
        muted
        style={{ borderRadius: 10, border: "2px solid #444" }}
      />

      <p>Liveness Blinked: {blinked ? "✅ YES" : "❌ NO"}</p>

      <div style={{ marginTop: 10 }}>
        <button onClick={registerFace}>Register Face</button>
        <button onClick={verifyFace} style={{ marginLeft: 10 }}>
          Verify Face
        </button>
      </div>
    </div>
  );
}
