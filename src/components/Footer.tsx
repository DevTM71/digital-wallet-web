const linkClass =
  "font-medium text-zinc-600 underline underline-offset-4 transition-colors hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 py-6 dark:border-zinc-800">
      <p className="mx-auto flex w-full max-w-3xl items-center justify-center gap-2 px-6 text-sm text-zinc-500 dark:text-zinc-400">
        Tiago Martins
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/DevTM71"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          GitHub
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://www.linkedin.com/in/tiago-f-martins-filho"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          LinkedIn
        </a>
      </p>
    </footer>
  );
}
