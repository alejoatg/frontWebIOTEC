import type { HTMLAttributes } from "react";
import styles from "./Text.module.scss";

export type TextVariant =
  | "body"
  | "bodySmall"
  | "caption"
  | "overline"
  | "heading1"
  | "heading2"
  | "heading3";

export type TextColor = "default" | "secondary" | "muted";

export type TextAsElement = "span" | "p" | "div" | "h1" | "h2" | "h3";

export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TextVariant;
  color?: TextColor;
  as?: TextAsElement;
  children: React.ReactNode;
}

export default function Text({
  variant = "body",
  color = "default",
  as: Component = "span",
  className = "",
  children,
  ...rest
}: TextProps) {
  return (
    <Component
      className={`${styles.text} ${styles[variant]} ${styles[color]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
