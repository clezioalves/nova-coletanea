import React, { useEffect, useRef } from "react";
import "./lyrics.css";

const Lyrics = (props) => {
  const { lyrics = [], currentTime, fontSize = 1, presentationMode = false } = props;

  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLineTime = lyrics[index + 1] ? lyrics[index + 1].time : Number.MAX_VALUE;
    return line.time <= currentTime && currentTime < nextLineTime;
  });

  const lineRefs = useRef([]);

  useEffect(() => {
    const highlightedLine = lineRefs.current[currentLineIndex];

    if (!highlightedLine) {
      return;
    }

    highlightedLine.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [currentLineIndex]);

  return lyrics.length !== 0 ? (
    <div className={`lyrics-container ${presentationMode ? "presentation" : ""}`}>
      {lyrics.map((line, index) => (
        <div
          key={index}
          ref={(element) => {
            lineRefs.current[index] = element;
          }}
          className={`lyrics-line ${index === currentLineIndex ? "highlighted" : ""}`}
          style={{ fontSize: `${fontSize}em` }}
        >
          {line.text}
        </div>
      ))}
    </div>
  ) : (
    <div className="lyrics-container">Lyrics Not Found</div>
  );
};

export default Lyrics;
