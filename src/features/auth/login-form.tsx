import { useState, useMemo } from "react";

interface LoginFormProps {
  onSubmit: (credentials: {
    username: string;
    password: string;
    remember?: boolean;
  }) => void | Promise<void>;
  isPending: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, isPending, error }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const usernameError = useMemo(() => {
    if (!username || !usernameTouched) return null;
    if (username.length < 2 || username.length > 16) {
      return "名讳长度需在 2-16 位之间";
    }
    return null;
  }, [username, usernameTouched]);

  const passwordError = useMemo(() => {
    if (!password || !passwordTouched) return null;
    if (password.length < 6) {
      return "密语至少需要 6 位";
    }
    return null;
  }, [password, passwordTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameTouched(true);
    setPasswordTouched(true);
    
    if (usernameError || passwordError) {
      return;
    }
    
    await onSubmit({ username, password, remember });
  };

  const isSubmitDisabled = isPending || !username || !password || !!usernameError || !!passwordError;

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
            placeholder="请输入您的密语"
            autoComplete="current-password"
            required
            minLength={6}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
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
        {isPending ? "验证中..." : "进入"}
      </button>
    </form>
  );
}
