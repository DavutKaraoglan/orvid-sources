var SITE = "https://www.newgrounds.com";

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var html = http.get(SITE + "/search/conduct/movies?suitabilities=et&terms=" + encodeURIComponent(query) + "&page=" + page);
  var items = [];
  var blocks = html.split('class="item-portalsubmission"');
  for (var i = 1; i < blocks.length; i++) {
    var b = blocks[i];
    var start = blocks[i - 1].lastIndexOf("<a ");
    var head = blocks[i - 1].substring(start) + b.substring(0, 400);
    var id = head.match(/data-video-playback="(\d+)"/);
    if (!id) continue;
    var title = head.match(/title="([^"]*)"/);
    var author = b.match(/<span>\s*by\s*<strong>([^<]+)<\/strong>/);
    var thumb = b.match(/<img src="(https:\/\/picon\.ngfiles\.com\/[^"]+)"/);
    var seen = b.match(/<dd>([\d,]+) Views<\/dd>/);
    items.push({
      url: SITE + "/portal/view/" + id[1],
      title: title ? util.unescape(title[1]) : "",
      author: author ? util.unescape(author[1]) : "",
      duration: -1,
      views: seen ? util.number(seen[1]) : -1,
      thumb: thumb ? thumb[1] : null
    });
  }
  var more = html.indexOf("page=" + (page + 1)) >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function resolve(url) {
  var id = url.match(/portal\/view\/(\d+)/)[1];
  var d = http.json(SITE + "/portal/video/" + id, { "X-Requested-With": "XMLHttpRequest" });
  if (d.error) throw new Error(d.error.msg || "video unavailable");
  var cap = env.tor ? 720 : 1080, best = -1, file = null, smallest = null, low = 1e9, qualities = [];
  var src = d.sources || {};
  for (var k in src) {
    var h = k == "4k" ? 2160 : parseInt(k, 10);
    var list = src[k];
    if (!list || !list.length || !list[0].src) continue;
    qualities.push({ url: list[0].src, height: h });
    if (h <= cap && h > best) { best = h; file = list[0].src; }
    if (h < low) { low = h; smallest = list[0].src; }
  }
  file = file || smallest;
  if (!file) throw new Error("video unavailable");
  return { url: file, hls: false, title: d.title || "", author: d.author || "", referer: SITE + "/", qualities: qualities };
}
