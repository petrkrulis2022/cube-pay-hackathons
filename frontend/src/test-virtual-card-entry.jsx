import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
import VirtualCardTest from "./pages/VirtualCardTest";

// Make Buffer available globally for dependencies that need it
window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VirtualCardTest />
  </React.StrictMode>
);
