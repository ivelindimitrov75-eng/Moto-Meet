import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Events from "./Events.jsx";
import Login from "./Login.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {window.location.pathname === "/login" ? (
      <Login />
    ) : window.location.pathname === "/events" ? (
      <Events />
    ) : (
      <App />
    )}
  </StrictMode>,
);
