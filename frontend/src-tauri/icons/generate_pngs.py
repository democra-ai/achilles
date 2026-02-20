#!/usr/bin/env python3
"""
Generate PNG icons for Achilles Vault in all required sizes.
Uses pure Python PNG generation (no external dependencies).
Renders a simplified shield + keyhole icon in emerald green.
"""

import struct
import zlib
import math
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_png(width, height, pixels):
    """Create a PNG file from RGBA pixel data."""

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack(">I", len(data)) + c + crc

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(
        b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    )

    raw_data = b""
    for y in range(height):
        raw_data += b"\x00"  # filter: none
        for x in range(width):
            idx = (y * width + x) * 4
            raw_data += bytes(pixels[idx : idx + 4])

    compressed = zlib.compress(raw_data)
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")

    return header + ihdr + idat + iend


def lerp_color(c1, c2, t):
    """Linearly interpolate between two RGB tuples."""
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def point_in_shield(px, py, cx, cy, scale):
    """Check if a point is inside the shield shape. Returns distance-based alpha."""
    # Normalize coordinates to unit shield space centered at (cx, cy)
    nx = (px - cx) / scale
    ny = (py - cy) / scale

    # Shield top point at ny = -0.42, bottom at ny = 0.42
    # Width tapers from top to bottom
    if ny < -0.42 or ny > 0.42:
        return 0.0

    # Upper portion: sides taper inward toward top
    if ny < -0.08:
        t = (ny + 0.42) / 0.34  # 0 at top, 1 at ny=-0.08
        half_width = 0.08 + t * 0.27  # narrow at top, wider below
    # Lower portion: sides taper inward toward bottom
    else:
        t = (ny + 0.08) / 0.50  # 0 at ny=-0.08, 1 at bottom
        half_width = 0.35 * (1.0 - t * t)  # parabolic taper

    if abs(nx) > half_width:
        return 0.0

    # Anti-aliasing: soften edge
    edge_dist = half_width - abs(nx)
    aa = min(1.0, edge_dist * scale * 1.5)
    return aa


def point_in_circle(px, py, cx, cy, r):
    """Distance from point to circle edge. Negative = inside."""
    dist = math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    return dist - r


def render_icon(size):
    """Render the shield + keyhole icon at the given size."""
    pixels = [0] * (size * size * 4)
    center = size / 2
    scale = size * 0.95

    # Colors
    green_top = (52, 211, 153)       # #34d399
    green_bottom = (5, 150, 105)     # #059669
    dark = (2, 44, 34)               # #022c22
    highlight = (167, 243, 208)      # #a7f3d0

    # Keyhole dimensions (relative to size)
    kh_circle_cy = center - size * 0.07
    kh_circle_r = size * 0.11
    kh_slot_half_w = size * 0.035
    kh_slot_top = kh_circle_cy + size * 0.04
    kh_slot_bottom = kh_circle_cy + size * 0.20
    kh_slot_r = size * 0.016  # rounded corner radius
    kh_inner_r = size * 0.055

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            px, py = x + 0.5, y + 0.5

            # Check shield
            shield_alpha = point_in_shield(px, py, center, center, scale)
            if shield_alpha <= 0:
                pixels[idx:idx+4] = [0, 0, 0, 0]
                continue

            # Gradient based on y position
            grad_t = max(0, min(1, (py - size * 0.08) / (size * 0.84)))
            base_color = lerp_color(green_top, green_bottom, grad_t)

            r, g, b = base_color
            a = int(shield_alpha * 255)

            # Check keyhole circle
            circle_dist = point_in_circle(px, py, center, kh_circle_cy, kh_circle_r)
            in_circle = circle_dist < 0

            # Check keyhole slot (rounded rectangle)
            in_slot = False
            if (kh_slot_top - kh_slot_r) <= py <= kh_slot_bottom:
                if abs(px - center) <= kh_slot_half_w:
                    in_slot = True
                # Rounded bottom
                if py > kh_slot_bottom - kh_slot_r:
                    slot_dist = math.sqrt(
                        (max(0, abs(px - center) - (kh_slot_half_w - kh_slot_r))) ** 2
                        + (max(0, py - (kh_slot_bottom - kh_slot_r))) ** 2
                    )
                    in_slot = slot_dist <= kh_slot_r

            if in_circle or in_slot:
                r, g, b = dark

                # Inner circle highlight ring
                inner_dist = abs(point_in_circle(px, py, center, kh_circle_cy, kh_inner_r))
                ring_width = size * 0.006
                if inner_dist < ring_width and in_circle:
                    ring_alpha = 0.4 * (1.0 - inner_dist / ring_width)
                    r = int(r + (highlight[0] - r) * ring_alpha)
                    g = int(g + (highlight[1] - g) * ring_alpha)
                    b = int(b + (highlight[2] - b) * ring_alpha)

            # Inner shield border highlight
            # Check slightly smaller shield
            inner_scale = scale * 0.93
            inner_alpha = point_in_shield(px, py, center, center, inner_scale)
            outer_check = point_in_shield(px, py, center, center, inner_scale * 1.015)

            if outer_check > 0 and inner_alpha <= 0.1 and not (in_circle or in_slot):
                border_strength = 0.3 * shield_alpha
                r = int(r + (highlight[0] - r) * border_strength)
                g = int(g + (highlight[1] - g) * border_strength)
                b = int(b + (highlight[2] - b) * border_strength)

            pixels[idx] = min(255, max(0, r))
            pixels[idx + 1] = min(255, max(0, g))
            pixels[idx + 2] = min(255, max(0, b))
            pixels[idx + 3] = min(255, max(0, a))

    return pixels


def main():
    # All required sizes:
    # Tauri: 32x32, 128x128, 256x256 (and 512x512 for macOS .icns)
    # Chrome extension: 16x16, 48x48, 128x128
    sizes = [16, 32, 48, 128, 256, 512]

    for size in sizes:
        print(f"Generating {size}x{size} icon...")
        pixels = render_icon(size)
        png_data = create_png(size, size, pixels)
        
        filename = os.path.join(SCRIPT_DIR, f"icon_{size}x{size}.png")
        with open(filename, "wb") as f:
            f.write(png_data)
        print(f"  -> {filename}")

    # Also create named copies for Tauri conventions
    copies = {
        "32x32.png": "icon_32x32.png",
        "128x128.png": "icon_128x128.png",
        "128x128@2x.png": "icon_256x256.png",
        "icon.png": "icon_512x512.png",
    }
    for dest_name, src_name in copies.items():
        src = os.path.join(SCRIPT_DIR, src_name)
        dst = os.path.join(SCRIPT_DIR, dest_name)
        with open(src, "rb") as f:
            data = f.read()
        with open(dst, "wb") as f:
            f.write(data)
        print(f"Copied {src_name} -> {dest_name}")

    # Chrome extension icon copies
    chrome_dir = os.path.join(SCRIPT_DIR, "chrome")
    os.makedirs(chrome_dir, exist_ok=True)
    chrome_sizes = [16, 48, 128]
    for s in chrome_sizes:
        src = os.path.join(SCRIPT_DIR, f"icon_{s}x{s}.png")
        dst = os.path.join(chrome_dir, f"icon{s}.png")
        with open(src, "rb") as f:
            data = f.read()
        with open(dst, "wb") as f:
            f.write(data)
        print(f"Chrome: icon_{s}x{s}.png -> chrome/icon{s}.png")

    print("\nDone! All icons generated.")


if __name__ == "__main__":
    main()
