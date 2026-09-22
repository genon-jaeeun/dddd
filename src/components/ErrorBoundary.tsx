import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 최상위 에러 경계 (#1814).
 *
 * 하위 컴포넌트에서 던진 렌더링 오류 하나가 React 트리 전체를 언마운트시켜
 * 흰 화면(백지)으로 이어지는 것을 막는다. 빌드(tsc + vite build)는 통과하지만
 * 런타임에만 발생하는 오류(예: 잘못된 Recharts 축 참조)에 대한 최후 방어선.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // 프리뷰(부모 프레임)에 깨진 사실을 알린다 (#21875). 실패 판정은 서버가 dev server 를
    // HTTP GET 해서 내리는데 vite 는 200 을 주고, 이 경계가 예외를 삼켜 iframe 의 error
    // 이벤트도 뜨지 않는다 — 오류를 아는 지점이 여기뿐이라 직접 알려야 「고쳐줘」가 뜬다.
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "genbuilder:app-error",
          payload: {
            message: error.message,
            stack: error.stack ?? null,
            componentStack: errorInfo.componentStack ?? null,
          },
        },
        "*",
      );
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center"
        >
          <h1 className="text-xl font-semibold text-foreground">문제가 발생했습니다</h1>
          <p className="max-w-md text-muted-foreground">
            페이지를 표시하는 중 오류가 발생했습니다. 새로고침해주세요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
