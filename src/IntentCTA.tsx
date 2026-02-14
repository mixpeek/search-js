import React from "react";
import { CTAConfig } from "./types";

interface IntentCTAProps {
  config: CTAConfig;
}

export const IntentCTA: React.FC<IntentCTAProps> = ({ config }) => {
  return (
    <div className="mixpeek-intent-cta" role="banner">
      <div className="mixpeek-intent-cta-message">{config.message}</div>
      <a
        className="mixpeek-intent-cta-button"
        href={config.buttonUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {config.buttonText}
      </a>
    </div>
  );
};
