#!/bin/bash
set -euo pipefail

#
# Achilles Vault — App Store Build Script
#
# Builds the complete app bundle for Mac App Store submission:
# 1. PyInstaller bundles Python backend into standalone binary (sidecar)
# 2. Tauri builds the app with the sidecar embedded
# 3. Re-signs everything with App Store entitlements
# 4. Packages as .pkg for upload via Transporter
#
# Prerequisites:
#   - Apple Distribution certificate installed in Keychain
#   - 3rd Party Mac Developer Installer certificate installed
#   - PyInstaller: pip install pyinstaller
#   - Tauri CLI: npm install -g @tauri-apps/cli
#
# Usage:
#   ./scripts/build-appstore.sh
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TAURI_DIR="$PROJECT_ROOT/frontend/src-tauri"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BINARIES_DIR="$TAURI_DIR/binaries"

# Signing identities
APP_SIGN_IDENTITY="Apple Distribution: Tao Shen (HNU7NA3S7L)"
INSTALLER_SIGN_IDENTITY="3rd Party Mac Developer Installer: Tao Shen (HNU7NA3S7L)"
TEAM_ID="HNU7NA3S7L"

# Target triple for Apple Silicon
TARGET_TRIPLE="aarch64-apple-darwin"

# Entitlements
APP_ENTITLEMENTS="$TAURI_DIR/Achilles_Vault_AppStore.entitlements"
SIDECAR_ENTITLEMENTS="$TAURI_DIR/Achilles_Vault_Sidecar.entitlements"

echo "============================================"
echo "  Achilles Vault — App Store Build"
echo "============================================"
echo ""

# --- Step 1: Bundle Python backend with PyInstaller ---
echo "[1/6] Building Python sidecar with PyInstaller..."

cd "$PROJECT_ROOT"

pyinstaller \
    --noconfirm \
    --clean \
    --onefile \
    --name achilles-server \
    --target-arch arm64 \
    --strip \
    --add-data "achilles/platforms/platforms.json:achilles/platforms" \
    --hidden-import achilles \
    --hidden-import achilles.main \
    --hidden-import achilles.config \
    --hidden-import achilles.crypto \
    --hidden-import achilles.database \
    --hidden-import achilles.auth \
    --hidden-import achilles.models \
    --hidden-import achilles.mcp_server \
    --hidden-import achilles.routers.auth_router \
    --hidden-import achilles.routers.projects_router \
    --hidden-import achilles.routers.secrets_router \
    --hidden-import achilles.routers.ai_router \
    --hidden-import achilles.routers.audit_router \
    --hidden-import achilles.routers.trash_router \
    --hidden-import achilles.routers.platforms_router \
    --hidden-import uvicorn.logging \
    --hidden-import uvicorn.loops.auto \
    --hidden-import uvicorn.protocols.http.auto \
    --hidden-import uvicorn.protocols.websockets.auto \
    --hidden-import uvicorn.lifespan.on \
    --hidden-import uvicorn.lifespan.off \
    --hidden-import aiosqlite \
    --hidden-import jose.jwt \
    --hidden-import passlib.handlers.argon2 \
    --hidden-import argon2 \
    --hidden-import mcp.server.fastmcp \
    --hidden-import slowapi \
    --hidden-import multipart \
    --hidden-import httptools \
    --hidden-import websockets \
    --exclude-module tkinter \
    --exclude-module matplotlib \
    --exclude-module numpy \
    --exclude-module pandas \
    --exclude-module PIL \
    achilles/sidecar_entry.py

echo "   Sidecar binary: dist/achilles-server"

# --- Step 2: Place sidecar in Tauri binaries directory ---
echo "[2/6] Installing sidecar binary..."

mkdir -p "$BINARIES_DIR"
cp "$PROJECT_ROOT/dist/achilles-server" "$BINARIES_DIR/achilles-server-${TARGET_TRIPLE}"
chmod +x "$BINARIES_DIR/achilles-server-${TARGET_TRIPLE}"

echo "   Installed: binaries/achilles-server-${TARGET_TRIPLE}"

# --- Step 3: Build Tauri app ---
echo "[3/6] Building Tauri app..."

cd "$FRONTEND_DIR"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build the Tauri app (this also builds the frontend)
npx tauri build --target "$TARGET_TRIPLE"

APP_BUNDLE="$TAURI_DIR/target/${TARGET_TRIPLE}/release/bundle/macos/Achilles Vault.app"
echo "   App bundle: $APP_BUNDLE"

# --- Step 4: Re-sign for App Store ---
echo "[4/6] Re-signing for App Store with sandbox entitlements..."

# Sign the sidecar binary inside the app bundle
SIDECAR_IN_BUNDLE="$APP_BUNDLE/Contents/MacOS/achilles-server"
if [ -f "$SIDECAR_IN_BUNDLE" ]; then
    echo "   Signing sidecar..."
    codesign --force --options runtime \
        --sign "$APP_SIGN_IDENTITY" \
        --entitlements "$SIDECAR_ENTITLEMENTS" \
        "$SIDECAR_IN_BUNDLE"
fi

# Sign all embedded frameworks/dylibs
echo "   Signing embedded libraries..."
find "$APP_BUNDLE/Contents/Frameworks" -type f \( -name "*.dylib" -o -name "*.so" \) 2>/dev/null | while read lib; do
    codesign --force --options runtime \
        --sign "$APP_SIGN_IDENTITY" \
        "$lib"
done

# Sign the main app bundle
echo "   Signing app bundle..."
codesign --force --deep --options runtime \
    --sign "$APP_SIGN_IDENTITY" \
    --entitlements "$APP_ENTITLEMENTS" \
    "$APP_BUNDLE"

# Verify signature
echo "   Verifying signature..."
codesign --verify --deep --strict "$APP_BUNDLE"
echo "   Signature OK"

# --- Step 5: Build .pkg for App Store upload ---
echo "[5/6] Packaging as .pkg for App Store..."

PKG_OUTPUT="$PROJECT_ROOT/dist/AchillesVault-AppStore.pkg"

productbuild \
    --component "$APP_BUNDLE" /Applications \
    --sign "$INSTALLER_SIGN_IDENTITY" \
    "$PKG_OUTPUT"

echo "   Package: $PKG_OUTPUT"

# --- Step 6: Validate ---
echo "[6/6] Validating package..."

pkgutil --check-signature "$PKG_OUTPUT" || true

echo ""
echo "============================================"
echo "  Build complete!"
echo "============================================"
echo ""
echo "  .pkg: $PKG_OUTPUT"
echo ""
echo "  Next steps:"
echo "  1. Open Transporter.app (from Mac App Store)"
echo "  2. Drag the .pkg file into Transporter"
echo "  3. Click 'Deliver' to upload to App Store Connect"
echo ""
echo "  Or upload via command line:"
echo "  xcrun altool --upload-app -f \"$PKG_OUTPUT\" -t macos -u YOUR_APPLE_ID -p @keychain:AC_PASSWORD"
echo ""
