//

(function () {
  // main/public/error-handler.js
  // GitHub Pages 404 报错拦截器（独立文件，最早执行）
  // 拦截逻辑：仅忽略子应用路由的 404 假报错
  function handleGhPages404Error(e) {
    // 1. 只拦截 "Not Found" 类型的 404
    // 2. 排除静态资源（.js/.css/.png 等）的 404
    // 3. 只匹配子应用路由前缀
    console.log(e, "看看报错是什么");

    const isSubAppRoute404 =
      e.message?.includes("404 (Not Found)") && (e.filename?.startsWith("/blog/") || e.filename?.startsWith("/agent/"));

    if (isSubAppRoute404) {
      e.preventDefault();
      e.stopPropagation();
      console.log("拦截 GitHub Pages 子应用路由假 404：", e.filename); // 可选：日志提示
    }
  }

  // 注册监听器（DOM 加载前就执行）
  window.addEventListener("error", handleGhPages404Error);

  // 可选：页面卸载时移除监听器（单页应用可省略）
  window.addEventListener("beforeunload", () => {
    window.removeEventListener("error", handleGhPages404Error);
  });
})();
