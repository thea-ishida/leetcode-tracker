# Daily Tectonic

A LeetCode practice tracker drawn as a Suprematist building, made for DIGIHUM 2120 Creative Sprint 11 (Zaha Hadid).

Every day of practice locks one identical black shape into a slanted, Vitra-like structure. On a cram day (10 or more submissions), the extra shapes can't lock to each other, so they hover in red, fall slowly, and leave a dashed gap where they would have been.

## Files

- `index.html`, `style.css`, `app.js`: the piece. Plain HTML, CSS and JavaScript with no libraries.
- `content.json`: everything you'd edit. This includes the title, the subtitle, the cram size and the practice history.

## The data

`history` in `content.json` is my real LeetCode submission calendar (public profile `theathechamp`), pulled on 25 Nov 2026. It covers 227 active days and 1,069 submissions since 26 Nov 2025.

LeetCode counts **submissions**, not problems solved, so retries are included. That's why a day only counts as a cram day at 10 or more submissions (`cramThreshold`). A normal day of practice with a few retries still locks one shape. On my 20 cram days, every submission after the first falls. This means the piece shows my practice rhythm, not an exact count of problems.

To update the data, replace `history` with a fresh calendar in the same `{ "date": "YYYY-MM-DD", "count": N }` format.

The subtitle in `content.json` is **stand-in text** and should be rewritten.

## Controls

- **Practice today**: adds one day with one submission. It locks.
- **Cram N submissions**: adds one day with N submissions (at least the threshold). One locks, the rest fall.
- **Replay history**: replays `content.json` from the start.
- **Clear**: empties the canvas.
- Hover over or tap a locked shape to see its date and that day's count.

## Run locally

`fetch` needs a server, so the page won't load data when opened as a file:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

1. Push: `git push -u origin main`. If asked for a password, use a personal access token.
2. On GitHub, go to Settings > Pages > Build and deployment > Deploy from a branch > `main`, `/ (root)` > Save.
3. After a minute or two the site is at https://thea-ishida.github.io/leetcode-tracker/
