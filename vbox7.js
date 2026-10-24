var SITE = "https://www.vbox7.com";

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var html = http.get(SITE + "/search?vbox_q=" + encodeURIComponent(query) + (page > 1 ? "&page=" + page : ""));
  var items = [];
  var seen = {};
  var cards = html.split('<div class="card video-cell');
  for (var i = 1; i < cards.length; i++) {
    var b = cards[i];
    var link = b.match(/<a href="\/play:([a-z0-9]+)" title="([^"]*)"/);
    if (!link || seen[link[1]]) continue;
    seen[link[1]] = true;
    var thumb = b.match(/<img src="(https:\/\/[^"]+\.jpg)"/);
    var dur = b.match(/<span class="dur">([0-9:]+)<\/span>/);
    var views = b.match(/#eye"><\/use><\/svg>\s*<span>([\d\s.,]+)<\/span>/);
    var channel = b.match(/class="channel-name"[\s\S]*?<span>([^<]+)<\/span>/);
    items.push({
      url: SITE + "/play:" + link[1],
      title: util.unescape(link[2]),
      author: channel ? util.unescape(channel[1]).trim() : "",
      duration: dur ? util.duration(dur[1]) : -1,
      views: views ? util.number(views[1].replace(/[\s.,]/g, "")) : -1,
      thumb: thumb ? thumb[1] : null
    });
  }
  return { items: items, next: items.length >= 20 ? String(page + 1) : null };
}

function resolve(url) {
  var id = url.match(/play:([a-z0-9]+)/)[1];
  var root = http.json(SITE + "/aj/player/item/options?vid=" + id, { "X-Requested-With": "XMLHttpRequest", Referer: url });
  if (!root.success || !root.options || !/^https?:\/\//.test(root.options.src || "")) throw new Error("video unavailable");
  var o = root.options;
  if (/\/vn\/vn_\d+\.mp4/.test(o.src)) throw new Error("not available in this region");
  if (o.drm) throw new Error("protected video");
  return { url: o.src, hls: false, dash: o.src.indexOf(".mpd") >= 0, title: o.title || "", author: o.uploader || "", referer: SITE + "/" };
}
