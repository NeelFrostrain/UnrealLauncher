#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "Building Unreal Launcher Docker Image..."

# Build the docker image
docker build -t unreal-launcher-build .

echo "Extracting build artifacts..."

# Create the dist directory if it doesn't exist
mkdir -p dist

# Get the version from package.json
VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="Unreal Launcher $VERSION.zip"

# Run a temporary container to copy the zip file out
CONTAINER_ID=$(docker create unreal-launcher-build)
docker cp "$CONTAINER_ID:/app/$ZIP_NAME" "./dist/$ZIP_NAME"
docker rm "$CONTAINER_ID"

echo "Success! Build artifact is at: ./dist/$ZIP_NAME"
