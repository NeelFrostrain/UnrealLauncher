#!/bin/bash
# Build script for Linux - creates AppImage and other Linux packages
# This script can be run as regular user (no admin required for Linux builds)

set -e

echo "========================================"
echo "    Unreal Launcher Linux Builder"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This script is for Linux builds only${NC}"
    echo "Use build-installer.ps1 on Windows"
    exit 1
fi

echo "Building Unreal Launcher for Linux..."
echo

# Build all components
echo -e "${YELLOW}Building components...${NC}"
npm run build:linux

if [[ $? -eq 0 ]]; then
    echo
    echo -e "${GREEN}✓ Build completed successfully!${NC}"
    echo
    echo "Output locations:"
    echo "  - AppImage: dist/*.AppImage"
    echo "  - Debian: dist/*.deb"
    echo "  - Portable: dist/linux-unpacked/"
    echo
else
    echo
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi