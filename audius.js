var API = "https://discoveryprovider.audius.co/v1";
var APP = "app_name=orvid";
var PAGE = 30;

function art(t) {
  var a = t.artwork || {};
  return a["480x480"] || a["150x150"] || a["1000x1000"] || null;
}

function search(query, next) {
  var offset = next ? parseInt(next, 10) : 0;
  var root = http.json(API + "/tracks/search?query=" + encodeURIComponent(query) + "&limit=" + PAGE + "&offset=" + offset + "&" + APP);
  var items = [];
  (root.data || []).forEach(function (t) {
    if (!t.permalink || t.is_streamable === false || t.is_delete) return;
    items.push({
      url: "https://audius.co" + t.permalink,
      title: t.title,
      author: t.user && t.user.name,
      duration: t.duration || -1,
      views: t.play_count,
      thumb: art(t),
      date: t.release_date || t.created_at
    });
  });
  return { items: items, next: (root.data || []).length >= PAGE ? String(offset + PAGE) : null };
}

function resolve(url) {
  var t = http.json(API + "/resolve?url=" + encodeURIComponent(url) + "&" + APP).data;
  if (!t || !t.id) throw new Error("track unavailable");
  var at = http.check(API + "/tracks/" + t.id + "/stream?" + APP);
  var media = at.location || API + "/tracks/" + t.id + "/stream?" + APP;
  return { url: media, hls: false, title: t.title, author: t.user && t.user.name };
}
