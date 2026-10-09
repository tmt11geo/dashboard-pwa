# TMT11 Dashboard PWA

A mobile-first engineering demo using simulated data. No external APIs, analytics, dependencies, or credentials.

## Publish and install

Keep GitHub Pages on `main` / `(root)`. Open `https://tmt11.com/dashboard-pwa/` in Android Chrome, sign in through your existing Cloudflare Access flow, then choose Chrome menu → Add to Home screen → Install. The in-page button uses `beforeinstallprompt` when Chrome exposes it.

All app paths are relative to support GitHub Pages project paths and custom domains. Manifest uses credentialed fetch for Access. App icons include 192px, 512px and a maskable 512px PNG.

## Authentication and offline behavior

Cloudflare policies are unchanged. Every navigation goes to the network. The service worker stores only the static offline notice after checking for redirects, content type and a page marker. It does not cache dashboard HTML, API data or sign-in pages. Offline navigation shows a reconnect notice. Already rendered content remains visible when connectivity changes. Public GitHub Pages origin and repository remain public.

The deployment's Cloudflare Access policy, redirects and headers must permit the browser to load the manifest, icons and service worker after sign-in. Installation through the protected domain still requires an Android device check.

## Demo interactions

Switch between seven and thirty days. Refresh demo changes simulated progress and tests; it does not fetch live measurements. All values reset on reload.

## Develop

Serve this folder using any static HTTP server on localhost. Production needs HTTPS. There is no build step. Use a new offline cache version when changing the offline notice. Modify sample data in app.js to connect a future data source; do not put secrets in static files.
