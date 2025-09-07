import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/server": path.resolve(__dirname, "./src/server"),
    },
  },
  server: {
    port: 5173,
    // Proxy for backend API calls
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Your NestJS backend URL
        changeOrigin: true, // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, ''), // Removes the /api prefix when forwarding to backend
      },
    },
  },
  esbuild: {
    include: /\.(ts|tsx)$/,
    exclude: /node_modules/,
  },
  define: {
    // Polyfill process.env for Biconomy SDK
    'process.env': {
      BICONOMY_SDK_DEBUG: 'import.meta.env.VITE_BICONOMY_SDK_DEBUG',
      REACT_APP_BICONOMY_SDK_DEBUG: 'import.meta.env.VITE_BICONOMY_SDK_DEBUG',
    },
  },
})