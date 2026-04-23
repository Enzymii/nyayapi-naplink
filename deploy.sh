#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [[ ! -f ".env" ]]; then
  echo "[ERROR] .env not found. Copy .env.example to .env and fill required values."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[ERROR] docker compose plugin is not available."
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "[ERROR] git is not installed."
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "[INFO] Fetching latest code on branch: ${CURRENT_BRANCH}"
git fetch --all --prune
git pull --ff-only origin "${CURRENT_BRANCH}"

echo "[INFO] Building and restarting containers"
docker compose up -d --build --remove-orphans

echo "[INFO] Cleaning dangling images"
docker image prune -f >/dev/null 2>&1 || true

echo "[OK] Deploy completed successfully."
echo "[INFO] Follow logs with: docker compose logs -f bot"
