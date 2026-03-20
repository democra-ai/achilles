"""Wait for build processing and submit to App Store review.

Polls App Store Connect API until the uploaded build is processed,
then binds it to the app version and submits for review.
"""

import json
import sys
import time

import httpx
import jwt

ISSUER_ID = "3186ba00-e12d-49f5-ab6c-2afa1abb9704"
KEY_ID = "2CX97KY6MD"
KEY_PATH = "/Users/tao.shen/.achilles/appstore_api_key.p8"
BASE = "https://api.appstoreconnect.apple.com/v1"

APP_ID = "6760854892"
VERSION_ID = "6d8baf99-33cc-42fc-9282-96b621e8d420"

with open(KEY_PATH) as f:
    PRIVATE_KEY = f.read()


def token():
    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        PRIVATE_KEY,
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


def api_get(path, params=None):
    r = httpx.get(f"{BASE}{path}", headers={"Authorization": f"Bearer {token()}"}, params=params, timeout=30)
    return r.json()


def api_post(path, payload):
    r = httpx.post(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    print(f"  POST {path} -> {r.status_code}")
    if r.status_code >= 400:
        print(f"  Error: {r.text}")
    return r.status_code, r.json() if r.text else {}


def api_patch(path, payload):
    r = httpx.patch(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    print(f"  PATCH {path} -> {r.status_code}")
    if r.status_code >= 400:
        print(f"  Error: {r.text}")
    return r.status_code, r.json() if r.text else {}


# --- Step 1: Wait for build ---
print("=" * 50)
print("Step 1: Waiting for build to be processed...")
print("=" * 50)

build_id = None
for attempt in range(60):  # up to 30 minutes
    data = api_get(f"/apps/{APP_ID}/builds", {"limit": 5, "sort": "-uploadedDate"})
    builds = data.get("data", [])
    for b in builds:
        state = b["attributes"].get("processingState", "")
        version = b["attributes"].get("version", "?")
        print(f"  [{attempt+1}] Build {version}: {state}")
        if state == "VALID":
            build_id = b["id"]
            print(f"\n  Build ready! ID: {build_id}")
            break
        elif state == "INVALID":
            print(f"\n  Build is INVALID. Check App Store Connect for details.")
            sys.exit(1)
    if build_id:
        break
    time.sleep(30)
else:
    print("\nBuild not ready after 30 minutes. Run this script again later.")
    sys.exit(1)

# --- Step 2: Bind build to version ---
print()
print("=" * 50)
print("Step 2: Binding build to app version...")
print("=" * 50)

status, _ = api_patch(
    f"/appStoreVersions/{VERSION_ID}/relationships/build",
    {"data": {"type": "builds", "id": build_id}},
)

if status >= 400:
    print("Failed to bind build. It may need manual binding on App Store Connect.")

# --- Step 3: Update version info ---
print()
print("=" * 50)
print("Step 3: Updating version metadata...")
print("=" * 50)

status, _ = api_patch(
    f"/appStoreVersions/{VERSION_ID}",
    {
        "data": {
            "type": "appStoreVersions",
            "id": VERSION_ID,
            "attributes": {
                "versionString": "1.0.0",
                "releaseType": "MANUAL",
            },
        }
    },
)

# --- Step 4: Update app info (description, etc) ---
print()
print("=" * 50)
print("Step 4: Updating localized info...")
print("=" * 50)

# Get the localization ID
loc_data = api_get(f"/appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations")
localizations = loc_data.get("data", [])

description = """Achilles Vault is a local-first secret management tool built for AI workflows.

Store your API keys, tokens, passwords, and credentials securely with AES-256-GCM encryption. AI agents can discover and retrieve secrets automatically through the CLI — no manual copy-pasting needed.

Key Features:
• AES-256-GCM encryption at rest with per-secret random salt
• Project/environment hierarchy (development, staging, production)
• 130+ platform presets (AWS, OpenAI, GitHub, Stripe, etc.)
• Secret versioning with full rollback support
• CLI for AI agent integration (achilles context, vault-get, vault-run)
• MCP server for Model Context Protocol support
• Chrome extension for one-click secret detection and vaulting
• Audit logging for every vault operation
• Zero cloud dependency — all data stays on your machine

Perfect for developers and AI engineers who work with multiple API keys and need a secure, local-first approach to secret management."""

keywords = "secrets,vault,api-keys,security,encryption,developer-tools,ai,password-manager"

for loc in localizations:
    loc_id = loc["id"]
    locale = loc["attributes"]["locale"]
    print(f"  Updating locale: {locale}")
    api_patch(
        f"/appStoreVersionLocalizations/{loc_id}",
        {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": {
                    "description": description,
                    "keywords": keywords,
                    "whatsNew": "Initial release of Achilles Vault for macOS.",
                },
            }
        },
    )

# --- Step 5: Submit for review ---
print()
print("=" * 50)
print("Step 5: Submitting for App Store review...")
print("=" * 50)

status, result = api_post(
    "/appStoreVersionSubmissions",
    {
        "data": {
            "type": "appStoreVersionSubmissions",
            "relationships": {
                "appStoreVersion": {
                    "data": {
                        "type": "appStoreVersions",
                        "id": VERSION_ID,
                    }
                }
            },
        }
    },
)

if status < 400:
    print("\nSubmitted for review successfully!")
else:
    print("\nSubmission may require additional info (screenshots, privacy policy, etc.)")
    print("Check App Store Connect for missing requirements.")

print()
print("=" * 50)
print("Done!")
print("=" * 50)
print(f"App ID: {APP_ID}")
print(f"Build ID: {build_id}")
print(f"Version ID: {VERSION_ID}")
print("Check status at: https://appstoreconnect.apple.com/apps/{}/appstore".format(APP_ID))
