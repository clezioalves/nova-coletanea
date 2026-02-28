import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./musicPlayer.css";
import "./progressBar.css";
import { IconContext } from "react-icons";
import { BiSkipNext, BiSkipPrevious } from "react-icons/bi";
import { AiFillPlayCircle, AiFillPauseCircle } from "react-icons/ai";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { loadMusicDB } from "../../resources/musicData";

const MusicPlayer = (props) => {
  const [songs, setSongs] = useState([]);
  const [selectedSongIds, setSelectedSongIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isLibraryMinimized, setIsLibraryMinimized] = useState(false);
  const [isPlaylistMinimized, setIsPlaylistMinimized] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const driveSongs = await loadMusicDB();
        setSongs(driveSongs);
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setLoadingLibrary(false);
      }
    };

    fetchSongs();
  }, []);

  const selectedSongs = useMemo(
    () => {
      // Manter a ordem de selectedSongIds (ordem de inclusão/reordenação)
      const songMap = new Map(songs.map((song) => [song.id, song]));
      return selectedSongIds
        .map((id) => songMap.get(id))
        .filter((song) => song !== undefined);
    },
    [songs, selectedSongIds]
  );

  const availableSongs = useMemo(
    () => songs.filter((song) => !selectedSongIds.includes(song.id)),
    [songs, selectedSongIds]
  );

  const filteredAvailableSongs = useMemo(() => {
    const normalizedFilter = filterTerm.trim().toLowerCase();

    if (!normalizedFilter) {
      return availableSongs;
    }

    return availableSongs.filter((song) => {
      const searchable = `${song.title} ${song.artist} ${song.album}`.toLowerCase();
      return searchable.includes(normalizedFilter);
    });
  }, [availableSongs, filterTerm]);

  const currentSong = selectedSongs[currentSongIndex];

  useEffect(() => {
    if (currentSongIndex >= selectedSongs.length) {
      setCurrentSongIndex(0);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [currentSongIndex, selectedSongs.length]);

  const setTrackAndPlay = useCallback(
    (nextIndex) => {
      if (!audioRef.current || selectedSongs.length === 0) {
        return;
      }

      setCurrentSongIndex(nextIndex);
      setCurrentTime(0);
      audioRef.current.pause();
      audioRef.current.src = selectedSongs[nextIndex].src;
      audioRef.current.load();
      setLoadingTrack(true);

      audioRef.current.oncanplaythrough = () => {
        audioRef.current.play();
        audioRef.current.oncanplaythrough = null;
        setLoadingTrack(false);
        setIsPlaying(true);
      };
    },
    [selectedSongs]
  );

  const togglePlay = () => {
    if (!audioRef.current || selectedSongs.length === 0 || !currentSong) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  const playNext = useCallback(() => {
    if (selectedSongs.length === 0) {
      return;
    }

    const nextIndex = (currentSongIndex + 1) % selectedSongs.length;
    setTrackAndPlay(nextIndex);
  }, [currentSongIndex, selectedSongs.length, setTrackAndPlay]);

  const playPrev = () => {
    if (selectedSongs.length === 0) {
      return;
    }

    const prevIndex =
      (currentSongIndex - 1 + selectedSongs.length) % selectedSongs.length;
    setTrackAndPlay(prevIndex);
  };

  const handleTimeUpdate = useCallback(() => {
    const t = audioRef.current.currentTime;
    setCurrentTime(t);
    if (currentSong) {
      props.getDataForLyrics({
        trackId: currentSong.id,
        currentTime: t,
        lyrics: currentSong.lyrics,
      });
    }
  }, [currentSong, props]);

  const handleLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current.duration);
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement || selectedSongs.length === 0) {
      return;
    }

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", playNext);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", playNext);
    };
  }, [handleLoadedMetadata, handleTimeUpdate, playNext, selectedSongs.length]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSeek = (newTime) => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const addSongToPlaylist = (songId) => {
    setSelectedSongIds((prev) => [...prev, songId]);
  };

  const removeSongFromPlaylist = (songId) => {
    setSelectedSongIds((prev) => prev.filter((id) => id !== songId));
  };

  const moveSongUp = useCallback((index) => {
    if (index <= 0) return;
    setSelectedSongIds((prev) => {
      const newIds = [...prev];
      [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
      return newIds;
    });
  }, []);

  const moveSongDown = useCallback((index) => {
    setSelectedSongIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const newIds = [...prev];
      [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
      return newIds;
    });
  }, []);

  const progress = (currentTime / duration) * 100 || 0;

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    if (nextVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  if (loadingLibrary) {
    return (
      <div className="music-player">Carregando louvores do Google Drive...</div>
    );
  }

  if (loadError) {
    return <div className="music-player">{loadError}</div>;
  }

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={currentSong?.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      ></audio>

      <div className="component">
        <h2 className="playerTitle">
          {currentSong
            ? loadingTrack
              ? "Loading..."
              : currentSong.album
            : "Selecione louvores para reproduzir"}
        </h2>

        <div className="progress-container">
          <div
            className="progress"
            onClick={(e) =>
              handleSeek((e.nativeEvent.offsetX / e.target.offsetWidth) * duration)
            }
          >
            <div className="progress-filled" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="track-info">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="duration">{formatTime(duration)}</div>
        </div>

        <div className="musicDetails">
          <h3 className="title">{currentSong?.title || "Sem faixa selecionada"}</h3>
          <p className="subTitle">{currentSong?.artist || ""}</p>
        </div>

        <div className="musicControls">
          <button className="playButton clickable" onClick={playPrev}>
            <IconContext.Provider value={{ size: "3em", color: "currentColor" }}>
              <BiSkipPrevious />
            </IconContext.Provider>
          </button>

          {!isPlaying ? (
            <button className="playButton clickable" onClick={togglePlay}>
              <IconContext.Provider value={{ size: "3em", color: "currentColor" }}>
                <AiFillPlayCircle />
              </IconContext.Provider>
            </button>
          ) : (
            <button className="playButton clickable" onClick={togglePlay}>
              <IconContext.Provider value={{ size: "3em", color: "currentColor" }}>
                <AiFillPauseCircle />
              </IconContext.Provider>
            </button>
          )}

          <button className="playButton clickable" onClick={playNext}>
            <IconContext.Provider value={{ size: "3em", color: "currentColor" }}>
              <BiSkipNext />
            </IconContext.Provider>
          </button>
        </div>

        <div className="volume-controls">
          <button
            className="playButton clickable"
            onClick={toggleMute}
            title={isMuted ? "Ativar som" : "Silenciar"}
          >
            <IconContext.Provider value={{ size: "1.8em", color: "currentColor" }}>
              {isMuted ? <HiSpeakerXMark /> : <HiSpeakerWave />}
            </IconContext.Provider>
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Controle de volume"
          />
        </div>

        <div className="playlist-manager">
          <div className="playlist-column">
            <div className="playlist-column-header">
              <h3>Biblioteca</h3>
              <button
                className="collapse-btn"
                onClick={() => setIsLibraryMinimized((prev) => !prev)}
                aria-expanded={!isLibraryMinimized}
              >
                {isLibraryMinimized ? "Expandir" : "Minimizar"}
              </button>
            </div>

            {!isLibraryMinimized && (
              <>
                <input
                  className="filter-input"
                  type="text"
                  placeholder="Filtrar louvores"
                  value={filterTerm}
                  onChange={(event) => setFilterTerm(event.target.value)}
                />
                <ul className="song-list">
                  {filteredAvailableSongs.map((song) => (
                    <li key={song.id} className="song-item">
                      <span>{song.title}</span>
                      <button onClick={() => addSongToPlaylist(song.id)}>Incluir</button>
                    </li>
                  ))}
                  {filteredAvailableSongs.length === 0 && (
                    <li className="empty-list">Nenhum louvor disponível.</li>
                  )}
                </ul>
              </>
            )}
          </div>

          <div className="playlist-column">
            <div className="playlist-column-header">
              <h3>Lista de reprodução</h3>
              <button
                className="collapse-btn"
                onClick={() => setIsPlaylistMinimized((prev) => !prev)}
                aria-expanded={!isPlaylistMinimized}
              >
                {isPlaylistMinimized ? "Expandir" : "Minimizar"}
              </button>
            </div>

            {!isPlaylistMinimized && (
              <ul className="song-list">
                {selectedSongs.map((song, index) => (
                  <li key={song.id} className="song-item playlist-item">
                    <span>{song.title}</span>
                    <div className="playlist-buttons">
                      {index > 0 && (
                        <button
                          onClick={() => moveSongUp(index)}
                          title="Mover para cima"
                          className="reorder-btn"
                        >
                          ↑
                        </button>
                      )}
                      {index < selectedSongs.length - 1 && (
                        <button
                          onClick={() => moveSongDown(index)}
                          title="Mover para baixo"
                          className="reorder-btn"
                        >
                          ↓
                        </button>
                      )}
                      <button onClick={() => removeSongFromPlaylist(song.id)}>
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
                {selectedSongs.length === 0 && (
                  <li className="empty-list">Adicione louvores para começar.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
