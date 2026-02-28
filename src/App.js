import React, { useState } from "react";
import MusicPlayer from "./components/musicPlayer/musicPlayer";
import Lyrics from "./components/lyrics/lyrics";
import "./styles/twoSections.css";
import "./App.css";

function App() {
  const [dataForLyrics, setDataForLyrics] = useState({});
  const [isDarkLayout, setIsDarkLayout] = useState(true);

  const handleLyricsDataFromChild = (data) => {
    setDataForLyrics(data);
  };

  const toggleLayoutTheme = () => {
    setIsDarkLayout((prev) => !prev);
  };

  return (
    <div className={`App ${isDarkLayout ? "theme-dark" : "theme-light"}`}>
      <header className="app-toolbar">
        <h1>Nova Coletânea</h1>
        <button className="theme-toggle-btn" onClick={toggleLayoutTheme}>
          {isDarkLayout ? "Modo claro" : "Modo escuro"}
        </button>
      </header>

      <div className="two-sections-layout">
        <div className="section-left">
          <MusicPlayer getDataForLyrics={handleLyricsDataFromChild} />
        </div>
        <div className="section-right">
          <Lyrics
            lyrics={dataForLyrics.lyrics}
            currentTime={dataForLyrics.currentTime}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
