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
    name: "singin",
    entry: "//localhost:9003",
    container: "#sub-app",
    activeRule: "/singin",
    props: {}
  }
];

export function registerAppsFn() {
  registerMicroApps(apps, {
    beforeLoad: async app => {
      console.log("加载前", app);
    },
    beforeMount: async app => {
      console.log("挂载前", app);
    },
    afterMount: async app => {
      console.log("挂载后", app);
    },
    beforeUnmount: async app => {
      console.log("卸载前", app);
    },
    afterUnmount: async app => {
      console.log("卸载后", app);
    }
  });

  start({
    sandbox: {
      experimentalStyleIsolation: false
    },
    prefetch: false
  });
}
