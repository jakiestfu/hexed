#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kaitai-struct-compiler is already installed
if command -v kaitai-struct-compiler &> /dev/null; then
    echo -e "${GREEN}✓ kaitai-struct-compiler is already installed${NC}"
    kaitai-struct-compiler --version
    exit 0
fi

echo -e "${YELLOW}Installing kaitai-struct-compiler...${NC}"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)
        echo "Detected Linux"
        
        # Check if apt-get is available
        if ! command -v apt-get &> /dev/null; then
            echo -e "${RED}Error: apt-get is not available. This script requires a Debian-based Linux distribution.${NC}"
            exit 1
        fi
        
        # Check if curl is available
        if ! command -v curl &> /dev/null; then
            echo -e "${RED}Error: curl is not installed. Please install curl first.${NC}"
            exit 1
        fi
        
        VERSION="0.11"
        DEB_FILE="kaitai-struct-compiler_${VERSION}_all.deb"
        DOWNLOAD_URL="https://github.com/kaitai-io/kaitai_struct_compiler/releases/download/${VERSION}/${DEB_FILE}"
        TEMP_DIR=$(mktemp -d)
        
        echo "Downloading kaitai-struct-compiler ${VERSION}..."
        curl -fsSL -o "${TEMP_DIR}/${DEB_FILE}" "${DOWNLOAD_URL}"
        
        echo "Installing kaitai-struct-compiler..."
        sudo apt-get install -y "${TEMP_DIR}/${DEB_FILE}"
        
        # Cleanup
        rm -rf "${TEMP_DIR}"
        
        echo -e "${GREEN}✓ Successfully installed kaitai-struct-compiler${NC}"
        kaitai-struct-compiler --version
        ;;
    Darwin*)
        echo "Detected macOS"
        
        # Check if Homebrew is available
        if ! command -v brew &> /dev/null; then
            echo -e "${RED}Error: Homebrew is not installed. Please install Homebrew first.${NC}"
            echo "Visit https://brew.sh for installation instructions."
            exit 1
        fi
        
        echo "Installing kaitai-struct-compiler via Homebrew..."
        brew install kaitai-struct-compiler
        
        echo -e "${GREEN}✓ Successfully installed kaitai-struct-compiler${NC}"
        kaitai-struct-compiler --version
        ;;
    *)
        echo -e "${RED}Error: Unsupported operating system: ${OS}${NC}"
        echo "This script supports macOS and Linux only."
        exit 1
        ;;
esac
