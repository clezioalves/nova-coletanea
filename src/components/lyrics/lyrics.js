import React from "react";
import "./lyrics.css";

const Lyrics = (props) => {
  const { lyrics = [], currentTime } = props;

  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLineTime = lyrics[index + 1] ? lyrics[index + 1].time : Number.MAX_VALUE;
    return line.time <= currentTime && currentTime < nextLineTime;
  });

  return lyrics.length !== 0 ? (
    <div className="lyrics-container">
      {lyrics.map((line, index) => (
        <div key={index} className={`lyrics-line ${index === currentLineIndex ? "highlighted" : ""}`}>
          {line.text}
        </div>
      ))}
    </div>
  ) : (
    <div className="lyrics-container">Lyrics Not Found</div>
  );
};

export default Lyrics;
