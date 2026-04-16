// vite.config.ts
import { defineConfig } from "file:///D:/Web%20Work/Web%20Work/procaresoft/procaresoftt/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Web%20Work/Web%20Work/procaresoft/procaresoftt/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tsconfigPaths from "file:///D:/Web%20Work/Web%20Work/procaresoft/procaresoftt/node_modules/vite-tsconfig-paths/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React in main vendor chunk
          vendor: ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-heroui": [
            "@heroui/react",
            "@heroui/system",
            "@heroui/theme",
            "@heroui/modal",
            "@heroui/select"
          ],
          "vendor-firebase": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore"
          ],
          "vendor-utils": ["date-fns", "crypto-js", "clsx", "uuid"]
        }
      }
    },
    // Ensure proper minification
    minify: "esbuild",
    // Prevent over-aggressive optimization that might break event handling
    target: "es2020"
  },
  // Critical: Ensure React is properly resolved
  resolve: {
    dedupe: ["react", "react-dom"]
  },
  // Make sure React is available globally in production
  define: {
    "process.env.NODE_ENV": '"production"'
  },
  // Ensure proper event handling in production
  esbuild: {
    keepNames: true,
    legalComments: "none"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxXZWIgV29ya1xcXFxXZWIgV29ya1xcXFxwcm9jYXJlc29mdFxcXFxwcm9jYXJlc29mdHRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFdlYiBXb3JrXFxcXFdlYiBXb3JrXFxcXHByb2NhcmVzb2Z0XFxcXHByb2NhcmVzb2Z0dFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovV2ViJTIwV29yay9XZWIlMjBXb3JrL3Byb2NhcmVzb2Z0L3Byb2NhcmVzb2Z0dC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCB0c2NvbmZpZ1BhdGhzKCldLFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCBSZWFjdCBpbiBtYWluIHZlbmRvciBjaHVua1xuICAgICAgICAgICAgICAgICAgICB2ZW5kb3I6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgICAgICAgICAgICAgICAgICBcInZlbmRvci1yb3V0ZXJcIjogW1wicmVhY3Qtcm91dGVyLWRvbVwiXSxcbiAgICAgICAgICAgICAgICAgICAgXCJ2ZW5kb3ItaGVyb3VpXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQGhlcm91aS9yZWFjdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJAaGVyb3VpL3N5c3RlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJAaGVyb3VpL3RoZW1lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkBoZXJvdWkvbW9kYWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQGhlcm91aS9zZWxlY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgXCJ2ZW5kb3ItZmlyZWJhc2VcIjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJmaXJlYmFzZS9hcHBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZmlyZWJhc2UvYXV0aFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJmaXJlYmFzZS9maXJlc3RvcmVcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgXCJ2ZW5kb3ItdXRpbHNcIjogW1wiZGF0ZS1mbnNcIiwgXCJjcnlwdG8tanNcIiwgXCJjbHN4XCIsIFwidXVpZFwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gRW5zdXJlIHByb3BlciBtaW5pZmljYXRpb25cbiAgICAgICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICAgICAgLy8gUHJldmVudCBvdmVyLWFnZ3Jlc3NpdmUgb3B0aW1pemF0aW9uIHRoYXQgbWlnaHQgYnJlYWsgZXZlbnQgaGFuZGxpbmdcbiAgICAgICAgdGFyZ2V0OiBcImVzMjAyMFwiLFxuICAgIH0sXG4gICAgLy8gQ3JpdGljYWw6IEVuc3VyZSBSZWFjdCBpcyBwcm9wZXJseSByZXNvbHZlZFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICB9LFxuICAgIC8vIE1ha2Ugc3VyZSBSZWFjdCBpcyBhdmFpbGFibGUgZ2xvYmFsbHkgaW4gcHJvZHVjdGlvblxuICAgIGRlZmluZToge1xuICAgICAgICBcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6ICdcInByb2R1Y3Rpb25cIicsXG4gICAgfSxcbiAgICAvLyBFbnN1cmUgcHJvcGVyIGV2ZW50IGhhbmRsaW5nIGluIHByb2R1Y3Rpb25cbiAgICBlc2J1aWxkOiB7XG4gICAgICAgIGtlZXBOYW1lczogdHJ1ZSxcbiAgICAgICAgbGVnYWxDb21tZW50czogXCJub25lXCIsXG4gICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1VSxTQUFTLG9CQUFvQjtBQUNwVyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxtQkFBbUI7QUFFMUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUyxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFBQSxFQUNsQyxPQUFPO0FBQUEsSUFDSCxXQUFXO0FBQUEsSUFDWCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDSixjQUFjO0FBQUE7QUFBQSxVQUVWLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixpQkFBaUIsQ0FBQyxrQkFBa0I7QUFBQSxVQUNwQyxpQkFBaUI7QUFBQSxZQUNiO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0o7QUFBQSxVQUNBLG1CQUFtQjtBQUFBLFlBQ2Y7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0o7QUFBQSxVQUNBLGdCQUFnQixDQUFDLFlBQVksYUFBYSxRQUFRLE1BQU07QUFBQSxRQUM1RDtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUE7QUFBQSxJQUVBLFFBQVE7QUFBQTtBQUFBLElBRVIsUUFBUTtBQUFBLEVBQ1o7QUFBQTtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ0wsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQ2pDO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNKLHdCQUF3QjtBQUFBLEVBQzVCO0FBQUE7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxFQUNuQjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
