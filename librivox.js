var SITE = "https://librivox.org";

function strip(s) {
  return util.unescape(s.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function search(query, next) {
  var page = next ? parseInt(next, 10) : 1;
  var root = http.json(SITE + "/advanced_search?title=&author=&reader=&keywords=&genre_id=0&status=complete&project_type=either"
      + "&recorded_language=&sort_order=catalog_date&search_form=advanced&search_page=" + page + "&q=" + encodeURIComponent(query),
      { "X-Requested-With": "XMLHttpRequest" });
  var html = root.results || "";
  var items = [];
  var seen = {};
  var cards = html.split('<li class="catalog-result">');
  for (var i = 1; i < cards.length; i++) {
    var b = cards[i];
    var link = b.match(/<a href="(https:\/\/librivox\.org\/[^"]+\/)" class="book-cover">/);
    if (!link || seen[link[1]]) continue;
    seen[link[1]] = true;
    var title = b.match(/<h3>([\s\S]*?)<\/h3>/);
    var author = b.match(/<p class="book-author">\s*<a[^>]*>([^<]+)<\/a>/);
    var cover = b.match(/<img src="(https:\/\/[^"]+)"/);
    items.push({
      url: link[1],
      title: title ? strip(title[1]) : "",
      author: author ? util.unescape(author[1]).trim() : "",
      duration: -1,
      views: -1,
      thumb: cover ? cover[1] : null
    });
  }
  var more = html.length && String(root.pagination || "").indexOf("data-page_number=\"" + (page + 1) + "\"") >= 0;
  return { items: items, next: items.length && more ? String(page + 1) : null };
}

function resolve(url) {
  var html = http.get(url);
  var mp3 = html.match(/href="(https:\/\/(?:www\.)?archive\.org\/download\/[^"]+_64kb\.mp3)"/) || html.match(/href="(https:\/\/(?:www\.)?archive\.org\/download\/[^"]+\.mp3)"/);
  if (!mp3) throw new Error("audiobook unavailable");
  var title = html.match(/<h1>([^<]+)/);
  var author = html.match(/class="book-page-author"><a[^>]*>([^<]+)</);
  return { url: mp3[1], hls: false, title: title ? util.unescape(title[1]).trim() : "", author: author ? util.unescape(author[1]).trim() : "" };
}
