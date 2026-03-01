import React, { useState } from "react";
import MusicPlayer from "./components/musicPlayer/musicPlayer";
import Lyrics from "./components/lyrics/lyrics";
import "./styles/twoSections.css";
import "./App.css";

function App() {
  const [dataForLyrics, setDataForLyrics] = useState({});
  const [isDarkLayout, setIsDarkLayout] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState(1);

  const handleLyricsDataFromChild = React.useCallback((data) => {
    setDataForLyrics(data);
  }, []);

  const toggleLayoutTheme = () => {
    setIsDarkLayout((prev) => !prev);
  };

  const togglePresentationMode = () => {
    setIsPresentationMode((prev) => !prev);
  };

  const increaseFontSize = () => {
    setLyricsFontSize((prev) => Math.min(prev + 0.2, 2));
  };

  const decreaseFontSize = () => {
    setLyricsFontSize((prev) => Math.max(prev - 0.2, 0.6));
  };

  return (
    <div className={`App ${isDarkLayout ? "theme-dark" : "theme-light"}`}>
      <header className="app-toolbar">
        <h1>Nova Coletânea</h1>
        <div className="toolbar-actions">
          <button className="theme-toggle-btn" onClick={toggleLayoutTheme}>
            {isDarkLayout ? "Modo claro" : "Modo escuro"}
          </button>
          <button
            className={`theme-toggle-btn ${isPresentationMode ? "active" : ""}`}
            onClick={togglePresentationMode}
          >
            {isPresentationMode ? "Sair apresentação" : "Modo apresentação"}
          </button>
          <div className="font-size-controls">
            <button
              className="font-size-btn"
              onClick={decreaseFontSize}
              title="Diminuir tamanho da fonte"
            >
              A−
            </button>
            <span className="font-size-display">{Math.round(lyricsFontSize * 100)}%</span>
            <button
              className="font-size-btn"
              onClick={increaseFontSize}
              title="Aumentar tamanho da fonte"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      <div
        className={`two-sections-layout ${
          isPresentationMode ? "presentation-layout" : ""
        }`}
      >
        <div className={`section-left ${isPresentationMode ? "presentation-player" : ""}`}>
          <MusicPlayer
            getDataForLyrics={handleLyricsDataFromChild}
            presentationMode={isPresentationMode}
          />
        </div>
        <div className={`section-right ${isPresentationMode ? "presentation-lyrics" : ""}`}>
          <Lyrics
            lyrics={dataForLyrics.lyrics}
            currentTime={dataForLyrics.currentTime}
            fontSize={lyricsFontSize}
            presentationMode={isPresentationMode}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
