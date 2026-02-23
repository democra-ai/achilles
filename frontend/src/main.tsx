import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Mark <html> for Tauri-specific CSS (transparent titlebar inset)
if ((window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__) {
  document.documentElement.setAttribute("data-tauri", "");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
