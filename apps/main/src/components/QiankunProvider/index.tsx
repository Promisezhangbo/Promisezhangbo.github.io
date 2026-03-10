import { registerAppsFn } from "@/utils/qiankun";
import { subscribeGlobalState } from "@/utils/qiankunGlobalState";
import { Spin } from "antd";
import { useEffect, useState, type PropsWithChildren } from "react";

function QiankunProvider(props: PropsWithChildren) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    registerAppsFn();
    subscribeGlobalState((state) => {
      setLoading(state.loading);
    });
  }, []);
  return (
    <Spin spinning={loading}>{props?.children}</Spin>
  );
}

export default QiankunProvider;
