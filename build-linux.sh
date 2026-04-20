#!/bin/bash
# Build script for Linux - creates AppImage and deb packages
# Run as regular user (no root required)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================"
echo "    Unreal Launcher Linux Builder"
echo "========================================"
echo

if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This script is for Linux builds only${NC}"
    exit 1
fi

# Parse args
MODE="full"
if [[ "$1" == "--unpack" || "$1" == "-u" ]]; then
    MODE="unpack"
fi

if [[ "$MODE" == "unpack" ]]; then
    echo -e "${CYAN}Mode: unpacked directory only (no AppImage/deb)${NC}"
    echo
    echo -e "${YELLOW}Building...${NC}"
    npm run build:linux:unpack
else
    echo -e "${CYAN}Mode: AppImage + deb${NC}"
    echo
    # Check for required tools
    if ! command -v fuse &>/dev/null && ! ls /dev/fuse &>/dev/null 2>&1; then
        echo -e "${YELLOW}Note: FUSE may not be available. AppImage build might require:${NC}"
        echo "  sudo apt-get install fuse libfuse2"
        echo "  or: APPIMAGE_EXTRACT_AND_RUN=1 npm run build:linux"
        echo
    fi
    echo -e "${YELLOW}Building...${NC}"
    npm run build:linux
fi

if [[ $? -eq 0 ]]; then
    echo
    echo -e "${GREEN}✓ Build completed successfully!${NC}"
    echo
    echo "Output:"
    if [[ "$MODE" == "unpack" ]]; then
        echo "  Portable: dist/linux-unpacked/"
    else
        echo "  AppImage: dist/*.AppImage"
        echo "  Debian:   dist/*.deb"
        echo "  Portable: dist/linux-unpacked/"
    fi
    echo
else
    echo
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
