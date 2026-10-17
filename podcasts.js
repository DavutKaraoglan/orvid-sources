function search(query, next) {
  var root = http.json("https://itunes.apple.com/search?media=podcast&entity=podcastEpisode&limit=50&term=" + encodeURIComponent(query));
  var items = [];
  (root.results || []).forEach(function (e) {
    if (!e.trackViewUrl || !/^https:/.test(e.episodeUrl || "")) return;
    items.push({
      url: e.trackViewUrl.replace(/&uo=\d+/, "") + "#" + encodeURIComponent(e.episodeUrl),
      title: e.trackName || "",
      author: e.collectionName || "",
      duration: e.trackTimeMillis > 0 ? Math.round(e.trackTimeMillis / 1000) : -1,
      thumb: e.artworkUrl600 || e.artworkUrl160,
      date: e.releaseDate
    });
  });
  return { items: items, next: null };
}

var TRACKERS = [
  /^https?:\/\/(?:www\.)?pdst\.fm\/e\//, /^https?:\/\/(?:www\.)?chtbl\.com\/track\/[^\/]+\//,
  /^https?:\/\/(?:www\.|dts\.)?podtrac\.com\/(?:pts\/)?redirect\.(?:mp3|m4a)\//, /^https?:\/\/op3\.dev\/e\/(?:[^\/]+\/)?/,
  /^https?:\/\/(?:www\.)?podscribe\.com\/[^\/]+\//, /^https?:\/\/chrt\.fm\/track\/[^\/]+\//,
  /^https?:\/\/pfx\.vpixl\.com\/[^\/]+\//, /^https?:\/\/(?:www\.)?arttrk\.com\/p\/[^\/]+\//,
  /^https?:\/\/mgln\.ai\/e\/[^\/]+\//, /^https?:\/\/tracking\.swap\.fm\/track\/[^\/]+\//,
  /^https?:\/\/verifi\.podscribe\.com\/rss\/p\//, /^https?:\/\/prfx\.byspotify\.com\/e\//, /^https?:\/\/pscrb\.fm\/rss\/p\//
];

function untrack(file) {
  for (var round = 0; round < 5; round++) {
    var changed = false;
    for (var i = 0; i < TRACKERS.length; i++) {
      if (TRACKERS[i].test(file)) {
        file = "https://" + file.replace(TRACKERS[i], "");
        changed = true;
      }
    }
    if (!changed) break;
  }
  return file.replace(/^https:\/\/https?:\/\//, "https://");
}

function resolve(url) {
  var m = /#(.+)$/.exec(url);
  if (!m) throw new Error("not an episode");
  var file = untrack(decodeURIComponent(m[1]));
  return { url: file, hls: false, title: "" };
}
