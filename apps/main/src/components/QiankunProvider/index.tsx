import { registerAppsFn } from "@/utils/qiankun";
import { qiankunState, subscribeGlobalState } from "@/utils/qiankunGlobalState";
import { Spin } from "antd";
import { useEffect, useState, type PropsWithChildren } from "react";

function QiankunProvider(props: PropsWithChildren) {
  const [loading, setLoading] = useState(false);

  console.log(loading, "loading===loading");

  useEffect(() => {
    registerAppsFn();

    subscribeGlobalState(state => {
      setLoading(state.loading);
      // setLoadingAppName(state.loadingAppName);
    });
    console.log("注册apps");

    // return () => unsubscribe;
  }, []);
  return (
    <div>
      <Spin spinning={loading}>{props?.children}</Spin>
    </div>
  );
}

export default QiankunProvider;
