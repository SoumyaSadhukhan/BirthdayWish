$dest = "c:\My_Project\Piu\wwwroot\images\gallery\surprise_beach_trip.webp"
Copy-Item "c:\My_Project\Piu\wwwroot\images\gallery\01_sunset_terrace.jpg" $dest -Force

$r = Invoke-WebRequest -Uri "http://127.0.0.1:5248/" -UseBasicParsing
if ($r.Content -like "*surprise_beach_trip.webp*") {
    Write-Output "SUCCESS: Dynamic image discovery automatically found and rendered surprise_beach_trip.webp!"
} else {
    Write-Output "FAILED: surprise_beach_trip.webp not found in rendered HTML"
}

# Clean up test file
Remove-Item $dest -Force
Write-Output "Cleaned up test file."
