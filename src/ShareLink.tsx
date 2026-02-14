import React, { useState, useCallback } from "react";

interface ShareLinkProps {
  query: string;
}

export const ShareLink: React.FC<ShareLinkProps> = ({ query }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!query.trim()) return;

    const url = new URL(window.location.href);
    url.searchParams.set("mixpeek_q", query);

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [query]);

  if (!query.trim()) return null;

  return (
    <button
      className="mixpeek-share-link"
      onClick={handleCopy}
      type="button"
      aria-label="Copy shareable link"
      title="Copy shareable search link"
    >
      {copied ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>Share</span>
        </>
      )}
    </button>
  );
};
