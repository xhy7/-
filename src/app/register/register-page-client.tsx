"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterForm, authGateway, saveSession, clearSession } from "@/features/auth";
import type { AuthError } from "@/shared/contracts/home";

export function RegisterPageClient() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<string>("");

  const handleRegister = async (credentials: {
    username: string;
    password: string;
    email?: string;
    remember?: boolean;
  }) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await authGateway.register(credentials);
      
      saveSession(response.session, response.token, credentials.remember);
      
      // 显示欢迎动画
      setWelcomeUser(response.session.displayName);
      setShowWelcome(true);
      
      // 延迟跳转，让用户看到欢迎动画
      await new Promise(resolve => setTimeout(resolve, 2000));
      await router.push("/");
    } catch (err) {
      if (isAuthError(err)) {
        setError(err.message);
      } else {
        setError("网络异常，请稍后重试");
      }
      clearSession();
    } finally {
      setIsPending(false);
    }
  };

  const isAuthError = (err: unknown): err is AuthError => {
    return typeof err === 'object' && err !== null && 'message' in err;
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <header className="auth-header">
          <Link href="/">
            <h1 className="display-title">老祖宗养成计划</h1>
          </Link>
          <p className="auth-subtitle">开启与千古风流人物的对话</p>
        </header>

        <div className="auth-card section-shell">
          <h2 className="auth-title">展开新卷轴</h2>
          
          <RegisterForm
            onSubmit={handleRegister}
            isPending={isPending}
            error={error}
          />
          
          <div className="auth-footer-links">
            <span style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>
              已有账号？
            </span>
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="auth-footer-link-button"
            >
              收起卷轴
            </button>
          </div>
        </div>

        <footer className="auth-page-footer">
          <p>© 2026 老祖宗养成计划 · 卷一 · 东坡试炼季</p>
        </footer>
      </div>

      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-animation">
            <div className="welcome-icon">🎊</div>
            <div className="welcome-message">
              <h2>欢迎加入，{welcomeUser}！</h2>
              <p className="welcome-subtitle">开启与古人的对话之旅吧</p>
              <div className="welcome-loading">正在展开卷轴</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
