const { createProxyMiddleware } = require('http-proxy-middleware');

// The proxy needs a Google API key for Drive requests.  We prefer an
// environment variable so it can be managed securely on the server or CI.
// In development the caller should set REACT_APP_GOOGLE_API_KEY.

// This file is automatically used by Create React App when running `npm start`.
// It allows us to proxy certain paths to a remote server and inject headers.

module.exports = function (app) {
  // choose API key from env, with optional hardcoded development fallback
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  if (process.env.REACT_APP_GOOGLE_API_KEY) {
    console.log('Using REACT_APP_GOOGLE_API_KEY for Drive proxy');
  } else {
    console.log('Warning: using hardcoded fallback API key (development only)');
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