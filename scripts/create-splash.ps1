# A native launcher splash is visible while Electron itself is still extracting.
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot 'build'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$bitmap = New-Object System.Drawing.Bitmap 520,220
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$titleFont = New-Object System.Drawing.Font 'Microsoft YaHei',22
$titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#fff4ee'))
$format = New-Object System.Drawing.StringFormat
try {
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#211a28'))
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  # Unicode escapes keep this script compatible with Windows PowerShell 5.1.
  $loading = -join (0x52a0,0x8f7d,0x4e2d | ForEach-Object { [char]$_ })
  $graphics.DrawString($loading, $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(0,90,520,50), $format)
  $bitmap.Save((Join-Path $outputDirectory 'startup.bmp'), [System.Drawing.Imaging.ImageFormat]::Bmp)
} finally {
  $format.Dispose()
  $titleBrush.Dispose()
  $titleFont.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
