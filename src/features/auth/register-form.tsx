import { useState, useMemo } from "react";

interface RegisterFormProps {
  onSubmit: (credentials: {
    username: string;
    password: string;
    email?: string;
    remember?: boolean;
  }) => void | Promise<void>;
  isPending: boolean;
  error: string | null;
}

export function RegisterForm({ onSubmit, isPending, error }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const usernameError = useMemo(() => {
    if (!username || !usernameTouched) return null;
    if (username.length < 2 || username.length > 16) {
      return "名讳长度需在 2-16 位之间";
    }
    return null;
  }, [username, usernameTouched]);

  const { passwordError, passwordStrength } = useMemo(() => {
    if (!password || !passwordTouched) {
      return { passwordError: null, passwordStrength: 0 };
    }
    
    let strength = 0;
    let error = null;
    
    if (password.length < 6) {
      error = "密语至少需要 6 位";
      strength = 1;
    } else {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const checks = [hasUpper, hasLower, hasNumber, hasSpecial];
      strength = checks.filter(Boolean).length;
      
      if (strength < 2) {
        strength = 2;
      }
    }
    
    return { passwordError: error, passwordStrength: Math.min(strength, 4) };
  }, [password, passwordTouched]);

  const confirmError = useMemo(() => {
    if (!confirmPassword || !confirmPasswordTouched) return null;
    if (password !== confirmPassword) {
      return "两次输入的密语不一致";
    }
    return null;
  }, [confirmPassword, password, confirmPasswordTouched]);

  const emailError = useMemo(() => {
    if (!email || !emailTouched) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "飞鸽地址格式有误";
    }
    return null;
  }, [email, emailTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setEmailTouched(true);
    
    if (usernameError || passwordError || confirmError || emailError) {
      return;
    }
    
    await onSubmit({ username, password, email, remember });
  };

  const isSubmitDisabled = isPending || !username || !password || !confirmPassword || 
    !agreeTerms || !!usernameError || !!passwordError || !!confirmError || 
    !!emailError;

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="username" className="form-label">
          名讳
        </label>
        <input
          id="username"
          type="text"
          className={`auth-input ${usernameError ? "auth-input--error" : ""}`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setUsernameTouched(true)}
          placeholder="请输入您的名讳（2-16 位）"
          autoComplete="username"
          required
          minLength={2}
          maxLength={16}
          aria-invalid={!!usernameError}
          aria-describedby={usernameError ? "username-error" : undefined}
        />
        {usernameError && (
          <p id="username-error" className="field-error" role="alert">
            {usernameError}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          飞鸽地址 <span style={{ color: "var(--ink-soft)", fontWeight: "normal" }}>（可选）</span>
        </label>
        <input
          id="email"
          type="email"
          className={`auth-input ${emailError ? "auth-input--error" : ""}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          placeholder="用于找回密语"
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <p id="email-error" className="field-error" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          密语
        </label>
        <div className="password-input-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className={`auth-input ${passwordError ? "auth-input--error" : ""}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="至少 6 位"
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
        {!passwordError && password && passwordStrength > 0 && (
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
          确认密语
        </label>
        <div className="password-input-wrapper">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className={`auth-input ${confirmError ? "auth-input--error" : ""}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmPasswordTouched(true)}
            placeholder="再次输入密语"
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
        {!confirmError && confirmPassword && password === confirmPassword && (
          <p className="field-success" role="status">
            ✓ 密语一致
          </p>
        )}
      </div>

      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="checkbox-text">铭记此名</span>
        </label>
      </div>

      <div className="form-group">
        <label className="checkbox-label" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{ marginTop: "3px" }}
          />
          <span className="checkbox-text" style={{ fontSize: "0.88rem", lineHeight: "1.6" }}>
            愿守此约：遵守平台规则，尊重其他用户，共同维护良好的互动环境
          </span>
        </label>
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
        disabled={isSubmitDisabled}
      >
        {isPending ? "展开中..." : "展开卷轴"}
      </button>
    </form>
  );
}
