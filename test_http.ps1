$endpoints = @(
    "http://127.0.0.1:5248/",
    "http://127.0.0.1:5248/css/site.css",
    "http://127.0.0.1:5248/js/site.js",
    "http://127.0.0.1:5248/images/hero/demo.jpg",
    "http://127.0.0.1:5248/images/gallery/01_sunset_terrace.jpg",
    "http://127.0.0.1:5248/images/memories/demo1.jpg",
    "http://127.0.0.1:5248/images/letters/demo.jpg",
    "http://127.0.0.1:5248/images/final/demo.jpg"
)

foreach ($url in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing
        Write-Output "GET $url -> Status $($r.StatusCode), Length $($r.Content.Length)"
    } catch {
        Write-Output "GET $url -> FAILED: $($_.Exception.Message)"
    }
}
