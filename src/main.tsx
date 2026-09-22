import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// @tanstack/react-query 는 스캐폴드에 미리 설치돼 있어 앱이 곧바로 useQuery 를 쓴다.
// Provider 가 없으면 첫 렌더에서 "No QueryClient set" 으로 앱 전체가 깨지는데, 런타임
// 컨텍스트라 tsc·vite build 어디에도 걸리지 않는다 — 스캐폴드에서 미리 배선한다 (#21875).
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
