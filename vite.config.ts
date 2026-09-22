import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// 워킹트리가 네트워크 볼륨(NFS)에 있어 다른 클라이언트의 변경에는 inotify 가 발생하지
// 않는다. 폴링으로 감시해야 편집이 프리뷰에 반영된다 (#18835).
// 환경변수는 항상 문자열이라 빈 값이면 ?? 를 통과해 Number("") === 0 이 된다 — 0 은
// 폴링을 쉬지 않고 돌려 CPU 를 태운다. 유한한 양수만 받고 나머지는 기본값으로 떨군다.
const watchInterval = (() => {
  const parsed = Number(process.env.VITE_WATCH_INTERVAL);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
})();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    hmr: false,
    watch: {
      usePolling: true,
      interval: watchInterval,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
