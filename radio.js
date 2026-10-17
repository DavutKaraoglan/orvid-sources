var MIRRORS = ["de1", "de2", "fi1"];

function api(path) {
  var last;
  for (var i = 0; i < MIRRORS.length; i++) {
    try {
      return http.json("https://" + MIRRORS[i] + ".api.radio-browser.info/json/" + path);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
var PAGE = 40;

function item(s) {
  var tags = (s.tags || "").split(",").slice(0, 3).join(", ");
  return {
    url: "https://www.radio-browser.info/history/" + s.stationuuid,
    title: (s.name || "").trim(),
    author: [s.country, tags].filter(function (x) { return x; }).join(", "),
    duration: -1,
    views: s.clickcount,
    thumb: /^https:/.test(s.favicon || "") ? s.favicon : null
  };
}

function search(query, next) {
  var offset = next ? parseInt(next, 10) : 0;
  var list = api("stations/search?name=" + encodeURIComponent(query) + "&limit=" + PAGE + "&offset=" + offset
      + "&hidebroken=true&order=clickcount&reverse=true");
  var items = [];
  list.forEach(function (s) {
    if (/^https:/.test(s.url_resolved || "")) items.push(item(s));
  });
  return { items: items, next: list.length >= PAGE ? String(offset + PAGE) : null };
}

function resolve(url) {
  var m = /radio-browser\.info\/history\/([0-9a-f-]{36})/.exec(url);
  if (!m) throw new Error("not a station");
  var s = api("stations/byuuid/" + m[1])[0];
  if (!s || !/^https:/.test(s.url_resolved || "")) throw new Error("station unavailable");
  return { url: s.url_resolved, hls: s.hls == 1 || /\.m3u8/.test(s.url_resolved), title: s.name, author: s.country || "" };
}
