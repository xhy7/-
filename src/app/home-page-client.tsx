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
            {data.shellStatuses.map((item) => (
              <TagPill key={item.id} tone={item.tone}>
                {item.value}
              </TagPill>
            ))}
          </div>
          <h1 className="display-title">{data.brandTitle}</h1>
          <p className={styles.subtitle}>{data.brandSubtitle}</p>
          <div className={styles.quickActions}>
            <Link href="/ancestors" className={styles.quickLink}>
              进入祖宗主舞台
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
            {data.shellStatuses.map((item) => (
              <div key={item.id} className={styles.asideItem}>
                <span>{item.label}</span>
                <strong>{item.note}</strong>
              </div>
            ))}
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

      <section className={`${styles.cardGrid} section-shell`}>
        <article className="paper-card">
          <p className="eyebrow">Featured Ancestor</p>
          <h2 className={styles.cardTitle}>
            {data.featuredAncestor.name} · {data.featuredAncestor.epithet}
          </h2>
          <p className={styles.cardBody}>{data.featuredAncestor.oneLiner}</p>
          <div className={styles.tagRow}>
            {data.featuredAncestor.signatureTags.map((tag) => (
              <TagPill key={tag}>{tag}</TagPill>
            ))}
          </div>
          <Link href="/ancestors" className={styles.quickLink}>
            打开人物与 AI 页
          </Link>
        </article>

        <article className="paper-card paper-card--muted">
          <p className="eyebrow">Growth Snapshot</p>
          <h2 className={styles.cardTitle}>
            MoodIndex {data.nurtureSummary.moodSnapshot.value}
          </h2>
          <p className={styles.cardBody}>{data.nurtureSummary.moodSnapshot.summary}</p>
          <div className={styles.tagRow}>
            {data.nurtureSummary.activeTags.map((tag) => (
              <TagPill key={tag} tone="muted">
                {tag}
              </TagPill>
            ))}
          </div>
          <Link href="/growth" className={styles.quickLink}>
            前往养成页
          </Link>
        </article>

        <article className="paper-card">
          <p className="eyebrow">AI Persona</p>
          <h2 className={styles.cardTitle}>角色 AI 已嵌入祖宗形象</h2>
          <p className={styles.cardBody}>{data.aiSandbox.helperText}</p>
          <div className={styles.tagRow}>
            {data.aiSandbox.supportedModes.map((mode) => (
              <TagPill key={mode} tone="muted">
                {mode}
              </TagPill>
            ))}
          </div>
          <Link href="/ancestors" className={styles.quickLink}>
            去和祖宗对话
          </Link>
        </article>
      </section>
    </main>
  );
}
