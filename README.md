# Daily Tectonic

A LeetCode practice tracker drawn as a Suprematist building, made for DIGIHUM 2120 Creative Sprint 11 (Zaha Hadid).

Every day of practice adds one identical black shape that locks into a slanted, Vitra-like structure. Shapes crammed into the same day can't lock to each other, so they hover in red, fall slowly, and leave a dashed gap where they would have been.

## Files

- `index.html`, `style.css`, `app.js`: the piece. Plain HTML, CSS and JavaScript with no libraries.
- `content.json`: everything you'd edit. This includes the title, the subtitle, the cram size and the practice history.

## Using your real LeetCode history

`content.json` ships with **stand-in history** (made-up dates and counts) and **stand-in subtitle text**. To use your own data:

1. Replace `history` with your real days, one entry per day: `{ "date": "YYYY-MM-DD", "count": N }`.
2. Set `"standIn": false` to hide the stand-in banner.
3. Rewrite `text.subtitle` in your own words.

## Controls

- **Practice today**: adds one day with one problem. It locks.
- **Cram N problems**: adds one day with N problems. One locks, the rest fall.
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

## Credits

Built with help from Claude (Anthropic) for the code. The design decisions came out of an AI-assisted brainstorm documented in the sprint submission.
