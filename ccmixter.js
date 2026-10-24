var API = "https://ccmixter.org/api/query";
var PAGE = 30;

function mp3(u) {
  var files = u.files || [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (f.download_url && f.file_format_info && f.file_format_info.mime_type == "audio/mpeg") return f;
  }
  return null;
}

function search(query, next) {
  var offset = next ? parseInt(next, 10) : 0;
  var list = http.json(API + "?f=json&limit=" + PAGE + "&offset=" + offset + "&search=" + encodeURIComponent(query));
  var items = [];
  (list || []).forEach(function (u) {
    var f = mp3(u);
    if (!f || !u.file_page_url) return;
    items.push({
      url: u.file_page_url,
      title: util.unescape(u.upload_name || ""),
      author: u.user_real_name || u.user_name || "",
      duration: f.file_format_info.ps ? util.duration(f.file_format_info.ps) : -1,
      views: -1,
      thumb: null,
      date: u.upload_date
    });
  });
  return { items: items, next: (list || []).length >= PAGE ? String(offset + PAGE) : null };
}

function resolve(url) {
  var id = url.match(/ccmixter\.org\/files\/[^\/]+\/(\d+)/)[1];
  var list = http.json(API + "?f=json&ids=" + id);
  var u = list && list[0];
  var f = u && mp3(u);
  if (!f) throw new Error("track unavailable");
  return { url: f.download_url, hls: false, referer: url, title: util.unescape(u.upload_name || ""), author: u.user_real_name || u.user_name || "" };
}
