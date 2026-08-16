#!/usr/bin/env bash
#
# Pull the latest code and restart the app. Run ON THE SERVER:
#   cd /var/www/radiology && ./deploy.sh
#
set -euo pipefail

APP_DIR="/var/www/radiology"
APP_NAME="radiology"

cd "$APP_DIR"

echo "==> Current commit: $(git rev-parse --short HEAD)"

# Refuse to deploy over uncommitted local edits - they would be silently lost
# and the running code would stop matching the repository.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: uncommitted changes in $APP_DIR. Commit, stash or discard first." >&2
  git status --short >&2
  exit 1
fi

echo "==> Fetching..."
git pull --ff-only origin main

echo "==> Installing dependencies (clean, lockfile-exact)..."
npm ci

echo "==> Building..."
npm run build

echo "==> Restarting..."
pm2 restart "$APP_NAME" --update-env
pm2 save

echo "==> Deployed: $(git rev-parse --short HEAD)"
pm2 status "$APP_NAME"
