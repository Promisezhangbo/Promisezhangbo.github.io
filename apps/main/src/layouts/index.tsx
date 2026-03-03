import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

function Layouts() {
  const navigate = useNavigate();
  const location = useLocation();
  // 包含login就不展示main应用
  const isShowMain = !location.pathname.startsWith("/login");

  useEffect(() => {
    // github 部署时在任意页面刷新会报一个404问题，但是不影响实际功能，所以只需要消除这个错误提示即可
    const handleError = (e: ErrorEvent) => {
      // 1. 只拦截 "Not Found" 类型的 404（排除其他 404 子类）
      // 2. 只拦截路由路径（不含 .js/.css/.png 等后缀，避免拦截静态资源）
      // 3. 只拦截子应用路由前缀
      console.log(e, '查看报错问题');

      const isSubAppRoute404 =
        e.message.includes('404 (Not Found)') &&
        (e.filename?.startsWith('/blog/') || e.filename?.startsWith('/agent/'));

      if (isSubAppRoute404) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div>
      {isShowMain && (
        <div id='sub-main-app'>
          <div>
            基座操作22223333
            <div>
              <button onClick={() => navigate("/agent")}>子应用1 Layout</button>
              <button onClick={() => navigate("/blog")}>子应用2 Layout</button>
              <button onClick={() => navigate("/")}>首页 Layout</button>
            </div>
          </div>
          <div>
            <Outlet />
          </div>
        </div>
      )}

      {/* 永远存在的子应用容器，避免路由切换时容器还未渲染导致 qiankun 找不到挂载点 */}
      <div id='sub-app' style={{ minHeight: 200 }}></div>
    </div>
  );
}

export default Layouts;
