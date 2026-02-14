import React from "react";
import { AIAnswerData } from "./types";

interface AIAnswerProps {
  data: AIAnswerData;
  onCitationClick?: (resultIndex: number) => void;
}

export const AIAnswer: React.FC<AIAnswerProps> = ({ data, onCitationClick }) => {
  if (!data.answer) return null;

  return (
    <div className="mixpeek-ai-answer" role="region" aria-label="AI Answer">
      <div className="mixpeek-ai-answer-header">
        <div className="mixpeek-ai-answer-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="mixpeek-ai-answer-label">AI Answer</span>
        {data.isStreaming && (
          <span className="mixpeek-ai-answer-streaming">Generating...</span>
        )}
      </div>

      <div className="mixpeek-ai-answer-text">{data.answer}</div>

      {data.citations && data.citations.length > 0 && (
        <div className="mixpeek-ai-answer-citations">
          <span className="mixpeek-ai-answer-citations-label">Sources:</span>
          {data.citations.map((citation, i) => (
            <button
              key={i}
              className="mixpeek-ai-answer-citation"
              onClick={() => onCitationClick?.(citation.resultIndex)}
              type="button"
              title={citation.text}
            >
              <span className="mixpeek-citation-index">
                {citation.resultIndex + 1}
              </span>
              <span className="mixpeek-citation-text">{citation.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
