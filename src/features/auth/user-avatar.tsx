"use client";

import { useState } from "react";
import type { UserSession } from "@/shared/contracts/home";

interface UserAvatarProps {
  glyph: string;
  bondLevel?: number;
  size?: "small" | "medium" | "large";
  showName?: boolean;
  name?: string;
}

export function UserAvatar({
  glyph,
  bondLevel = 1,
  showName = false,
  name,
}: Omit<UserAvatarProps, "size">) {
  const levelClass = {
    1: "user-avatar--level-1",
    2: "user-avatar--level-1",
    3: "user-avatar--level-3",
    4: "user-avatar--level-3",
    5: "user-avatar--level-5",
    6: "user-avatar--level-5",
    7: "user-avatar--level-7",
    8: "user-avatar--level-7",
    9: "user-avatar--level-9",
    10: "user-avatar--level-9",
  }[Math.min(bondLevel, 10)] || "user-avatar--level-1";

  return (
    <div className="user-avatar-wrapper">
      <div className={`user-avatar ${levelClass}`} title={`羁绊等级：${bondLevel}`}>
        {glyph}
      </div>
      {showName && name && (
        <div className="user-avatar-name">
          {name}
          <span className="user-bond-level">Lv.{bondLevel}</span>
        </div>
      )}
    </div>
  );
}

interface UserProfileProps {
  session: UserSession;
  onLogout?: () => void | Promise<void>;
}

export function UserProfile({ session, onLogout }: UserProfileProps) {
  const bondLevel = session.bondLevel || 1;
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowConfirm(false);
    if (onLogout) {
      await onLogout();
    }
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <div className="user-profile-shell">
      <UserAvatar
        glyph={session.avatarGlyph}
        bondLevel={bondLevel}
      />
      <div className="user-profile-info">
        <div className="user-profile-name">{session.displayName}</div>
        <div className="user-bond-level">羁绊 Lv.{bondLevel}</div>
      </div>
      {onLogout && (
        <>
          <button
            onClick={handleLogoutClick}
            className="logout-button"
            aria-label="退出登录"
            title="退出登录"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="logout-text">退出</span>
          </button>
          
          {showConfirm && (
            <div className="logout-confirm-overlay" onClick={handleCancelLogout}>
              <div className="logout-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="logout-confirm-icon">⚠️</div>
                <h3 className="logout-confirm-title">确认退出</h3>
                <p className="logout-confirm-message">确定要退出当前账号吗？未保存的进度可能会丢失。</p>
                <div className="logout-confirm-actions">
                  <button
                    onClick={handleCancelLogout}
                    className="logout-confirm-button logout-confirm-cancel"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmLogout}
                    className="logout-confirm-button logout-confirm-confirm"
                  >
                    确认退出
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
