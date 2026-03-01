import React, { useState } from "react";
import MusicPlayer from "./components/musicPlayer/musicPlayer";
import Lyrics from "./components/lyrics/lyrics";
import "./styles/twoSections.css";
import "./App.css";

function App() {
  const [dataForLyrics, setDataForLyrics] = useState({});
  const [isDarkLayout, setIsDarkLayout] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const handleLyricsDataFromChild = React.useCallback((data) => {
    setDataForLyrics(data);
  }, []);

  const toggleLayoutTheme = () => {
    setIsDarkLayout((prev) => !prev);
  };

  const togglePresentationMode = () => {
    setIsPresentationMode((prev) => !prev);
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
            presentationMode={isPresentationMode}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
