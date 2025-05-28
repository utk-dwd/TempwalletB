// // vite.config.ts
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: { port: 5173 },
//   esbuild: {
//     include: /\.(ts|tsx)$/,
//     exclude: /node_modules/,
//   },
//   define: {
//     // Polyfill process.env for Biconomy SDK
//     'process.env': {
//       BICONOMY_SDK_DEBUG: 'import.meta.env.VITE_BICONOMY_SDK_DEBUG',
//       REACT_APP_BICONOMY_SDK_DEBUG: 'import.meta.env.VITE_BICONOMY_SDK_DEBUG',
//     },
//   },
// });

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
    },
  },
  server: { port: 5173 },
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
