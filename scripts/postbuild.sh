#!/bin/bash
# Post-build: copy static files and public into standalone
set -e

STANDALONE=".next/standalone"

# Copy static chunks (required for JS/CSS loading)
if [ -d ".next/static" ]; then
  mkdir -p "$STANDALONE/.next"
  cp -r .next/static "$STANDALONE/.next/static"
  echo "[postbuild] Copied static files"
fi

# Copy public assets (images, fonts, etc.)
if [ -d "public" ]; then
  cp -r public "$STANDALONE/public"
  echo "[postbuild] Copied public assets"
fi

# Copy env vars
if [ -f ".env.local" ]; then
  cp .env.local "$STANDALONE/.env"
  echo "[postbuild] Copied .env.local"
fi

echo "[postbuild] Done"
