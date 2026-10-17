var SITE = "https://www.tumblr.com";

function state(html) {
  var m = /<script[^>]*id="___INITIAL_STATE___"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error("Captcha needed (tumblr page without data)");
  return JSON.parse(m[1]);
}

function posts(node, out) {
  if (!node || typeof node != "object") return out;
  if (node.objectType == "post" && node.postUrl) {
    out.push(node);
    return out;
  }
  for (var k in node) posts(node[k], out);
  return out;
}

function video(post) {
  var blocks = (post.content || []).slice();
  (post.trail || []).forEach(function (t) { blocks = blocks.concat(t.content || []); });
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    if (b.type != "video" || b.provider && b.provider != "tumblr") continue;
    var file = (b.media && b.media.url) || b.url;
    if (file) return { file: file, poster: (b.poster && b.poster[0] && b.poster[0].url) || null, block: b };
  }
  return null;
}

function item(post) {
  var v = video(post);
  if (!v || post.isNsfw || post.classification && post.classification != "clean") return null;
  var blog = post.blog || {};
  var avatar = blog.avatar && blog.avatar[blog.avatar.length - 1];
  return {
    url: SITE + "/" + post.blogName + "/" + (post.idString || post.id),
    title: (post.summary || "").replace(/\s+/g, " ").trim() || blog.title || post.blogName,
    author: blog.title || post.blogName,
    avatar: avatar && avatar.url,
    duration: -1,
    thumb: v.poster,
    date: post.timestamp
  };
}

function search(query, next) {
  var found = posts(state(http.get(SITE + "/search/" + encodeURIComponent(query) + "/video")), []);
  var items = [], seen = {};
  found.forEach(function (p) {
    var it = item(p);
    if (it && !seen[it.url]) {
      seen[it.url] = true;
      items.push(it);
    }
  });
  return { items: items, next: null };
}

function parts(url) {
  var m = /\/\/([A-Za-z0-9-]+)\.tumblr\.com\/post\/(\d+)/.exec(url)
      || /\/\/(?:www\.)?tumblr\.com\/(?:blog\/view\/)?([A-Za-z0-9-]+)\/(\d+)/.exec(url);
  if (!m || m[1] == "www") throw new Error("not a post");
  return m;
}

function resolve(url) {
  var m = parts(url);
  var found = posts(state(http.get(SITE + "/" + m[1] + "/" + m[2])), []);
  for (var i = 0; i < found.length; i++) {
    if (String(found[i].id) != m[2] && found[i].idString != m[2]) continue;
    var v = video(found[i]);
    if (v) return { url: v.file, hls: false, title: (found[i].summary || "").trim(), author: found[i].blogName };
  }
  throw new Error("no video in this post");
}

function tags(url) {
  var m = parts(url);
  var found = posts(state(http.get(SITE + "/" + m[1] + "/" + m[2])), []);
  for (var i = 0; i < found.length; i++) if (found[i].idString == m[2]) return { tags: found[i].tags || [] };
  return { tags: [] };
}
