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
  const startX = useRef(null);

  const [count, setCount] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState("RUNNING");
  // RUNNING | FAIL | PASS

  const randomChallenge = () =>
    CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

  const reset = () => {
    setCount(0);
    setStatus("RUNNING");
    setChallenge(randomChallenge());
    startX.current = null;
  };

  useEffect(() => {
    setChallenge(randomChallenge());
  }, []);

  useEffect(() => {
    if (!challenge || status !== "RUNNING") return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
    });

    faceMesh.onResults((res) => {
      if (!res.multiFaceLandmarks?.length) return;

      const lm = res.multiFaceLandmarks[0];
      const noseX = lm[1].x * 1000;

      if (!startX.current) {
        startX.current = noseX;
        return;
      }

      let passed = false;

      if (challenge.key === "TURN_LEFT") passed = noseX < startX.current - 30;

      if (challenge.key === "TURN_RIGHT") passed = noseX > startX.current + 30;

      if (challenge.key === "BLINK") passed = lm[159].y - lm[145].y < 0.01;

      if (challenge.key === "MOUTH") passed = lm[14].y - lm[13].y > 0.02;

      if (passed) {
        if (count + 1 === REQUIRED) {
          setStatus("PASS");
          onPass();
        } else {
          setCount((c) => c + 1);
          setChallenge(randomChallenge());
          startX.current = null;
        }
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: 320,
      height: 240,
    });

    camera.start();

    const timeout = setTimeout(() => {
      setStatus("FAIL");
    }, TIME_LIMIT);

    return () => clearTimeout(timeout);
  }, [challenge, count, status]);

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
