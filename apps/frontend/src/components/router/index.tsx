// src/router/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../../App';

// Alternative router configuration if you prefer using createBrowserRouter
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        path: '/dashboard',
      },
      {
        path: '/blogs',
      },
    ],
  },
]);

// Router provider component
export function AppRouter() {
  return <RouterProvider router={router} />;
}

// Types for route parameters
export interface RouteParams {
  [key: string]: string | undefined;
}

// Navigation helper functions
export const routes = {
  dashboard: '/',
  blogs: '/blogs',
} as const;

export type RouteKey = keyof typeof routes;