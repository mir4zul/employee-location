import { useState } from "react";
import Login from "./page/Login.jsx";
import Attendance from "./page/Attendance.jsx";
import LivenessDetector from "./page/Attendance2.jsx";
import LocationTracker from "./components/LocationTracker.jsx";

import "./App.css";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [livenessPass, setLivenessPass] = useState(false);

  // return loggedIn ? (
  //   // <Attendance />
  //   <LocationTracker />
  // ) : (
  //   <Login onSuccess={() => setLoggedIn(true)} />
  // );
  return (
    <>
      <LivenessDetector onPass={() => setLivenessPass(true)} />

      <div>{livenessPass && <p>Liveness Pass</p>}</div>
    </>
  );
}
