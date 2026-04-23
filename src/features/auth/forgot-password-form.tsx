import { useState, useMemo } from "react";

interface ForgotPasswordFormProps {
  onSubmit: (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => void | Promise<void>;
  isPending: boolean;
  error: string | null;
  step: "email" | "verify" | "reset";
  onStepChange: (step: "email" | "verify" | "reset") => void;
}

export function ForgotPasswordForm({ 
  onSubmit, 
  isPending, 
  error,
  step,
  onStepChange 
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailTouched, setEmailTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const emailError = useMemo(() => {
    if (!email || !emailTouched) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "飞鸽地址格式有误，请检查";
    }
    return null;
  }, [email, emailTouched]);

  const codeError = useMemo(() => {
    if (!code || !codeTouched) return null;
    if (code.length !== 6) {
      return "验证码需 6 位数字";
    }
    return null;
  }, [code, codeTouched]);

  const { passwordError, passwordStrength } = useMemo(() => {
    if (!newPassword || !passwordTouched) {
      return { passwordError: null, passwordStrength: 0 };
    }
    
    let strength = 0;
    let error = null;
    
    if (newPassword.length < 6) {
      error = "密语至少需要 6 位";
      strength = 1;
    } else {
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      const checks = [hasUpper, hasLower, hasNumber, hasSpecial];
      strength = checks.filter(Boolean).length;
      
      if (strength < 2) {
        strength = 2;
      }
    }
    
    return { passwordError: error, passwordStrength: Math.min(strength, 4) };
  }, [newPassword, passwordTouched]);

  const confirmError = useMemo(() => {
    if (!confirmPassword || !confirmPasswordTouched) return null;
    if (newPassword !== confirmPassword) {
      return "两次输入的密语不一致";
    }
    return null;
  }, [confirmPassword, newPassword, confirmPasswordTouched]);

  const handleSendCode = async () => {
    if (emailError) return;
    
    setIsSendingCode(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsCodeSent(true);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleEmailSubmit = async () => {
    setEmailTouched(true);
    if (emailError) return;
    await handleSendCode();
  };

  const handleVerifySubmit = async () => {
    setCodeTouched(true);
    if (codeError) return;
    onStepChange("reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    
    if (passwordError || confirmError || codeError) {
      return;
    }
    
    await onSubmit({ email, code, newPassword });
  };

  const isEmailDisabled = isPending || !email || !!emailError || isSendingCode;
  const isVerifyDisabled = isPending || !code || !!codeError;
  const isResetDisabled = isPending || !newPassword || !confirmPassword || 
    !!passwordError || !!confirmError || !!codeError;

  if (step === "email") {
    return (
      <div className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            飞鸽地址
          </label>
          <input
            id="email"
            type="email"
            className={`auth-input ${emailError ? "auth-input--error" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="请输入您的飞鸽地址"
            autoComplete="email"
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
          />
          {emailError && (
            <p id="email-error" className="field-error" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          className="auth-button"
          onClick={handleEmailSubmit}
          disabled={isEmailDisabled || isSendingCode || countdown > 0}
        >
          {isSendingCode ? "飞鸽送信中..." : countdown > 0 ? `${countdown}秒后重发` : "获取验证码"}
        </button>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="auth-form">
        <div className="form-group">
          <label htmlFor="email-display" className="form-label">
            飞鸽地址
          </label>
          <div id="email-display" className="email-display">
            {email}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="code" className="form-label">
            验证码
          </label>
          <div className="code-input-wrapper">
            <input
              id="code"
              type="text"
              className={`auth-input ${codeError ? "auth-input--error" : ""}`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onBlur={() => setCodeTouched(true)}
              placeholder="请输入 6 位验证码"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              aria-invalid={!!codeError}
              aria-describedby={codeError ? "code-error" : undefined}
            />
            <button
              type="button"
              className="resend-code-button"
              onClick={handleSendCode}
              disabled={isSendingCode || countdown > 0}
            >
              {isSendingCode ? "重发中..." : countdown > 0 ? `${countdown}秒` : "重发"}
            </button>
          </div>
          {codeError && (
            <p id="code-error" className="field-error" role="alert">
              {codeError}
            </p>
          )}
          {isCodeSent && !codeError && (
            <p className="field-success" role="status">
              ✓ 验证码已发送至您的飞鸽地址
            </p>
          )}
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          className="auth-button"
          onClick={handleVerifySubmit}
          disabled={isVerifyDisabled}
        >
          验证身份
        </button>
      </div>
    );
  }

  // step === "reset"
  return (
    <form onSubmit={handleResetSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="newPassword" className="form-label">
          新密语
        </label>
        <div className="password-input-wrapper">
          <input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            className={`auth-input ${passwordError ? "auth-input--error" : ""}`}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密语"
            autoComplete="new-password"
            required
            minLength={6}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : "password-strength"}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "隐藏密语" : "显示密语"}
            tabIndex={-1}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="field-error" role="alert">
            {passwordError}
          </p>
        )}
        {!passwordError && newPassword && passwordStrength > 0 && (
          <div id="password-strength" className="password-strength">
            <div className={`password-strength-bar strength-${passwordStrength}`}></div>
            <span className="password-strength-text">
              {passwordStrength === 1 ? "弱" : passwordStrength === 2 ? "中" : "强"}
            </span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          确认新密语
        </label>
        <div className="password-input-wrapper">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className={`auth-input ${confirmError ? "auth-input--error" : ""}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmPasswordTouched(true)}
            placeholder="再次输入新密语"
            autoComplete="new-password"
            required
            aria-invalid={!!confirmError}
            aria-describedby={confirmError ? "confirm-error" : undefined}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "隐藏密语" : "显示密语"}
            tabIndex={-1}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showConfirmPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
        {confirmError && (
          <p id="confirm-error" className="field-error" role="alert">
            {confirmError}
          </p>
        )}
        {!confirmError && confirmPassword && newPassword === confirmPassword && (
          <p className="field-success" role="status">
            ✓ 密语一致
          </p>
        )}
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <span className="auth-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="auth-button"
        disabled={isResetDisabled}
      >
        {isPending ? "重置中..." : "重置密语"}
      </button>
    </form>
  );
}
