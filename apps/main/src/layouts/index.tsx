import { Outlet, useNavigate } from "react-router-dom";

function Layouts() {
  const navigate = useNavigate();

  // 父应用子作为基座，不做子应用渲染

  // useEffect(() => {
  //   if (location.pathname === '/') {
  //     navigate('/agent')
  //   }
  // }, [location])
  return (
    <div>
      <div>
        基座操作
        <div>
          <button onClick={() => navigate("/agent")}>子应用1 Layout</button>
          <button onClick={() => navigate("/blog")}>子应用2 Layout</button>
          <button onClick={() => navigate("/")}>首页 Layout</button>
        </div>
      </div>
      <div>
        <Outlet />
      </div>

      {/* 永远存在的子应用容器，避免路由切换时容器还未渲染导致 qiankun 找不到挂载点 */}
      <div id='sub-app' style={{ minHeight: 200 }}></div>
    </div>
  );
}

export default Layouts;
