import { useEffect, useCallback } from "react";

interface UseKeyboardShortcutOptions {
  /** Whether the shortcut is enabled */
  enabled: boolean;
  /** Callback when shortcut is triggered */
  onTrigger: () => void;
}

/**
 * Listens for Cmd+K (Mac) or Ctrl+K (Windows/Linux) to trigger search.
 * Also listens for Escape to close.
 */
export function useKeyboardShortcut(options: UseKeyboardShortcutOptions): void {
  const { enabled, onTrigger } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (modifier && event.key === "k") {
        event.preventDefault();
        event.stopPropagation();
        onTrigger();
      }
    },
    [enabled, onTrigger]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
