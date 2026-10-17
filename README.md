# Orvid sources

Source repository for [Orvid](https://github.com/DavutKaraoglan/orvid). Orvid ships without sources. To add this repository, open Filters → Repositories → Add repository in Orvid and paste:

```
https://raw.githubusercontent.com/DavutKaraoglan/orvid-sources/main/
```

## Other repositories

Orvid also lists these under Filters → Repositories once this repository is added.

| Repository | Link |
|---|---|
| Orvid secret (18+) | `https://raw.githubusercontent.com/DavutKaraoglan/orvid-sources-secret/main/` |

## Source format

Each source is one JSON file with an `id`, a `name` and one of three bodies:

- `engine`: turns on a source built into Orvid, such as `youtube`.
- `html`: describes a site's search page with a card marker and regular expressions for link, title, thumbnail, duration and views. Orvid finds the stream in the video page (`<source>` tags, KVS players, an optional `iframe`).
- `script`: a JavaScript file with `search(query, next)` and `resolve(url)`. Scripts run in a sandbox and reach the network only through `http.get`, `http.post` and `http.json`, which go over Tor. `util.duration`, `util.number` and `util.unescape` parse common page text.

`match` is the regular expression for the source's video links, `adult` marks 18+ sources, `weight` (0.1 to 1) sets how high results rank and `lang` limits a source to queries in one script (`cyrillic`, `arabic`, `hangul`).

`search` returns `{items: [{url, title, author, duration, views, thumb, date}], next}`. `resolve` returns `{url, hls, referer, title, author}`.

## Build

```sh
python3 tools/build.py
```

The script hashes every file into `index.json` and signs it into `index.sig` with the EC key in `ORVID_SOURCES_KEY` (default `~/keys/orvid-sources.pem`). Orvid pins the key the first time a repository is added and refuses updates signed with another key.

## License

GPL-3.0-or-later.
