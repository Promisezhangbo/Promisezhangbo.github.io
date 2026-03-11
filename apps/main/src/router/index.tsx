import Layouts from "@/layouts";
import Home from "@/pages/home";
import { createBrowserRouter, Navigate } from "react-router-dom";
const route = [
  {
    path: "/",
    element: <Layouts />,
    children: [
      { index: true, element: <Navigate to='home' replace /> },
      { path: "home", element: <Home /> },
      // 自动匹配子应用路由 (e.g. /agent, /blog, /login)
      { path: ":appName/*", element: <div /> },
    ]
  }
];
export const router = createBrowserRouter(route);
