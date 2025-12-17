# PWA Icon Generator Script

# You need to create PWA icons in various sizes
# Use this online tool or script to generate icons from your logo:

## Option 1: Online Tools (Easiest)
# 1. Visit: https://www.pwabuilder.com/imageGenerator
# 2. Upload your logo (recommended: 512x512 PNG with transparent background)
# 3. Download the generated icon pack
# 4. Extract to: rentverse-frontend/public/icons/

## Option 2: Using ImageMagick (Command Line)
# Install ImageMagick: https://imagemagick.org/script/download.php
# Then run these commands:

# Windows PowerShell:
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($size in $sizes) {
    magick convert logo.png -resize "${size}x${size}" "public/icons/icon-${size}x${size}.png"
}

# Linux/Mac:
# for size in 72 96 128 144 152 192 384 512; do
#   convert logo.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
# done

## Option 3: Manual Creation
# Create these icon sizes manually in your image editor:
# - icon-72x72.png
# - icon-96x96.png
# - icon-128x128.png
# - icon-144x144.png
# - icon-152x152.png
# - icon-192x192.png
# - icon-384x384.png
# - icon-512x512.png

## Quick Fix (Temporary)
# If you don't have icons ready, create placeholder files:
# Copy any existing logo to all required sizes

Write-Host "Creating icon directory..."
New-Item -ItemType Directory -Force -Path "public/icons"

Write-Host @"

PWA Icon Setup Instructions:
=============================

1. Place your logo.png (512x512, transparent background) in this directory
2. Run one of the generation methods above
3. Icons will be created in: public/icons/

Required icon sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

For shortcuts (optional):
- search-96x96.png
- profile-96x96.png
- admin-96x96.png

"@
