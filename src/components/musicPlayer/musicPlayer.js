import React, { useState, useRef, useEffect, useCallback } from "react";
import "./musicPlayer.css";
import "./progressBar.css";
import { IconContext } from "react-icons";
import { BiSkipNext, BiSkipPrevious } from "react-icons/bi";
import { AiFillPlayCircle, AiFillPauseCircle } from "react-icons/ai";
import { loadMusicDB } from "../../resources/musicData";

const MusicPlayer = (props) => {
  const [songs, setSongs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [loadError, setLoadError] = useState("");
  const audioRef = useRef(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const driveSongs = await loadMusicDB();
        console.log('driveSongs', driveSongs);
        setSongs(driveSongs);
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setLoadingLibrary(false);
      }
    };

    fetchSongs();
  }, []);

  const currentSong = songs[currentSongIndex];

  // Probe a URL (HEAD) to log HTTP status and content-type for debugging.
  const probeUrl = async (url) => {
    if (!url) return null;
    try {
      const res = await fetch(url, { method: "HEAD", mode: "cors" });
      console.log("probeUrl:", url, "status:", res.status, "content-type:", res.headers.get("content-type"));
      return res;
    } catch (err) {
      console.warn("probeUrl failed for", url, err);
      return null;
    }
  };

  const setTrackAndPlay = useCallback(
    (nextIndex) => {
      if (!audioRef.current || songs.length === 0) {
        return;
      }

      setCurrentSongIndex(nextIndex);
      setCurrentTime(0);
      audioRef.current.pause();
      // set primary src and prepare an error fallback to srcAlt
      const primarySrc = songs[nextIndex].src;
      const fallbackSrc = songs[nextIndex].srcAlt;
      audioRef.current.src = primarySrc;
      audioRef.current.dataset.triedAlt = "false";
      audioRef.current.onerror = () => {
        // Log and probe the failing URL (may be blocked by CORS but helpful when allowed)
        (async () => {
          const failing = audioRef.current && audioRef.current.currentSrc;
          console.warn("audio onerror (primary)", failing);
          await probeUrl(failing);

          // try fallback once
          if (fallbackSrc && audioRef.current.dataset.triedAlt !== "true") {
            audioRef.current.dataset.triedAlt = "true";
            console.log("Trying fallback audio src:", fallbackSrc);
            audioRef.current.src = fallbackSrc;
            audioRef.current.load();
            // attempt to play, ignore promise rejection
            audioRef.current.play().catch(() => {});
            return;
          }

          setLoadingTrack(false);
          setIsPlaying(false);
          setLoadError("Não foi possível carregar a fonte de áudio.");
        })();
      };
      audioRef.current.load();
      setLoadingTrack(true);

      audioRef.current.oncanplaythrough = () => {
        audioRef.current.play();
        audioRef.current.oncanplaythrough = null;
        setLoadingTrack(false);
        setIsPlaying(true);
      };
    },
    [songs]
  );

  // setup onerror fallback for the currently selected song (covers initial render)
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    // use the srcAlt as-is (don't append arbitrary suffixes)
    const fallbackSrc = currentSong.srcAlt;
    audioRef.current.dataset.triedAlt = "false";
    audioRef.current.onerror = (e) => {
      // attempt to probe and log HTTP status/content-type; then try fallback once
      (async () => {
        console.warn("audio onerror", e, "currentSrc:", audioRef.current && audioRef.current.currentSrc);
        const failing = audioRef.current && audioRef.current.currentSrc;
        await probeUrl(failing);

        if (fallbackSrc && audioRef.current.dataset.triedAlt !== "true") {
          audioRef.current.dataset.triedAlt = "true";
          console.log("Trying fallback audio src:", fallbackSrc);
          audioRef.current.src = fallbackSrc;
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
          return;
        }

        setLoadingTrack(false);
        setIsPlaying(false);
        setLoadError("Não foi possível carregar a fonte de áudio.");
      })();
    };

    // cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.onerror = null;
      }
    };
  }, [currentSong]);

  const togglePlay = () => {
    if (!audioRef.current || songs.length === 0) {
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
    if (songs.length === 0) {
      return;
    }

    const nextIndex = (currentSongIndex + 1) % songs.length;
    setTrackAndPlay(nextIndex);
  }, [currentSongIndex, setTrackAndPlay, songs.length]);

  const playPrev = () => {
    if (songs.length === 0) {
      return;
    }

    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    setTrackAndPlay(prevIndex);
  };

  useEffect(() => {
    // previously we used an interval that depended on `currentTime`
    // to send updates to the lyrics component. that meant the effect
    // was torn down and recreated on every tick, and in some cases
    // the time seen by the lyrics lagged behind until pause.
    //
    // instead we now call `props.getDataForLyrics` directly inside
    // handleTimeUpdate so the information is pushed synchronously
    // with the audio element's `timeupdate` event. the effect is
    // retained here only to clear any future side effects when the
    // track changes, but it no longer watches currentTime.
    if (!currentSong) {
      return;
    }
    return () => {};
  }, [currentSong]);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement || songs.length === 0) {
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
  }, [playNext, songs.length]);

  const handleTimeUpdate = () => {
    const t = audioRef.current.currentTime;
    setCurrentTime(t);
    if (currentSong) {
      props.getDataForLyrics({
        trackId: currentSong.id,
        currentTime: t,
        lyrics: currentSong.lyrics,
      });
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

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

  const progress = (currentTime / duration) * 100 || 0;

  if (loadingLibrary) {
    return <div className="music-player">Carregando músicas do Google Drive...</div>;
  }

  if (loadError) {
    return <div className="music-player">{loadError}</div>;
  }

  if (!currentSong) {
    return <div className="music-player">Nenhuma música encontrada na pasta.</div>;
  }

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={currentSong.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      ></audio>
      <div className="component">
        <h2 className="playerTitle">{loadingTrack ? "Loading..." : currentSong.album}</h2>
        <div className="musicCover">
          <img className="albumArtImage" src={currentSong.art} alt={currentSong.title} />
        </div>
        <div className="progress-container">
          <div
            className="progress"
            onClick={(e) => handleSeek((e.nativeEvent.offsetX / e.target.offsetWidth) * duration)}
          >
            <div className="progress-filled" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="track-info">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="duration">{formatTime(duration)}</div>
        </div>
        <div className="musicDetails">
          <h3 className="title">{currentSong.title}</h3>
          <p className="subTitle">{currentSong.artist}</p>
        </div>
        <div className="musicControls">
          <button className="playButton clickable" onClick={playPrev}>
            <IconContext.Provider value={{ size: "3em", color: "#000000" }}>
              <BiSkipPrevious />
            </IconContext.Provider>
          </button>
          {!isPlaying ? (
            <button className="playButton clickable" onClick={togglePlay}>
              <IconContext.Provider value={{ size: "3em", color: "#000000" }}>
                <AiFillPlayCircle />
              </IconContext.Provider>
            </button>
          ) : (
            <button className="playButton clickable" onClick={togglePlay}>
              <IconContext.Provider value={{ size: "3em", color: "#000000" }}>
                <AiFillPauseCircle />
              </IconContext.Provider>
            </button>
          )}
          <button className="playButton clickable" onClick={playNext}>
            <IconContext.Provider value={{ size: "3em", color: "#000000" }}>
              <BiSkipNext />
            </IconContext.Provider>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
