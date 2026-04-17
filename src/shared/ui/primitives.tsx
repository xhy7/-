import type { ButtonHTMLAttributes, ReactNode } from "react";

const joinClassNames = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(" ");

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      <p className="section-body">{description}</p>
    </div>
  );
}

interface TagPillProps {
  children: ReactNode;
  tone?: "ink" | "seal" | "muted";
}

export function TagPill({ children, tone = "ink" }: TagPillProps) {
  return (
    <span className={joinClassNames("tag-pill", `tag-pill--${tone}`)}>
      {children}
    </span>
  );
}

interface ProgressMeterProps {
  label: string;
  value: number;
  max?: number;
  note: string;
  tone?: "ink" | "vermilion" | "gold";
}

export function ProgressMeter({
  label,
  value,
  max = 100,
  note,
  tone = "ink",
}: ProgressMeterProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className="meter"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="meter__head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter__track" aria-hidden="true">
        <div
          className={joinClassNames("meter__fill", `meter__fill--${tone}`)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="muted-note">{note}</p>
    </div>
  );
}

type InkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost";
};

export function InkButton({
  tone = "primary",
  className,
  type = "button",
  ...props
}: InkButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "ink-button",
        tone === "ghost" && "ink-button--ghost",
        className,
      )}
      {...props}
    />
  );
}

