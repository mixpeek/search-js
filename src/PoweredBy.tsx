import React from "react";

export const PoweredBy: React.FC = () => {
  return (
    <a
      className="mixpeek-powered-by"
      href="https://mixpeek.com/search"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Search by Mixpeek"
    >
      <span className="mixpeek-powered-by-text">Search by</span>
      <svg
        className="mixpeek-powered-by-logo"
        width="70"
        height="16"
        viewBox="0 0 70 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="13"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="13"
          fontWeight="600"
          fill="currentColor"
        >
          Mixpeek
        </text>
      </svg>
    </a>
  );
};
