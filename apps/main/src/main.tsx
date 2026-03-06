import App from "@/App";
import QiankunProvider from "@/components/QiankunProvider";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Ensure body/html do not have scrollbars; host will provide app-level scrolling
try {
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.overflow = 'hidden';
} catch {
  // ignore when document is not available in some environments
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QiankunProvider>
      <App />
    </QiankunProvider>
  </StrictMode>
);


if (__BUILD_TIME__) {
  console.log(`%c【main】${__BUILD_TIME__}`, 'color: #48a19e; font-size: 18px; font-weight: bold;'); // 调试
}
