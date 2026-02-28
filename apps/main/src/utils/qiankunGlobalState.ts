import { initGlobalState } from "qiankun";

// 创建全局状态容器
const globalState = initGlobalState({
  loading: false,
  loadingAppName: ""
});
// 暴露订阅方法
export const subscribeGlobalState = callback => {
  return globalState.onGlobalStateChange(callback);
};

export const qiankunState = {
  globalState
};
