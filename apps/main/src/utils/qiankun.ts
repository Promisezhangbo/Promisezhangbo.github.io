import { qiankunState } from "@/utils/qiankunGlobalState";
import { registerMicroApps, start } from "qiankun";

export const apps = [
  {
    name: "agent",
    entry: "//localhost:9001",
    container: "#sub-app",
    activeRule: "/agent",
    props: {}
  },
  {
    name: "blog",
    entry: "//localhost:9002",
    container: "#sub-app",
    activeRule: "/blog",
    props: {}
  },
  {
    name: "login",
    entry: "//localhost:9003",
    container: "#sub-app",
    activeRule: "/login",
    props: {}
  }
];

export function registerAppsFn() {
  registerMicroApps(apps, {
    beforeLoad: async app => {
      qiankunState.globalState.setGlobalState({ loading: true, loadingAppName: app.name });
      console.log("全局加载前", app);
    },
    beforeMount: async app => {
      console.log("全局挂载前");
    },
    afterMount: async app => {
      qiankunState.globalState.setGlobalState({ loading: false, loadingAppName: app.name });
      console.log("全局挂载后", app);
    },
    beforeUnmount: async app => {
      console.log("全局卸载前");
    },
    afterUnmount: async app => {
      console.log("全局卸载后");
    }
  });

  start({
    sandbox: {
      experimentalStyleIsolation: false
    },
    prefetch: false
  });
}
