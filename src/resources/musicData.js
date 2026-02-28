import lyricsData from "./lyricsData.json";

const GOOGLE_DRIVE_FOLDER_ID = "1dTuzWuaoVrPAKVocEq5MrOgsTQvWNZme";

const metadataBySlug = {
  "a-sombra-de-tuas-palavras": {
    title: "A sombra de Tuas Palavras",
    artist: "Filho Varão",
    album: "Coletânea Filho Varão",
    art: "https://teste.png"
  }
};

const createSlug = (fileName) =>
  fileName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// URLs now point at the development proxy; the proxy will attach the API key
// and handle CORS. In production you can replace these with your own host.
const buildUcUrl = (fileId) => `/drive/${fileId}?export=download`;
const buildAltMediaUrl = (fileId) => `/drive/${fileId}?alt=media`;

export const loadMusicDB = async () => {
  // the listing still needs an API key on the client side; it can be plain or
  // encrypted via the same mechanism used in setupProxy if desired.
  const encrypted = 'OvhqbQauHil0/B4CUlicuQDVB/SnBdfmGy8Od7A79VfaZBG62EDUcFlIgqTefD9Bpcqf9p2gYXXjiHiUej+XqrgMV+C805Xt7fvjqmLnO5vKOfjpTA==';
  const pass = 'novacoletanea';

  let apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  if (encrypted && pass) {
    try {
      const { scryptSync, createDecipheriv } = require('crypto');
      const buf = Buffer.from(encrypted, 'base64');
      const salt = buf.slice(0, 16);
      const iv = buf.slice(16, 28);
      const tag = buf.slice(28, 44);
      const ciphertext = buf.slice(44);
      const key = scryptSync(pass, salt, 32);
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      apiKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch (err) {
      console.warn('failed to decrypt API key in musicData', err);
    }
  }

  if (!apiKey) {
    throw new Error(
      "Configure REACT_APP_GOOGLE_API_KEY para listar os louvores da pasta pública do Google Drive."
    );
  }

  const query = encodeURIComponent(`'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`);
  const fields = encodeURIComponent("files(id,name,mimeType)");

  const files = [];
  let nextPageToken = "";

  do {
    const pageTokenParam = nextPageToken
      ? `&pageToken=${encodeURIComponent(nextPageToken)}`
      : "";

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields},nextPageToken&orderBy=name&pageSize=1000${pageTokenParam}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Não foi possível carregar os arquivos de áudio do Google Drive.");
    }

    const data = await response.json();
    files.push(...(data.files || []));
    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);

  return files
    .filter((file) => file.mimeType && file.mimeType.startsWith("audio/"))
    .map((file, index) => {
      const slug = createSlug(file.name);
      const metadata = metadataBySlug[slug] || {};

      return {
        id: file.id,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || "Artista desconhecido",
        album: metadata.album || "Google Drive",
        // Primary src: proxy endpoint, api key added by proxy
        src: buildAltMediaUrl(file.id),
        // Fallback src (same proxy with ?export=download)
        srcAlt: buildUcUrl(file.id),
        art: metadata.art || "https://via.placeholder.com/300x300?text=Album+Art",
        lyrics: lyricsData[slug] || [],
        order: index
      };
    });
};
