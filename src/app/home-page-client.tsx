"use client";

import Link from "next/link";

import type { HomePageData } from "@/shared/contracts/home";
import { TagPill } from "@/shared/ui/primitives";

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
