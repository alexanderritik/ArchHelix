#!/bin/bash
set -e

REPO="alexanderritik/ArchHelix"
BIN_NAME="archhelix"
INSTALL_DIR="/usr/local/bin"

if [ "$EUID" -ne 0 ]; then
  # If we're not root, try using sudo for the final install commands later
  USE_SUDO="sudo"
else
  USE_SUDO=""
fi

OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
    Linux*)     OS_NAME=linux;;
    Darwin*)    OS_NAME=darwin;;
    *)          echo "Unsupported OS: ${OS}"; exit 1;;
esac

case "${ARCH}" in
    x86_64*)    ARCH_NAME=amd64;;
    arm64*|aarch64*) ARCH_NAME=arm64;;
    *)          echo "Unsupported Architecture: ${ARCH}"; exit 1;;
esac

TAG=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "$TAG" ]; then
    echo "Could not find latest release tag"
    exit 1
fi

ASSET_NAME="${BIN_NAME}-${OS_NAME}-${ARCH_NAME}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET_NAME}"

echo "Downloading ${ASSET_NAME} from ${TAG}..."
$USE_SUDO curl -sL "$DOWNLOAD_URL" -o "${INSTALL_DIR}/${BIN_NAME}"

$USE_SUDO chmod +x "${INSTALL_DIR}/${BIN_NAME}"

echo "Done! You can now run '${BIN_NAME}'"
