const GOOGLE_DRIVE_FOLDER_ID = "1dTuzWuaoVrPAKVocEq5MrOgsTQvWNZme";
const FIREBASE_RTDB_BASE_URL =
  process.env.REACT_APP_FIREBASE_RTDB_BASE_URL ||
  "https://novacoletanea-c4878-default-rtdb.firebasedatabase.app";

const metadataBySlug = {
  "a-sombra-de-tuas-palavras": {
    title: "A sombra de Tuas Palavras",
    artist: "Filho Varão",
    album: "Coletânea Filho Varão"
  },
};

const createSlug = (fileName) =>
  fileName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// In development we use the local proxy defined in `setupProxy.js` so that
// the browser can fetch from Google Drive without CORS or exposing the API
// key.  The proxy is **not** active on a deployed site (it only runs when
// `react-scripts start` is used), so in production we construct the full
// Google URL directly and include the API key query parameter.

const buildUcUrl = (fileId) => {
  if (process.env.NODE_ENV === "development") {
    return `/drive/${fileId}?export=download`;
  }
  // production: direct API request with key
  const key = process.env.REACT_APP_GOOGLE_API_KEY;
  return `https://www.googleapis.com/drive/v3/files/${fileId}?export=download${
    key ? `&key=${key}` : ""
  }`;
};

const buildAltMediaUrl = (fileId) => {
  if (process.env.NODE_ENV === "development") {
    return `/drive/${fileId}?alt=media`;
  }
  const key = process.env.REACT_APP_GOOGLE_API_KEY;
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media${
    key ? `&key=${key}` : ""
  }`;
};

export const loadMusicDB = async () => {
  // the listing needs a Google API key on the client side. we expect callers
  // to configure REACT_APP_GOOGLE_API_KEY in their environment. a hardcoded
  // fallback is provided merely for local development convenience.
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  if (!process.env.REACT_APP_GOOGLE_API_KEY) {
    console.warn('REACT_APP_GOOGLE_API_KEY not set; using development fallback');
  }

  if (!apiKey) {
    // should never happen since we have a fallback, but keep the check for
    // completeness in case future changes remove the hardcoded key.
    throw new Error(
      "Configure REACT_APP_GOOGLE_API_KEY para listar os áudios da pasta pública do Google Drive."
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
        slug,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist || "Artista desconhecido",
        album: metadata.album || "Nova Coletânea",
        // Primary src: proxy endpoint, api key added by proxy
        src: buildAltMediaUrl(file.id),
        // Fallback src (same proxy with ?export=download)
        srcAlt: buildUcUrl(file.id),
        //art: metadata.art || "https://via.placeholder.com/300x300?text=Album+Art",
        order: index
      };
    });
};

export const loadLyricsBySlug = async (slug) => {
  if (!slug) {
    return [];
  }

  const response = await fetch(
    `${FIREBASE_RTDB_BASE_URL}/${encodeURIComponent(slug)}.json`
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar a letra da música selecionada.");
  }

  const lyrics = await response.json();
  return Array.isArray(lyrics) ? lyrics : [];
};
