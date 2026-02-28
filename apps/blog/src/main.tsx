import React from "react";
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
      <App />
    </React.StrictMode>
  );
}

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render({});
} else {
  renderWithQiankun({
    bootstrap: async () => {},
    mount: async props => {
      console.log("【blog】挂载完成");
      render(props);
      props.setGlobalState({ appLoading: false });
    },
    unmount: async props => {
      console.log("【blog】卸载完成");
      if (root) {
        root.unmount();
        root = null;
      }
    },
    update: async props => {
      console.log("【blog】更新完成");
    }
  });
}
