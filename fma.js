var SITE = "https://freemusicarchive.org";

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var html = http.get(SITE + "/search/?quicksearch=" + encodeURIComponent(query) + (page > 1 ? "&page=" + page : ""));
  var items = [];
  var seen = {};
  var cards = html.split('class="play-item');
  for (var i = 1; i < cards.length; i++) {
    var b = cards[i];
    var info = b.match(/data-track-info='([^']+)'/);
    if (!info) continue;
    var t;
    try {
      t = JSON.parse(util.unescape(info[1]));
    } catch (e) {
      continue;
    }
    if (!t.url || seen[t.url]) continue;
    seen[t.url] = true;
    var dur = b.match(/>\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*<\/span>/);
    items.push({
      url: t.url,
      title: t.title || "",
      author: t.artistName || "",
      duration: dur ? util.duration(dur[1]) : -1,
      views: -1,
      thumb: null
    });
  }
  var more = html.indexOf("page=" + (page + 1)) >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function resolve(url) {
  var html = http.get(url);
  var infos = html.match(/data-track-info='[^']+'/g) || [];
  var t = null;
  var want = url.replace(/\/$/, "");
  for (var i = 0; i < infos.length && !t; i++) {
    try {
      var x = JSON.parse(util.unescape(infos[i].substring(17, infos[i].length - 1)));
      if (x.url && x.url.replace(/\/$/, "") == want) t = x;
    } catch (e) {
    }
  }
  var handle = want.split("/").pop();
  var stream = t && t.playbackUrl ? t.playbackUrl : SITE + "/track/" + handle + "/stream/";
  var at = http.check(stream);
  if (at.status >= 400) throw new Error("track unavailable");
  return { url: at.location || stream, hls: false, title: t ? t.title : decodeURIComponent(handle).replace(/_/g, " "), author: t ? t.artistName : "" };
}
