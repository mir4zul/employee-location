import { useState } from "react";
import Login from "./page/Login.jsx";
import Attendance from "./page/Attendance.jsx";

import "./App.css";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <Attendance />
  ) : (
    <Login onSuccess={() => setLoggedIn(true)} />
  );
}
