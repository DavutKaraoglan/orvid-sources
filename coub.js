function picture(c) {
  var t = c.image_versions && c.image_versions.template;
  if (t && t.indexOf("%{version}") >= 0) return t.replace("%{version}", "med");
  return c.picture;
}

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var root = http.json("https://coub.com/api/v2/search/coubs?q=" + encodeURIComponent(query) + "&page=" + page);
  var items = [];
  (root.coubs || []).forEach(function (c) {
    if (!c.permalink || c.age_restricted || c.not_safe_for_work) return;
    items.push({
      url: "https://coub.com/view/" + c.permalink,
      title: c.title,
      author: c.channel && c.channel.title,
      duration: Math.round(c.duration || -1),
      views: c.views_count,
      thumb: picture(c),
      date: c.published_at || c.created_at
    });
  });
  return { items: items, next: page < (root.total_pages || 0) ? String(page + 1) : null };
}

function resolve(url) {
  var id = url.match(/coub\.com\/(?:view|embed)\/([A-Za-z0-9]+)/)[1];
  var c = http.json("https://coub.com/api/v2/coubs/" + id);
  var f = c.file_versions || {};
  var src = (f.share && f.share["default"]) || (f.html5 && f.html5.video && f.html5.video.high && f.html5.video.high.url);
  if (!src) throw new Error("video unavailable");
  return { url: src, hls: false, title: c.title, author: c.channel && c.channel.title };
}
