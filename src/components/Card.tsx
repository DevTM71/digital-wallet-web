import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
