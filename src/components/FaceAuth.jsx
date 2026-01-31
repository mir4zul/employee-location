import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceAuth({ userId }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Loading models...");
  const [blinked, setBlinked] = useState(false);
  const eyeClosedRef = useRef(false);

  // Load models
  useEffect(() => {
    async function loadModels() {
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      setStatus("Starting camera...");
      startCamera();
    }
    loadModels();
  }, []);

  // Camera
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    setStatus("Camera ready");
  };

  // Eye Aspect Ratio
  const eyeAspectRatio = (eye) => {
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const A = dist(eye[1], eye[5]);
    const B = dist(eye[2], eye[4]);
    const C = dist(eye[0], eye[3]);

    return (A + B) / (2.0 * C);
  };

  // Detect blink
  const detectBlink = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const ear = eyeAspectRatio(leftEye);

    if (ear < 0.2) eyeClosedRef.current = true;
    if (ear > 0.25 && eyeClosedRef.current) {
      setBlinked(true);
      eyeClosedRef.current = false;
    }
  };

  // Capture face descriptor
  const captureFace = async () => {
    const detection = await faceapi
      .detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("Face not detected");
      return null;
    }

    detectBlink(detection.landmarks);
    return detection.descriptor;
  };

  // REGISTER (1st time)
  const registerFace = async () => {
    const descriptor = await captureFace();
    if (!descriptor) return;

    console.log("descriptor", descriptor);

    // await fetch("/api/register-face", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     name: "Test User",
    //     face_descriptor: Array.from(descriptor),
    //   }),
    // });

    alert("Face registered successfully");
  };

  // VERIFY (2nd time)
  const verifyFace = async () => {
    const liveDescriptor = await captureFace();
    if (!liveDescriptor) return;

    if (!blinked) {
      alert("Please blink to prove liveness");
      return;
    }

    const res = await fetch(`/api/user-face/${userId}`);
    const { face_descriptor } = await res.json();

    const stored = new Float32Array(face_descriptor);
    const distance = faceapi.euclideanDistance(liveDescriptor, stored);

    if (distance < 0.5) {
      alert("✅ Real person verified");
    } else {
      alert("❌ Face does not match");
    }
  };

  return (
    <div>
      <h3>{status}</h3>
      <video ref={videoRef} autoPlay muted width="320" />

      <div style={{ marginTop: 10 }}>
        <button onClick={registerFace}>Register Face</button>
        <button onClick={verifyFace}>Verify Face</button>
      </div>

      <p>Blinked: {blinked ? "YES" : "NO"}</p>
    </div>
  );
}
