// (or src/main.jsx if you use Vite)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter
    future={{
      v7_startTransition: true,   // opt‑in → no warning
      v7_relativeSplatPath: true, // opt‑in → no warning
    }}
  >
    <App />
  </BrowserRouter>
);