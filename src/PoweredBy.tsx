import React from "react";
import type { ThemeMode } from "./types";

interface PoweredByProps {
  /** Explicit theme override (CSS custom properties handle it by default) */
  theme?: ThemeMode;
}

export const PoweredBy: React.FC<PoweredByProps> = ({ theme }) => {
  return (
    <a
      className={`mixpeek-powered-by${theme ? ` mixpeek-powered-by--${theme}` : ""}`}
      href="https://mixpeek.com?ref=search-widget"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Search powered by Mixpeek"
    >
      <span className="mixpeek-powered-by__text">Search by</span>
      <svg
        className="mixpeek-powered-by__logo"
        width="14"
        height="14"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="6" fill="currentColor" fillOpacity="0.15" />
        <path
          d="M8 22V10l5 6 5-6v12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 10v12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="mixpeek-powered-by__wordmark">Mixpeek</span>
    </a>
  );
};
