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

  const [step, setStep] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState("WAITING");
  // WAITING | PASS | FAIL | DONE

  const pickChallenge = () =>
    CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];

  const reset = () => {
    setStep(0);
    setStatus("WAITING");
    setChallenge(pickChallenge());
    startX.current = null;
  };

  useEffect(() => {
    setChallenge(pickChallenge());
  }, []);

  useEffect(() => {
    if (!challenge) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length || status !== "WAITING") return;

      const lm = results.multiFaceLandmarks[0];
      const noseX = lm[1].x * 1000;

      if (!startX.current) {
        startX.current = noseX;
        return;
      }

      const pass = (() => {
        if (challenge.key === "TURN_LEFT") return noseX < startX.current - 30;

        if (challenge.key === "TURN_RIGHT") return noseX > startX.current + 30;

        if (challenge.key === "BLINK") return lm[159].y - lm[145].y < 0.01;

        if (challenge.key === "MOUTH") return lm[14].y - lm[13].y > 0.02;

        return false;
      })();

      if (pass) {
        if (step + 1 >= REQUIRED) {
          setStatus("DONE");
          onPass();
        } else {
          setStep((s) => s + 1);
          setChallenge(pickChallenge());
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
      if (status === "WAITING") setStatus("FAIL");
    }, TIME_LIMIT);

    return () => clearTimeout(timeout);
  }, [challenge, step, status]);

  return (
    <div className="flex flex-col items-center space-y-2 border p-3 rounded-lg">
      <video ref={videoRef} autoPlay muted className="rounded-md w-64" />

      {status !== "DONE" && (
        <>
          <p className="font-semibold text-sm">
            Step {step + 1} / {REQUIRED}
          </p>
          <p className="text-sm text-blue-600">{challenge?.text}</p>
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

      {status === "DONE" && (
        <p className="text-green-600 text-sm font-semibold">
          Liveness verified ✅
        </p>
      )}
    </div>
  );
}
