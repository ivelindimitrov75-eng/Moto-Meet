import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {window.location.pathname === "/login" ? <Login /> : <App />}
  </StrictMode>,
);
