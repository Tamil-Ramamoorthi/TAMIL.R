<#
.SYNOPSIS
  Crops a rectangular region out of an image. No dependencies — uses the
  System.Drawing assembly that ships with Windows.

.DESCRIPTION
  Used to cut the hero portrait out of a larger source image. Also the tool to
  reach for when preparing `hero-ai.jpg`: the clean and futuristic hero images
  must come out at IDENTICAL dimensions, because the Phase 2 reveal moves only
  a mask and never transforms either layer.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/crop-image.ps1 `
    -In "source.jpg" -Out "public/images/hero-clean.jpg" `
    -X 610 -Y 60 -Width 540 -Height 720
#>
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out,
  [Parameter(Mandatory = $true)][int]$X,
  [Parameter(Mandatory = $true)][int]$Y,
  [Parameter(Mandatory = $true)][int]$Width,
  [Parameter(Mandatory = $true)][int]$Height,
  [int]$Quality = 92
)

Add-Type -AssemblyName System.Drawing

$inPath  = (Resolve-Path -LiteralPath $In).Path
$outPath = [System.IO.Path]::GetFullPath($Out)

$src = [System.Drawing.Image]::FromFile($inPath)
try {
  Write-Output ("source : {0} x {1}" -f $src.Width, $src.Height)

  if (($X + $Width) -gt $src.Width -or ($Y + $Height) -gt $src.Height) {
    throw "Crop box falls outside the source image."
  }

  $dst = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $target = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
  $source = New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)
  $g.DrawImage($src, $target, $source, [System.Drawing.GraphicsUnit]::Pixel)

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)

  $dst.Save($outPath, $codec, $params)

  Write-Output ("cropped: {0} x {1}  (box {2},{3})" -f $Width, $Height, $X, $Y)
  Write-Output ("written: {0}  ({1} bytes)" -f $outPath, (Get-Item -LiteralPath $outPath).Length)
}
finally {
  if ($g) { $g.Dispose() }
  if ($dst) { $dst.Dispose() }
  $src.Dispose()
}
