#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

MONOREPO_ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")

# --- Frontend (AR Viewer) Sync ---
FRONTEND_REPO="https://github.com/petrkrulis2022/ar-agent-viewer-web-man-US.git"
FRONTEND_BRANCH="revolut-qr-payments"
FRONTEND_DIR="$MONOREPO_ROOT/frontend"

echo "🔄 Syncing AR Viewer (frontend) from $FRONTEND_REPO branch $FRONTEND_BRANCH..."

mkdir -p /tmp/ar-viewer-temp
git clone --depth 1 --branch $FRONTEND_BRANCH $FRONTEND_REPO /tmp/ar-viewer-temp

rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/ar-viewer-temp/src/ "$FRONTEND_DIR/src/"
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/ar-viewer-temp/public/ "$FRONTEND_DIR/public/"
rsync -av /tmp/ar-viewer-temp/package.json "$FRONTEND_DIR/"
rsync -av /tmp/ar-viewer-temp/package-lock.json "$FRONTEND_DIR/"
rsync -av /tmp/ar-viewer-temp/vite.config.js "$FRONTEND_DIR/"
rsync -av /tmp/ar-viewer-temp/tailwind.config.js "$FRONTEND_DIR/" || true
rsync -av /tmp/ar-viewer-temp/postcss.config.js "$FRONTEND_DIR/" || true
rsync -av /tmp/ar-viewer-temp/tsconfig.json "$FRONTEND_DIR/" || true
rsync -av /tmp/ar-viewer-temp/index.html "$FRONTEND_DIR/" || true
rsync -av /tmp/ar-viewer-temp/.env "$FRONTEND_DIR/.env.local" || true
rsync -av /tmp/ar-viewer-temp/.env.local "$FRONTEND_DIR/" || true

rm -rf /tmp/ar-viewer-temp
echo "✅ AR Viewer sync complete."

# --- Backend (Agentsphere) Sync ---
BACKEND_REPO="https://github.com/petrkrulis2022/agentsphere-full-web-man-US.git"
BACKEND_BRANCH="revolut-pay"
BACKEND_DIR="$MONOREPO_ROOT/backend"

echo "🔄 Syncing Agentsphere (backend) from $BACKEND_REPO branch $BACKEND_BRANCH..."

mkdir -p /tmp/agentsphere-temp
git clone --depth 1 --branch $BACKEND_BRANCH $BACKEND_REPO /tmp/agentsphere-temp

rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/src/ "$BACKEND_DIR/src/"
rsync -av /tmp/agentsphere-temp/package.json "$BACKEND_DIR/"
rsync -av /tmp/agentsphere-temp/package-lock.json "$BACKEND_DIR/"
rsync -av /tmp/agentsphere-temp/.env "$BACKEND_DIR/" || true
rsync -av /tmp/agentsphere-temp/server.js "$BACKEND_DIR/" || true
rsync -av /tmp/agentsphere-temp/app.js "$BACKEND_DIR/" || true

# Copy any additional backend files/directories
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/config/ "$BACKEND_DIR/config/" || true
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/models/ "$BACKEND_DIR/models/" || true
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/routes/ "$BACKEND_DIR/routes/" || true
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/controllers/ "$BACKEND_DIR/controllers/" || true
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/services/ "$BACKEND_DIR/services/" || true
rsync -av --exclude=".git" --exclude="node_modules" --exclude="dist" /tmp/agentsphere-temp/middleware/ "$BACKEND_DIR/middleware/" || true

rm -rf /tmp/agentsphere-temp
echo "✅ Agentsphere sync complete."

echo "🚀 Monorepo synchronization finished."
