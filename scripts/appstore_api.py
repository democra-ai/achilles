"""App Store Connect API client.

Uses JWT authentication to manage apps, bundle IDs, and submissions.
https://developer.apple.com/documentation/appstoreconnectapi
"""

import json
import sys
import time

import httpx
import jwt  # PyJWT

# --- Configuration ---
ISSUER_ID = "3186ba00-e12d-49f5-ab6c-2afa1abb9704"
KEY_ID = "2CX97KY6MD"
KEY_PATH = "/Users/tao.shen/.achilles/appstore_api_key.p8"
BASE_URL = "https://api.appstoreconnect.apple.com/v1"

BUNDLE_ID = "com.achilles.vault"
APP_NAME = "Achilles Vault"
APP_SKU = "achilles-vault-1"


def generate_token() -> str:
    """Generate a JWT for App Store Connect API."""
    with open(KEY_PATH, "r") as f:
        private_key = f.read()

    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 1200,  # 20 minutes
        "aud": "appstoreconnect-v1",
    }
    headers = {
        "kid": KEY_ID,
        "typ": "JWT",
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
    return token


def api_get(path: str, params: dict | None = None) -> dict:
    """GET request to App Store Connect API."""
    token = generate_token()
    resp = httpx.get(
        f"{BASE_URL}{path}",
        headers={"Authorization": f"Bearer {token}"},
        params=params,
        timeout=30,
    )
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text}", file=sys.stderr)
        sys.exit(1)
    return resp.json()


def api_post(path: str, payload: dict) -> dict:
    """POST request to App Store Connect API."""
    token = generate_token()
    resp = httpx.post(
        f"{BASE_URL}{path}",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text}", file=sys.stderr)
        if resp.status_code == 409:
            print("(Resource already exists — this is OK)", file=sys.stderr)
            return resp.json()
        sys.exit(1)
    return resp.json()


def cmd_test():
    """Test API authentication."""
    data = api_get("/apps", {"limit": 1})
    print("Authentication OK!")
    apps = data.get("data", [])
    if apps:
        print(f"  Found {len(apps)} app(s), e.g.: {apps[0]['attributes']['name']}")
    else:
        print("  No apps found yet.")
    return True


def cmd_register_bundle_id():
    """Register the Bundle ID on Apple Developer portal."""
    # Check if already registered
    data = api_get("/bundleIds", {"filter[identifier]": BUNDLE_ID})
    existing = data.get("data", [])
    if existing:
        bid = existing[0]
        print(f"Bundle ID already registered: {bid['attributes']['identifier']} (id: {bid['id']})")
        return bid["id"]

    # Register new
    payload = {
        "data": {
            "type": "bundleIds",
            "attributes": {
                "identifier": BUNDLE_ID,
                "name": "Achilles Vault",
                "platform": "MAC_OS",
            },
        }
    }
    data = api_post("/bundleIds", payload)
    bid = data["data"]
    print(f"Bundle ID registered: {bid['attributes']['identifier']} (id: {bid['id']})")
    return bid["id"]


def cmd_create_app(bundle_id_resource_id: str):
    """Create the App record on App Store Connect."""
    # Check if app already exists
    data = api_get("/apps", {"filter[bundleId]": BUNDLE_ID})
    existing = data.get("data", [])
    if existing:
        app = existing[0]
        print(f"App already exists: {app['attributes']['name']} (id: {app['id']})")
        return app["id"]

    payload = {
        "data": {
            "type": "apps",
            "attributes": {
                "name": APP_NAME,
                "primaryLocale": "en-US",
                "sku": APP_SKU,
                "bundleId": BUNDLE_ID,
            },
            "relationships": {
                "bundleId": {
                    "data": {
                        "type": "bundleIds",
                        "id": bundle_id_resource_id,
                    }
                }
            },
        }
    }
    data = api_post("/apps", payload)
    app = data["data"]
    print(f"App created: {app['attributes']['name']} (id: {app['id']})")
    return app["id"]


def cmd_list_builds(app_id: str):
    """List builds for the app."""
    data = api_get(f"/apps/{app_id}/builds", {"limit": 5})
    builds = data.get("data", [])
    if not builds:
        print("No builds uploaded yet.")
        return
    for b in builds:
        attrs = b["attributes"]
        print(f"  Build {attrs.get('version', '?')} ({attrs.get('processingState', '?')})")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python appstore_api.py <command>")
        print("Commands: test, register-bundle-id, create-app, list-builds")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "test":
        cmd_test()
    elif cmd == "register-bundle-id":
        cmd_register_bundle_id()
    elif cmd == "create-app":
        bid_id = cmd_register_bundle_id()
        cmd_create_app(bid_id)
    elif cmd == "list-builds":
        # Need app id first
        data = api_get("/apps", {"filter[bundleId]": BUNDLE_ID})
        apps = data.get("data", [])
        if apps:
            cmd_list_builds(apps[0]["id"])
        else:
            print("App not found. Run 'create-app' first.")
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
