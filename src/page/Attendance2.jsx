import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const CHALLENGES = [
  { key: "BLINK", text: "Blink your eyes" },
  { key: "TURN_LEFT", text: "Turn your head LEFT" },
  { key: "TURN_RIGHT", text: "Turn your head RIGHT" },
  { key: "MOUTH", text: "Open your mouth" },
];

const REQUIRED = 4;
const TIME_LIMIT = 5000;

export default function LivenessDetector({ onPass }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const faceMeshRef = useRef(null);
  const startX = useRef(null);
  const timeoutRef = useRef(null);

  const [count, setCount] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState("RUNNING"); // RUNNING | FAIL | PASS

  const randomChallenge = () =>
    CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

  const reset = () => {
    setCount(0);
    setStatus("RUNNING");
    setChallenge(randomChallenge());
    startX.current = null;

    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Restart timeout for new run
    timeoutRef.current = setTimeout(() => {
      if (status === "RUNNING") setStatus("FAIL");
    }, TIME_LIMIT);
  };

  // Initialize FaceMesh and Camera ONCE
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

      const lm = res.multiFaceLandmarks[0];
      const noseX = lm[1].x * 1000;

      if (!startX.current) startX.current = noseX;

      let passed = false;
      if (challenge?.key === "TURN_LEFT") passed = noseX < startX.current - 30;
      if (challenge?.key === "TURN_RIGHT") passed = noseX > startX.current + 30;
      if (challenge?.key === "BLINK") passed = lm[159].y - lm[145].y < 0.01;
      if (challenge?.key === "MOUTH") passed = lm[14].y - lm[13].y > 0.02;

      if (passed) {
        if (count + 1 === REQUIRED) {
          setStatus("PASS");
          onPass();
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        } else {
          setCount((c) => c + 1);
          setChallenge(randomChallenge());
          startX.current = null;
        }
      }
    });

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMeshRef.current.send({ image: videoRef.current });
      },
      width: 320,
      height: 240,
    });

    cameraRef.current.start();

    // Initial timeout
    timeoutRef.current = setTimeout(() => {
      if (status === "RUNNING") setStatus("FAIL");
    }, TIME_LIMIT);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Reset timeout on challenge change
  useEffect(() => {
    if (status !== "RUNNING") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (status === "RUNNING") setStatus("FAIL");
    }, TIME_LIMIT);
  }, [challenge]);

  return (
    <div className="flex flex-col items-center space-y-2 border p-3 rounded-lg">
      <video ref={videoRef} autoPlay muted className="rounded-md w-64" />

      {status === "RUNNING" && (
        <>
          <p className="text-sm font-semibold">
            Step {count + 1} / {REQUIRED}
          </p>
          <p className="text-blue-600 text-sm">{challenge?.text}</p>
        </>
      )}

      {status === "FAIL" && (
        <>
          <p className="text-red-600 text-sm">Verification failed ❌</p>
          <button
            onClick={reset}
            className="px-3 py-1 text-sm rounded bg-gray-200"
          >
            Retry
          </button>
        </>
      )}

      {status === "PASS" && (
        <p className="text-green-600 text-sm font-semibold">
          Liveness verified ✅
        </p>
      )}
    </div>
  );
}
