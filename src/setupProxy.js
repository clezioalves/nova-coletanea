const { createProxyMiddleware } = require('http-proxy-middleware');
const { scryptSync, createDecipheriv } = require('crypto');

// Decrypt an encrypted API key produced by scripts/encryptApiKey.js
function decryptApiKey(tokenBase64, passphrase) {
  if (!tokenBase64 || !passphrase) return null;
  try {
    const buf = Buffer.from(tokenBase64, 'base64');
    // salt (16) | iv (12) | tag (16) | ciphertext (rest)
    const salt = buf.slice(0, 16);
    const iv = buf.slice(16, 28);
    const tag = buf.slice(28, 44);
    const ciphertext = buf.slice(44);

    const key = scryptSync(passphrase, salt, 32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.warn('Failed to decrypt ENCRYPTED_DRIVE_API_KEY', err);
    return null;
  }
}

// This file is automatically used by Create React App when running `npm start`.
// It allows us to proxy certain paths to a remote server and inject headers.

module.exports = function (app) {
  // decrypt api key from environment if provided
  const encrypted = 'OvhqbQauHil0/B4CUlicuQDVB/SnBdfmGy8Od7A79VfaZBG62EDUcFlIgqTefD9Bpcqf9p2gYXXjiHiUej+XqrgMV+C805Xt7fvjqmLnO5vKOfjpTA==';
  const passphrase = 'novacoletanea';
  const fallbackKey = process.env.REACT_APP_GOOGLE_API_KEY;
  let apiKey = null;

  if (encrypted && passphrase) {
    apiKey = decryptApiKey(encrypted, passphrase);
    if (apiKey) console.log('Drive API key decrypted successfully (proxy)');
  }
  if (!apiKey && fallbackKey) {
    apiKey = fallbackKey;
    console.log('Using REACT_APP_GOOGLE_API_KEY as fallback (proxy)');
  }

  app.use(
    '/drive',
    createProxyMiddleware({
      target: 'https://www.googleapis.com/drive/v3/files',
      changeOrigin: true,
      pathRewrite: {
        '^/drive/': '/', // strip the /drive prefix
      },
      onProxyReq: (proxyReq, req, res) => {
        // ensure API key is present on every request
        if (apiKey) {
          const url = new URL(proxyReq.path, 'https://www.googleapis.com');
          url.searchParams.set('key', apiKey);
          proxyReq.path = url.pathname + url.search;
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // add CORS header so the browser's <audio> element can load it
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      },
    })
  );
};