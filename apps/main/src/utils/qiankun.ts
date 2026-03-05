import { qiankunState } from '@/utils/qiankunGlobalState';
import { registerMicroApps, start } from 'qiankun';

const isDev = process.env.NODE_ENV === 'development';

export const apps = [
  {
    name: 'agent',
    entry: isDev ? '//localhost:9001' : '/agent/',
    container: '#sub-app',
    activeRule: '/agent',
    props: {},
  },
  {
    name: 'blog',
    entry: isDev ? '//localhost:9002' : '/blog/',
    container: '#sub-app',
    activeRule: '/blog',
    props: {},
  },
  {
    name: 'login',
    entry: isDev ? '//localhost:9003' : '/login/',
    container: '#sub-app',
    activeRule: '/login',
    props: {},
  },
];

export function registerAppsFn() {
  registerMicroApps(apps, {
    beforeLoad: async (app) => {
      console.log('全局加载前', app);
    },
    beforeMount: async (app) => {
      qiankunState.globalState.setGlobalState({ loading: true, loadingAppName: app.name });

      console.log('全局挂载qiankun');
    },
    afterMount: async (app) => {
      setTimeout(() => {
        qiankunState.globalState.setGlobalState({ loading: false, loadingAppName: app.name });
      }, 1000);
      console.log('全局挂载后', app, qiankunState.globalState);
    },
    beforeUnmount: async () => {},
    afterUnmount: async () => {},
  });

  start({
    sandbox: {
      experimentalStyleIsolation: false,
    },
    prefetch: false,
  });
}
