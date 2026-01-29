import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const CHALLENGES = [
  { key: "BLINK", text: "Blink your eyes" },
  { key: "TURN_LEFT", text: "Turn your head LEFT" },
  { key: "TURN_RIGHT", text: "Turn your head RIGHT" },
  { key: "SMILE", text: "Smile Please" },
  { key: "OPEN_MOUTH", text: "Open your mouth" },
];

export default function LivenessDetector({ onPass }) {
  const videoRef = useRef(null);
  const [challenge] = useState(
    CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)],
  );
  const [status, setStatus] = useState("WAITING"); // WAITING | PASS | FAIL
  const startX = useRef(null);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) return;

      const landmarks = results.multiFaceLandmarks[0];

      // Nose tip (index 1)
      const noseX = landmarks[1].x * 1000;

      if (!startX.current) {
        startX.current = noseX;
        return;
      }

      if (challenge.key === "TURN_LEFT" && noseX < startX.current - 30) {
        setStatus("PASS");
        onPass();
      }

      if (challenge.key === "TURN_RIGHT" && noseX > startX.current + 30) {
        setStatus("PASS");
        onPass();
      }

      if (challenge.key === "BLINK") {
        const leftEyeOpen = landmarks[159].y - landmarks[145].y;
        if (leftEyeOpen < 0.01) {
          setStatus("PASS");
          onPass();
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
      if (status !== "PASS") setStatus("FAIL");
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-2">
      <video ref={videoRef} autoPlay muted className="rounded-lg" />
      <p className="text-sm font-semibold">{challenge.text}</p>

      {status === "PASS" && (
        <p className="text-green-600 text-sm">Liveness verified ✅</p>
      )}
      {status === "FAIL" && (
        <p className="text-red-600 text-sm">Verification failed ❌</p>
      )}
    </div>
  );
}
