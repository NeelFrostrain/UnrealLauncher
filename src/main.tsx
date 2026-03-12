import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import LayoutWrapper from "./layout/index.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LayoutWrapper>
      <App   />
    </LayoutWrapper>
  </StrictMode>,
);
