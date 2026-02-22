import type { HTMLAttributes } from "react";
import styles from "./Container.module.scss";

export type ContainerSize = "sm" | "md" | "lg" | "full";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children: React.ReactNode;
}

export default function Container({
  size = "lg",
  children,
  className = "",
  ...rest
}: ContainerProps) {
  return (
    <div className={`${styles.container} ${styles[size]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
