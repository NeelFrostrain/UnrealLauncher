#!/bin/bash
# Run from project root or docker/ subfolder — both work
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$(basename "$SCRIPT_DIR")" == "docker" ]]; then
    cd "$SCRIPT_DIR/.."
else
    cd "$SCRIPT_DIR"
fi

echo "Building Unreal Launcher Docker Image..."

docker build -f docker/Dockerfile -t unreal-launcher-build .

echo "Extracting build artifacts..."

mkdir -p dist

VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="Unreal Launcher $VERSION.zip"

CONTAINER_ID=$(docker create unreal-launcher-build)
docker cp "$CONTAINER_ID:/app/$ZIP_NAME" "./dist/$ZIP_NAME"
docker rm "$CONTAINER_ID"

echo "Success! Build artifact is at: ./dist/$ZIP_NAME"
