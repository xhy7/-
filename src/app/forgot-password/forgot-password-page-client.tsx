"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ForgotPasswordForm, authGateway } from "@/features/auth";
import type { AuthError } from "@/shared/contracts/home";

type ResetStep = "email" | "verify" | "reset" | "success";

export function ForgotPasswordPageClient() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<ResetStep>("email");

  const handleSubmit = async (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await authGateway.confirmPasswordReset({
        email: data.email,
        code: data.code,
        newPassword: data.newPassword,
      });

      if (response.success) {
        setStep("success");
      }
    } catch (err) {
      if (isAuthError(err)) {
        setError(err.message);
      } else {
        setError("网络异常，请稍后重试");
      }
    } finally {
      setIsPending(false);
    }
  };

  const isAuthError = (err: unknown): err is AuthError => {
    return typeof err === 'object' && err !== null && 'message' in err;
  };

  const handleStepChange = (newStep: "email" | "verify" | "reset") => {
    if (newStep === "verify") {
      handleSendVerificationCode();
    } else {
      setStep(newStep);
    }
  };

  const handleSendVerificationCode = async () => {
    setIsPending(true);
    setError(null);
    try {
      await authGateway.requestPasswordReset({ email });
      setStep("verify");
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setIsPending(false);
    }
  };

  if (step === "success") {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card section-shell">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-title">密语重置成功</h2>
            <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>
              请使用新密语重新登录
            </p>
            <Link href="/login" className="auth-button">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <header className="auth-header">
          <Link href="/">
            <h1 className="display-title">老祖宗养成计划</h1>
          </Link>
          <p className="auth-subtitle">重置遗忘的密语</p>
        </header>

        <div className="auth-card section-shell">
          <h2 className="auth-title">
            {step === "email" && "飞鸽传书"}
            {step === "verify" && "验证身份"}
            {step === "reset" && "重置密语"}
          </h2>
          
          <div className="auth-steps">
            <div className={`auth-step ${step === "email" ? "active" : step === "verify" || step === "reset" ? "completed" : ""}`}>
              <span className="auth-step-number">1</span>
              <span className="auth-step-label">飞鸽地址</span>
            </div>
            <div className="auth-step-connector"></div>
            <div className={`auth-step ${step === "verify" ? "active" : step === "reset" ? "completed" : ""}`}>
              <span className="auth-step-number">2</span>
              <span className="auth-step-label">验证身份</span>
            </div>
            <div className="auth-step-connector"></div>
            <div className={`auth-step ${step === "reset" ? "active" : ""}`}>
              <span className="auth-step-number">3</span>
              <span className="auth-step-label">重置密语</span>
            </div>
          </div>
          
          <ForgotPasswordForm
            onSubmit={handleSubmit}
            isPending={isPending}
            error={error}
            step={step as "email" | "verify" | "reset"}
            onStepChange={handleStepChange}
          />
          
          <div className="auth-footer-links">
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="auth-footer-link-button"
            >
              想起密语了？返回登录
            </button>
          </div>
        </div>

        <footer className="auth-page-footer">
          <p>© 2026 老祖宗养成计划 · 卷一 · 东坡试炼季</p>
        </footer>
      </div>
    </div>
  );
}
