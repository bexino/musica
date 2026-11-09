# A native launcher splash is visible while Electron itself is still extracting.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot 'build'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$bitmap = New-Object System.Drawing.Bitmap 520,220
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$titleFont = New-Object System.Drawing.Font 'Microsoft YaHei',22
$bodyFont = New-Object System.Drawing.Font 'Microsoft YaHei',11
$titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#fff4ee'))
$bodyBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#d4c5d4'))
$format = New-Object System.Drawing.StringFormat
try {
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#211a28'))
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  # Unicode escapes keep this script compatible with Windows PowerShell 5.1.
  $title = -join (0x821e,0x53f0,0x6b4c,0x8bcd,0x64ad,0x653e,0x5668 | ForEach-Object { [char]$_ })
  $loading = -join (0x6b63,0x5728,0x542f,0x52a8,0xff0c,0x8bf7,0x7a0d,0x5019,0x2026 | ForEach-Object { [char]$_ })
  $hint = -join (0x65e0,0x9700,0x91cd,0x590d,0x53cc,0x51fb | ForEach-Object { [char]$_ })
  $graphics.DrawString($title, $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(0,48,520,50), $format)
  $graphics.DrawString($loading, $bodyFont, $bodyBrush, [System.Drawing.RectangleF]::new(0,116,520,28), $format)
  $graphics.DrawString($hint, $bodyFont, $bodyBrush, [System.Drawing.RectangleF]::new(0,151,520,28), $format)
  $bitmap.Save((Join-Path $outputDirectory 'startup.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
} finally {
  $format.Dispose()
  $titleBrush.Dispose()
  $bodyBrush.Dispose()
  $titleFont.Dispose()
  $bodyFont.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
