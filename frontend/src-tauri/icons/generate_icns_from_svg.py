#!/usr/bin/env python3
"""
从 icon.svg 生成 macOS 用的 icon.icns。
需要：pip install cairosvg（或 macOS 上 brew install librsvg 用 rsvg-convert）。
在 icons 目录下执行：python generate_icns_from_svg.py
"""

import os
import shutil
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(SCRIPT_DIR, "icon.svg")
ICONSET_DIR = os.path.join(SCRIPT_DIR, "icon.iconset")
ICNS_PATH = os.path.join(SCRIPT_DIR, "icon.icns")

# macOS .iconset 需要的尺寸：(文件名后缀, 像素宽高)
ICONSET_SIZES = [
    ("16x16", 16),
    ("16x16@2x", 32),
    ("32x32", 32),
    ("32x32@2x", 64),
    ("128x128", 128),
    ("128x128@2x", 256),
    ("256x256", 256),
    ("256x256@2x", 512),
    ("512x512", 512),
    ("512x512@2x", 1024),
]


def render_svg_with_cairosvg(svg_path: str, png_path: str, size: int) -> bool:
    try:
        import cairosvg
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
        return True
    except Exception as e:
        print(f"cairosvg 失败: {e}", file=sys.stderr)
        return False


def render_svg_with_rsvg(svg_path: str, png_path: str, size: int) -> bool:
    try:
        subprocess.run(
            ["rsvg-convert", "-w", str(size), "-h", str(size), "-o", png_path, svg_path],
            check=True,
            capture_output=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def main():
    if not os.path.isfile(SVG_PATH):
        print(f"未找到 {SVG_PATH}", file=sys.stderr)
        sys.exit(1)

    # 优先用 cairosvg，否则用 rsvg-convert
    if render_svg_with_cairosvg(SVG_PATH, os.path.join(SCRIPT_DIR, "_test.png"), 32):
        os.remove(os.path.join(SCRIPT_DIR, "_test.png"))
        render_fn = render_svg_with_cairosvg
        print("使用 cairosvg 渲染 SVG")
    elif render_svg_with_rsvg(SVG_PATH, os.path.join(SCRIPT_DIR, "_test.png"), 32):
        os.remove(os.path.join(SCRIPT_DIR, "_test.png"))
        render_fn = render_svg_with_rsvg
        print("使用 rsvg-convert 渲染 SVG")
    else:
        print("请安装其一：pip install cairosvg  或  brew install librsvg", file=sys.stderr)
        sys.exit(1)

    if os.path.isdir(ICONSET_DIR):
        shutil.rmtree(ICONSET_DIR)
    os.makedirs(ICONSET_DIR)

    for name, size in ICONSET_SIZES:
        png_path = os.path.join(ICONSET_DIR, f"icon_{name}.png")
        if render_fn(SVG_PATH, png_path, size):
            print(f"  {size}x{size} -> icon_{name}.png")
        else:
            print(f"  生成 {png_path} 失败", file=sys.stderr)
            shutil.rmtree(ICONSET_DIR, ignore_errors=True)
            sys.exit(1)

    # 用系统 iconutil 生成 .icns
    try:
        subprocess.run(
            ["iconutil", "-c", "icns", ICONSET_DIR, "-o", ICNS_PATH],
            check=True,
            cwd=SCRIPT_DIR,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"iconutil 失败（仅 macOS 可用）: {e}", file=sys.stderr)
        shutil.rmtree(ICONSET_DIR, ignore_errors=True)
        sys.exit(1)

    shutil.rmtree(ICONSET_DIR, ignore_errors=True)
    print(f"已生成: {ICNS_PATH}")


if __name__ == "__main__":
    main()
