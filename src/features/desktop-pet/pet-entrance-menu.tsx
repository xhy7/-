"use client";

import Link from "next/link";

import type { PetEntranceItem } from "@/shared/contracts/home";

import styles from "./desktop-pet-hub.module.css";

interface PetEntranceMenuProps {
  items: PetEntranceItem[];
  onEntranceIntent: (item: PetEntranceItem) => void;
}

export function PetEntranceMenu({
  items,
  onEntranceIntent,
}: PetEntranceMenuProps) {
  return (
    <nav className={styles.entranceMenu} aria-label="桌宠网页入口">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={styles.entranceCard}
          onFocus={() => onEntranceIntent(item)}
          onClick={() => onEntranceIntent(item)}
        >
          <span className={styles.entranceLabel}>{item.label}</span>
          <p className={styles.entranceDescription}>{item.description}</p>
          <span className={styles.entranceArrow} aria-hidden="true">
            展开卷轴
          </span>
        </Link>
      ))}
    </nav>
  );
}
