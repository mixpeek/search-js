import React, { useMemo } from "react";

interface SearchButtonProps {
  onClick: () => void;
  placeholder: string;
  keyboardShortcut: boolean;
}

function getShortcutLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl K";
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return isMac ? "\u2318K" : "Ctrl K";
}

export const SearchButton: React.FC<SearchButtonProps> = ({
  onClick,
  placeholder,
  keyboardShortcut,
}) => {
  const shortcutLabel = useMemo(() => getShortcutLabel(), []);

  return (
    <button
      className="mixpeek-search-button"
      onClick={onClick}
      type="button"
      aria-label="Open search"
    >
      <svg
        className="mixpeek-search-button-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span className="mixpeek-search-button-text">{placeholder}</span>
      {keyboardShortcut && (
        <kbd className="mixpeek-search-button-kbd">{shortcutLabel}</kbd>
      )}
    </button>
  );
};
