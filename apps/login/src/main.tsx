import React from "react";
import 'antd/dist/reset.css';
import { createRoot, type Root } from "react-dom/client";
import { qiankunWindow, renderWithQiankun } from "vite-plugin-qiankun/dist/helper";
import App from "./App.tsx";

let root: Root | null = null;

function render(props: { container?: HTMLElement }) {
  const { container } = props ?? {};
  const rootContainer = container?.querySelector("#root") || document.getElementById("root");

  if (!rootContainer) return;
  if (!root) {
    root = createRoot(rootContainer);
  }

  // 复用 root 实例调用 render 方法
  root.render(
    <React.StrictMode>
      <div id="app-root" style={{ height: '100vh', overflow: 'auto' }}>
        <App />
      </div>
    </React.StrictMode>
  );
}

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  // When running standalone, prevent body/html scrolling and use app-level scroll
  try {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
  } catch (err) { void err; }

  render({});
} else {
  renderWithQiankun({
    bootstrap: async () => { },
    mount: async (props) => {
      render(props);
      if (__BUILD_TIME__) {
        console.log(`%c【login】${__BUILD_TIME__}`, 'color: #48a19e; font-size: 18px; font-weight: bold;'); // 调试
      }
    },
    unmount: async () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
    update: async () => { }
  });
}

