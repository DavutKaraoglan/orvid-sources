var API = "https://api.openverse.org/v1/audio/";
var PAGE = 20;

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var root = http.json(API + "?mature=false&page_size=" + PAGE + "&page=" + page + "&q=" + encodeURIComponent(query));
  var items = [];
  (root.results || []).forEach(function (a) {
    if (!a.id || !a.url || a.mature) return;
    items.push({
      url: "https://openverse.org/audio/" + a.id,
      title: a.title || "",
      author: a.creator || "",
      duration: a.duration ? Math.round(a.duration / 1000) : -1,
      views: -1,
      thumb: a.thumbnail || null
    });
  });
  return { items: items, next: items.length && page < (root.page_count || 0) ? String(page + 1) : null };
}

function resolve(url) {
  var id = url.match(/openverse\.org\/(?:[a-z-]+\/)?audio\/([0-9a-f-]{36})/)[1];
  var a = http.json(API + id + "/");
  if (!a.url) throw new Error("audio unavailable");
  return { url: a.url, hls: false, title: a.title || "", author: a.creator || "" };
}
