"""Upload app icon, screenshots, and submit for App Store review.

Uses App Store Connect API to:
1. Upload 1024x1024 app icon
2. Upload macOS screenshot
3. Bind the processed build to the version
4. Fill in metadata
5. Submit for review with auto-release
"""

import hashlib
import json
import os
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

ICON_PATH = "/tmp/achilles-icon-1024.png"
SCREENSHOT_PATH = "/tmp/achilles-appstore-screenshot.png"

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


def headers(content_type="application/json"):
    return {"Authorization": f"Bearer {token()}", "Content-Type": content_type}


def api_get(path, params=None):
    r = httpx.get(f"{BASE}{path}", headers=headers(), params=params, timeout=30)
    return r.status_code, r.json() if r.text else {}


def api_post(path, payload):
    r = httpx.post(f"{BASE}{path}", headers=headers(), json=payload, timeout=30)
    return r.status_code, r.json() if r.text else {}


def api_patch(path, payload):
    r = httpx.patch(f"{BASE}{path}", headers=headers(), json=payload, timeout=30)
    return r.status_code, r.json() if r.text else {}


def api_delete(path):
    r = httpx.delete(f"{BASE}{path}", headers=headers(), timeout=30)
    return r.status_code


def upload_file_to_url(upload_url, file_path, content_type="image/png"):
    """Upload a file to the given URL using PUT."""
    with open(file_path, "rb") as f:
        data = f.read()
    r = httpx.put(
        upload_url,
        content=data,
        headers={"Content-Type": content_type},
        timeout=120,
    )
    return r.status_code


