import type { HTMLAttributes } from "react";
import styles from "./Card.module.scss";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export default function Card({
  title,
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div className={`${styles.card} ${className}`} {...rest}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
