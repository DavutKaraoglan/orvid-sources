var API = "https://api.ardaudiothek.de";
var PAGE = 30;

function image(x) {
  var u = x.image && (x.image.url || x.image.url1X1);
  return u ? u.replace("{width}", "480") : null;
}

function search(query, next) {
  var offset = next ? parseInt(next, 10) : 0;
  var root = http.json(API + "/search/items?limit=" + PAGE + "&offset=" + offset + "&query=" + encodeURIComponent(query));
  var list = root.data && root.data.search && root.data.search.items || {};
  var items = [];
  (list.nodes || []).forEach(function (x) {
    if (!x.sharingUrl || !x.audios || !x.audios.length || !x.audios[0].url) return;
    items.push({
      url: x.sharingUrl,
      title: x.title || "",
      author: x.programSet && x.programSet.title || "",
      duration: x.duration || -1,
      views: -1,
      thumb: image(x),
      date: x.publicationStartDateAndTime
    });
  });
  var total = list.numberOfElements || 0;
  return { items: items, next: offset + PAGE < total ? String(offset + PAGE) : null };
}

function resolve(url) {
  var urn = url.match(/(urn:ard:episode:[0-9a-f]+)/)[1];
  var x = http.json(API + "/items/" + urn).data.item;
  if (!x || !x.audios || !x.audios.length || !x.audios[0].url) throw new Error("episode unavailable");
  return { url: x.audios[0].url, hls: x.audios[0].url.indexOf(".m3u8") >= 0, title: x.title || "", author: x.programSet && x.programSet.title || "" };
}
