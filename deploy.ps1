$src = "C:\Users\Bsaas3\.gemini\antigravity-ide\brain\d5d521dd-7f56-4941-b612-4d71af7a4e8f\scratch"
$dest = "c:\My_Project\Piu"

$dirs = @(
    "Models", "Services", "Pages\Shared", 
    "wwwroot\css", "wwwroot\js", 
    "wwwroot\images\hero", "wwwroot\images\gallery", 
    "wwwroot\images\memories", "wwwroot\images\letters", 
    "wwwroot\images\final", "wwwroot\images\cake",
    "wwwroot\images\gifts", "wwwroot\images\flowers",
    "wwwroot\images\chocolates", "wwwroot\audio",
    "wwwroot\audio\birthday-voice", "wwwroot\audio\effects",
    "wwwroot\audio\music"
)
foreach ($d in $dirs) {
    $fullPath = Join-Path $dest $d
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
    }
}

Copy-Item -Path "$src\*" -Destination $dest -Recurse -Force

$imgDir = "C:\Users\Bsaas3\.gemini\antigravity-ide\brain\d5d521dd-7f56-4941-b612-4d71af7a4e8f"
$heroImg = Join-Path $imgDir "hero_romantic_cinematic_1788966086092.jpg"
$handsImg = Join-Path $imgDir "memory_holding_hands_1788966108841.jpg"
$letterImg = Join-Path $imgDir "romantic_letter_rose_1788966126272.jpg"

Copy-Item $heroImg "$dest\wwwroot\images\hero\demo.jpg" -Force
Copy-Item $heroImg "$dest\wwwroot\images\gallery\01_sunset_terrace.jpg" -Force
Copy-Item $handsImg "$dest\wwwroot\images\gallery\02_intertwined_hands.jpg" -Force
Copy-Item $letterImg "$dest\wwwroot\images\gallery\03_vintage_letter.jpg" -Force

Copy-Item $handsImg "$dest\wwwroot\images\memories\demo1.jpg" -Force
Copy-Item $letterImg "$dest\wwwroot\images\memories\demo2.jpg" -Force
Copy-Item $heroImg "$dest\wwwroot\images\memories\demo3.jpg" -Force

Copy-Item $letterImg "$dest\wwwroot\images\letters\demo.jpg" -Force
Copy-Item $heroImg "$dest\wwwroot\images\final\demo.jpg" -Force

Write-Output "Files copied and images distributed successfully."