def get_file_md5(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def upload_asset(reservation_url, file_path, asset_type="appScreenshot"):
    """Upload an image asset through the App Store Connect upload flow.

    1. Reserve upload
    2. Upload file parts
    3. Commit
    """
    file_size = os.path.getsize(file_path)
    file_name = os.path.basename(file_path)
    checksum = get_file_md5(file_path)

    # Step 1: Create the asset reservation
    payload = {
        "data": {
            "type": f"{asset_type}s",
            "attributes": {
                "fileSize": file_size,
                "fileName": file_name,
            },
            "relationships": {},
        }
    }
    return payload, file_size, checksum


# ============================================================
# Main flow
# ============================================================

def main():
    print("=" * 60)
    print("  Achilles Vault — App Store Asset Upload & Submission")
    print("=" * 60)

    # --- Step 1: Wait for build ---
    print("\n[1/6] Checking for processed build...")
    build_id = None
    for attempt in range(40):
        status, data = api_get(f"/apps/{APP_ID}/builds", {"limit": 5, "sort": "-uploadedDate"})
        builds = data.get("data", [])
        for b in builds:
            state = b["attributes"].get("processingState", "")
            ver = b["attributes"].get("version", "?")
            if state == "VALID":
                build_id = b["id"]
                print(f"  Build ready: version={ver}, id={build_id}")
                break
            elif state == "INVALID":
                print(f"  Build INVALID! Check App Store Connect.")
                sys.exit(1)
            else:
                print(f"  Attempt {attempt+1}: Build {ver} state={state}, waiting...")
        if build_id:
            break
        time.sleep(30)
    else:
        print("  Build not ready after 20 min. Try again later.")
        sys.exit(1)

    # --- Step 2: Get app info and localization ---
    print("\n[2/6] Getting app info...")
    status, data = api_get(f"/apps/{APP_ID}/appInfos")
    app_infos = data.get("data", [])
    app_info_id = app_infos[0]["id"] if app_infos else None
    print(f"  App Info ID: {app_info_id}")

    # Get app info localizations
    if app_info_id:
        status, data = api_get(f"/appInfos/{app_info_id}/appInfoLocalizations")
        info_locs = data.get("data", [])
        for loc in info_locs:
            loc_id = loc["id"]
            locale = loc["attributes"]["locale"]
            print(f"  Updating app info localization ({locale})...")
            api_patch(f"/appInfoLocalizations/{loc_id}", {
                "data": {
                    "type": "appInfoLocalizations",
                    "id": loc_id,
                    "attributes": {
                        "name": "Achilles Vault",
                        "subtitle": "Local-First Secret Management",
                        "privacyPolicyUrl": "https://github.com/AchillesVault/achilles/blob/main/PRIVACY.md",
                    }
                }
            })

    # --- Step 3: Upload app icon ---
    print("\n[3/6] Uploading app icon...")
    # The app icon for App Store is set through the app's build/asset catalog
    # But we also need to check if it needs manual upload
    # For Mac apps, the icon comes from the app binary's asset catalog
    print("  Icon is bundled in the .app (icon.icns). Skipping manual upload.")

    # --- Step 4: Upload screenshot ---
    print("\n[4/6] Uploading macOS screenshot...")

    # Get existing screenshot sets for this version localization
    status, data = api_get(f"/appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations")
    locs = data.get("data", [])

    if not locs:
        print("  No localizations found!")
        sys.exit(1)

    loc_id = locs[0]["id"]
    locale = locs[0]["attributes"]["locale"]
    print(f"  Using localization: {locale} (id: {loc_id})")

    # Get or create screenshot set for MAC display
    status, data = api_get(f"/appStoreVersionLocalizations/{loc_id}/appScreenshotSets")
    screenshot_sets = data.get("data", [])

    mac_set_id = None
    for ss in screenshot_sets:
        if ss["attributes"]["screenshotDisplayType"] == "APP_DESKTOP":
            mac_set_id = ss["id"]
            print(f"  Found existing MAC screenshot set: {mac_set_id}")
            # Delete existing screenshots in set
            status2, data2 = api_get(f"/appScreenshotSets/{mac_set_id}/appScreenshots")
            for existing in data2.get("data", []):
                print(f"  Deleting old screenshot: {existing['id']}")
                api_delete(f"/appScreenshots/{existing['id']}")
            break

    if not mac_set_id:
        print("  Creating MAC screenshot set...")
        status, data = api_post(f"/appScreenshotSets", {
            "data": {
                "type": "appScreenshotSets",
                "attributes": {
                    "screenshotDisplayType": "APP_DESKTOP",
                },
                "relationships": {
                    "appStoreVersionLocalization": {
                        "data": {
                            "type": "appStoreVersionLocalizations",
                            "id": loc_id,
                        }
                    }
                }
            }
        })
        if status < 400:
            mac_set_id = data["data"]["id"]
            print(f"  Created screenshot set: {mac_set_id}")
        else:
            print(f"  Error creating screenshot set: {status} {json.dumps(data, indent=2)}")
            sys.exit(1)

    # Reserve screenshot upload
    file_size = os.path.getsize(SCREENSHOT_PATH)
    checksum = get_file_md5(SCREENSHOT_PATH)
    print(f"  Screenshot: {file_size} bytes, md5={checksum}")

    status, data = api_post("/appScreenshots", {
        "data": {
            "type": "appScreenshots",
            "attributes": {
                "fileSize": file_size,
                "fileName": "dashboard.png",
            },
            "relationships": {
                "appScreenshotSet": {
                    "data": {
                        "type": "appScreenshotSets",
                        "id": mac_set_id,
                    }
                }
            }
        }
    })

    if status >= 400:
        print(f"  Error reserving screenshot: {status}")
        print(f"  {json.dumps(data, indent=2)}")
    else:
        screenshot_id = data["data"]["id"]
        upload_ops = data["data"]["attributes"].get("uploadOperations", [])
        print(f"  Screenshot reserved: {screenshot_id}")
        print(f"  Upload operations: {len(upload_ops)}")

        # Upload each part
        with open(SCREENSHOT_PATH, "rb") as f:
            file_data = f.read()

        for i, op in enumerate(upload_ops):
            url = op["url"]
            offset = op["offset"]
            length = op["length"]
            req_headers = {h["name"]: h["value"] for h in op["requestHeaders"]}

            chunk = file_data[offset:offset + length]
            print(f"  Uploading part {i+1}/{len(upload_ops)} ({length} bytes)...")

            r = httpx.put(url, content=chunk, headers=req_headers, timeout=120)
            if r.status_code >= 400:
                print(f"  Upload failed: {r.status_code}")

        # Commit the upload
        print("  Committing screenshot upload...")
        status, data = api_patch(f"/appScreenshots/{screenshot_id}", {
            "data": {
                "type": "appScreenshots",
                "id": screenshot_id,
                "attributes": {
                    "sourceFileChecksum": checksum,
                    "uploaded": True,
                }
            }
        })
        if status < 400:
            print("  Screenshot uploaded successfully!")
        else:
            print(f"  Commit error: {status} {json.dumps(data, indent=2)}")

    # --- Step 5: Bind build to version and update metadata ---
    print("\n[5/6] Binding build and updating metadata...")

    # Bind build
    status, _ = api_patch(
        f"/appStoreVersions/{VERSION_ID}/relationships/build",
        {"data": {"type": "builds", "id": build_id}},
    )
    print(f"  Bind build: {status}")

    # Update version string
    status, _ = api_patch(f"/appStoreVersions/{VERSION_ID}", {
        "data": {
            "type": "appStoreVersions",
            "id": VERSION_ID,
            "attributes": {
                "versionString": "1.0.0",
                "releaseType": "AFTER_APPROVAL",  # Auto-release after approval
            }
        }
    })
    print(f"  Update version: {status}")

    # Update localized description
    for loc in locs:
        loc_id = loc["id"]
        description = """Achilles Vault is a local-first secret management tool built for AI workflows.

Store your API keys, tokens, passwords, and credentials securely with AES-256-GCM encryption. AI agents can discover and retrieve secrets automatically through the CLI — no manual copy-pasting needed.

Key Features:
• AES-256-GCM encryption at rest with per-secret random salt
• Project/environment hierarchy (development, staging, production)
• 130+ platform presets (AWS, OpenAI, GitHub, Stripe, and more)
• Secret versioning with full rollback support
• CLI integration for AI agents
• MCP server for Model Context Protocol
• Chrome extension for one-click secret detection
• Audit logging for every operation
• Zero cloud dependency — all data stays on your machine"""

        status, _ = api_patch(f"/appStoreVersionLocalizations/{loc_id}", {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": {
                    "description": description,
                    "keywords": "secrets,vault,api-keys,security,encryption,developer-tools,ai,password,credentials,token",
                    "whatsNew": "Initial release of Achilles Vault for macOS.",
                }
            }
        })
        print(f"  Update localization ({loc['attributes']['locale']}): {status}")

    # --- Step 6: Submit for review ---
    print("\n[6/6] Submitting for App Store review...")

    status, data = api_post("/appStoreVersionSubmissions", {
        "data": {
            "type": "appStoreVersionSubmissions",
            "relationships": {
                "appStoreVersion": {
                    "data": {
                        "type": "appStoreVersions",
                        "id": VERSION_ID,
                    }
                }
            }
        }
    })

    if status < 400:
        print("  Submitted for review!")
    else:
        print(f"  Submission response: {status}")
        errors = data.get("errors", [])
        for e in errors:
            print(f"  - {e.get('detail', e.get('title', 'Unknown error'))}")
        if errors:
            print("\n  Some fields may still need to be filled on App Store Connect.")
            print(f"  Visit: https://appstoreconnect.apple.com/apps/{APP_ID}/appstore/macos/version/deliverable")

    print("\n" + "=" * 60)
    print("  Done!")
    print("=" * 60)
    print(f"  App: https://appstoreconnect.apple.com/apps/{APP_ID}/appstore")


if __name__ == "__main__":
    main()
