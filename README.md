# The Chess

A browser-based four-player chess game with a 14x14 board, four colored armies, team play, legal-move highlighting, captures, castling, promotion, check/checkmate status, move log, undo, and a polished responsive UI.

## Play locally

Open `index.html` in a browser, or run a tiny static server:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

## Verify

```bash
npm test
```

## Project structure

```text
index.html          Main playable web app
css/style.css       Extra stylesheet for modular version
js/                 Modular engine/render files
scripts/verify.js   Static verification test
```
