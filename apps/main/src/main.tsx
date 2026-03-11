import App from "@/App";
import { createRoot } from "react-dom/client";
import "./app.css";
createRoot(document.getElementById("root")!).render(
  <App />
);
if (__BUILD_TIME__) {
  console.log(`%c【main】${__BUILD_TIME__}`, 'color: #48a19e; font-size: 18px; font-weight: bold;'); // 调试
}
