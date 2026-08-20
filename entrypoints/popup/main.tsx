import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "@/assets/global.css";
import "./style.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
