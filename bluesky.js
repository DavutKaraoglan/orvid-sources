var API = "https://api.bsky.app/xrpc/";

function video(embed) {
  if (!embed) return null;
  if (embed.$type == "app.bsky.embed.video#view") return embed;
  if (embed.media && embed.media.$type == "app.bsky.embed.video#view") return embed.media;
  return null;
}

function item(p) {
  var v = video(p.embed);
  if (!v || !v.playlist) return null;
  var rkey = p.uri.split("/").pop();
  var a = p.author || {};
  return {
    url: "https://bsky.app/profile/" + a.handle + "/post/" + rkey,
    title: ((p.record || {}).text || "").replace(/\s+/g, " ").trim() || "@" + a.handle,
    author: a.displayName || a.handle,
    avatar: a.avatar,
    duration: -1,
    thumb: v.thumbnail,
    date: (p.record || {}).createdAt
  };
}

function search(query, next) {
  var root = http.json(API + "app.bsky.feed.searchPosts?limit=100&sort=top&q=" + encodeURIComponent(query)
      + (next ? "&cursor=" + encodeURIComponent(next) : ""));
  var items = [];
  (root.posts || []).forEach(function (p) {
    var it = item(p);
    if (it) items.push(it);
  });
  return { items: items, next: root.cursor && (root.posts || []).length ? root.cursor : null };
}

function post(url) {
  var m = /bsky\.app\/profile\/([^\/]+)\/post\/([a-z0-9]+)/.exec(url);
  if (!m) throw new Error("not a post");
  var did = m[1];
  if (did.indexOf("did:") != 0) did = http.json(API + "com.atproto.identity.resolveHandle?handle=" + encodeURIComponent(did)).did;
  var posts = http.json(API + "app.bsky.feed.getPosts?uris=" + encodeURIComponent("at://" + did + "/app.bsky.feed.post/" + m[2])).posts || [];
  if (!posts.length) throw new Error("video unavailable");
  return posts[0];
}

function resolve(url) {
  var p = post(url);
  var v = video(p.embed);
  if (!v || !v.playlist) throw new Error("no video in this post");
  return { url: v.playlist, hls: true, title: ((p.record || {}).text || "").trim(), author: (p.author || {}).displayName || "" };
}

function tags(url) {
  var p = post(url);
  var out = [];
  ((p.record || {}).facets || []).forEach(function (f) {
    (f.features || []).forEach(function (x) { if (x.tag) out.push(x.tag); });
  });
  return { tags: out };
}
