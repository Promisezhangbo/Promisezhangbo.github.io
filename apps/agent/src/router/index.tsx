import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import Home from "../pages/home";

const route = [
  {
    path: "/agent",
    element: <Outlet />,
    children: [
      { index: true, element: <Navigate to='home' replace /> },
      { path: "home", element: <Home /> }
    ]
  }
];

export const router = createBrowserRouter(route);
