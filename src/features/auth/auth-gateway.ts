import type {
  AuthCredentials,
  AuthError,
  AuthGateway,
  AuthResponse,
  RegisterCredentials,
  UserSession,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordResetResponse,
} from "@/shared/contracts/home";

const SESSION_KEY = "user_session";
const TOKEN_KEY = "auth_token";
const REGISTERED_USERS_KEY = "registered_users";

// 内置测试账号
const DEFAULT_TEST_USER = {
  username: "test",
  password: "123456",
  session: {
    userId: "user-001",
    displayName: "墨客",
    avatarGlyph: "墨",
    bondLevel: 3,
    favoriteAncestorId: "su-shi",
  } as UserSession,
};

export const authGateway: AuthGateway = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    if (process.env.NODE_ENV === "development") {
      return mockLogin(credentials);
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    if (process.env.NODE_ENV === "development") {
      return mockRegister(credentials);
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  },

  async getSession(): Promise<UserSession | null> {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) {
      return JSON.parse(session);
    }

    return null;
  },

  async requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse> {
    if (process.env.NODE_ENV === "development") {
      return mockRequestPasswordReset(request);
    }

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  async confirmPasswordReset(confirm: PasswordResetConfirm): Promise<PasswordResetResponse> {
    if (process.env.NODE_ENV === "development") {
      return mockConfirmPasswordReset(confirm);
    }

    const response = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(confirm),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },
};

function getRegisteredUsers(): Array<{
  username: string;
  password: string;
  session: UserSession;
}> {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(REGISTERED_USERS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function saveRegisteredUser(user: {
  username: string;
  password: string;
  session: UserSession;
}): void {
  if (typeof window === "undefined") return;
  
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

async function mockLogin(credentials: AuthCredentials): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 检查内置测试账号
  if (credentials.username === DEFAULT_TEST_USER.username && 
      credentials.password === DEFAULT_TEST_USER.password) {
    return {
      session: DEFAULT_TEST_USER.session,
      token: "mock-token-" + Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
  }

  // 检查注册的账号
  const registeredUsers = getRegisteredUsers();
  const registeredUser = registeredUsers.find(
    user => user.username === credentials.username && user.password === credentials.password
  );

  if (registeredUser) {
    return {
      session: registeredUser.session,
      token: "mock-token-" + Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
  }

  const error: AuthError = {
    code: "INVALID_CREDENTIALS",
    message: "名讳或密语有误，请再试一次",
  };

  throw error;
}

async function mockRegister(
  credentials: RegisterCredentials
): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (credentials.password.length < 6) {
    const error: AuthError = {
      code: "WEAK_PASSWORD",
      message: "密语过短，至少需要 6 位",
      field: "password",
    };
    throw error;
  }

  if (credentials.username.length < 2 || credentials.username.length > 16) {
    const error: AuthError = {
      code: "INVALID_USERNAME",
      message: "名讳长度需在 2-16 位之间",
      field: "username",
    };
    throw error;
  }

  const session: UserSession = {
    userId: "user-" + Date.now(),
    displayName: credentials.username,
    avatarGlyph: credentials.username[0].toUpperCase(),
    bondLevel: 1,
  };

  // 保存注册账号到 localStorage
  saveRegisteredUser({
    username: credentials.username,
    password: credentials.password,
    session,
  });

  return {
    session,
    token: "mock-token-" + Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

export function saveSession(session: UserSession, token: string, remember?: boolean): void {
  if (typeof window === "undefined") return;

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  storage.setItem(TOKEN_KEY, token);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function mockRequestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 模拟发送邮件
  const mockCode = "123456";
  console.log(`[Mock] 验证码已发送至 ${request.email}: ${mockCode}`);

  return {
    success: true,
    message: "验证码已发送至您的飞鸽地址，请查收",
  };
}

async function mockConfirmPasswordReset(confirm: PasswordResetConfirm): Promise<PasswordResetResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (confirm.code !== "123456") {
    const error: AuthError = {
      code: "INVALID_CREDENTIALS",
      message: "验证码有误，请重新输入",
      field: "code",
    };
    throw error;
  }

  if (confirm.newPassword.length < 6) {
    const error: AuthError = {
      code: "WEAK_PASSWORD",
      message: "新密语过短，至少需要 6 位",
      field: "newPassword",
    };
    throw error;
  }

  return {
    success: true,
    message: "密语重置成功，请使用新密语登录",
  };
}
