"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

import type { HomePageData, UserSession } from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";
import { UserProfile, UserAvatar, authGateway, clearSession } from "@/features/auth";

import styles from "./page-shell.module.css";

interface HomePageClientProps {
  data: HomePageData;
}

const routeMap = {
  "hero-stage": "/ancestors",
  "growth-core": "/growth",
  "playground-entry": "/playground",
} as const;

export function HomePageClient({ data }: HomePageClientProps) {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const session = await authGateway.getSession();
        setUserSession(session);
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const handleLogout = async () => {
    await authGateway.logout();
    clearSession();
    setUserSession(null);
  };

  // 个性化问候语
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "夜深了，注意休息";
    if (hour < 12) return "早上好";
    if (hour < 14) return "午安";
    if (hour < 18) return "下午好";
    return "晚上好";
  }, []);

  // 根据羁绊等级生成引导文案
  const getGuidanceByBondLevel = (level: number) => {
    if (level < 3) return "与古人对话，积累羁绊，解锁更多互动玩法";
    if (level < 6) return "继续培养与古人的羁绊，解锁专属剧情";
    return "您已是资深学者，快来探索高级玩法";
  };

  return (
    <main className={styles.page}>
      <header className={`${styles.header} section-shell`}>
        <div>
          <div className={styles.brandMeta}>
            <TagPill tone="seal">{data.seasonLabel}</TagPill>
            <TagPill tone="muted">{data.featuredAncestor.name}</TagPill>
          </div>
          <h1 className="display-title">{data.brandTitle}</h1>
          <p className={styles.subtitle}>{data.brandSubtitle}</p>
          
          {/* 用户欢迎信息 */}
          {!isLoading && userSession && (
            <div className={styles.userWelcome}>
              <div className={styles.userAvatarBlock}>
                <UserAvatar
                  glyph={userSession.avatarGlyph}
                  bondLevel={userSession.bondLevel}
                  showName
                  name={userSession.displayName}
                />
              </div>
              <div className={styles.userGreeting}>
                <span className={styles.welcomeText}>{greeting}，</span>
                <strong className={styles.userName}>{userSession.displayName}</strong>
                <span className={styles.userBond}>
                  羁绊 Lv.{userSession.bondLevel}
                </span>
              </div>
              <div className={styles.userStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>对话次数</span>
                  <strong className={styles.statValue}>{userSession.bondLevel * 5}</strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>收藏祖宗</span>
                  <strong className={styles.statValue}>{Math.floor(userSession.bondLevel / 2) + 1}</strong>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>今日活跃</span>
                  <strong className={styles.statValue}>{Math.min(userSession.bondLevel * 2, 10)}</strong>
                </div>
              </div>
              <p className={styles.userGuidance}>
                {getGuidanceByBondLevel(userSession.bondLevel)}
              </p>
            </div>
          )}
          
          <div className={styles.quickActions}>
            <Link href="/ancestors" className={styles.quickLink}>
              进入古人台
            </Link>
            <Link href="/growth" className={styles.quickLink}>
              查看养成中枢
            </Link>
            <Link href="/playground" className={styles.quickLink}>
              打开玩法入口
            </Link>
          </div>
        </div>
        <div className={styles.asideBlock}>
          <div className={styles.authEntry}>
            {!isLoading && (
              userSession ? (
                <UserProfile session={userSession} onLogout={handleLogout} />
              ) : (
                <div className={styles.authButtons}>
                  <Link href="/login" className={styles.loginButton}>
                    展开卷轴登录
                  </Link>
                  <Link href="/register" className={styles.registerButton}>
                    注册新账号
                  </Link>
                </div>
              )
            )}
          </div>
          <p className="section-body">{data.heroNotice}</p>
          <div className={styles.asideList}>
            <div className={styles.asideItem}>
              <span>当前主推</span>
              <strong>{data.featuredAncestor.name} · {data.featuredAncestor.epithet}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>养成状态</span>
              <strong>{data.nurtureSummary.moodSnapshot.statusLabel}</strong>
            </div>
            <div className={styles.asideItem}>
              <span>当前节气</span>
              <strong>{data.seasonLabel}</strong>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="首页功能入口" className={`${styles.entryGrid} section-shell`}>
        {data.sectionOrder.map((section) => (
          <a
            key={section.id}
            href={routeMap[section.id]}
            className={styles.entryCard}
          >
            <span className="eyebrow">{section.eyebrow}</span>
            <strong className={styles.entryTitle}>{section.title}</strong>
            <p className={styles.entrySummary}>{section.summary}</p>
          </a>
        ))}
      </nav>
    </main>
  );
}
