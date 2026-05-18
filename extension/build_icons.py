#!/usr/bin/env python3
"""
Renders the LM pixel-art logo as PNG icons at 16, 48, 128 pixels.
No external dependencies — pure stdlib (struct + zlib).
Outputs to ./assets/16.png, ./assets/48.png, ./assets/128.png.

Run: python3 build_icons.py
"""

import os
import struct
import zlib

# The pixel-art logo, extracted verbatim from the SVG in about.html.
# Original viewBox: 48 wide x 46 tall. Each tuple is (x, y, width, height).
RECTS = [
    (2, 40, 44, 4),
    (0, 18, 8, 3), (1, 24, 6, 3),
    (40, 18, 8, 3), (41, 24, 6, 3),
    (14, 4, 3, 3), (22, 2, 4, 3), (31, 4, 3, 3),
    (9, 8, 2, 2), (37, 8, 2, 2),
    (16, 8, 16, 3),
    (13, 10, 3, 3), (32, 10, 3, 3),
    (11, 13, 3, 22), (34, 13, 3, 22),
    (13, 35, 3, 3), (32, 35, 3, 3),
    (16, 37, 16, 3),
    (22, 8, 4, 30),
    (14, 14, 3, 3), (17, 17, 3, 3), (14, 20, 3, 3),
    (14, 28, 3, 3), (17, 31, 3, 3),
    (31, 14, 3, 3), (28, 17, 3, 3), (31, 20, 3, 3),
    (31, 28, 3, 3), (28, 31, 3, 3),
]

VIEW_W, VIEW_H = 48, 46

# Foreground color — dark navy that reads well on both light and dark Chrome toolbars.
FG = (26, 26, 36, 255)
BG = (0, 0, 0, 0)  # transparent


def render(size: int) -> bytes:
    """Render the logo at size x size, returns PNG bytes."""
    # Scale: fit the 48x46 viewBox into a square `size` canvas, centered.
    scale = size / max(VIEW_W, VIEW_H)
    off_x = (size - VIEW_W * scale) / 2
    off_y = (size - VIEW_H * scale) / 2

    # Build pixel grid as flat RGBA bytes.
    pixels = bytearray(size * size * 4)
    # Fill with background.
    for i in range(size * size):
        pixels[i * 4 : i * 4 + 4] = bytes(BG)

    # Rasterize each rect.
    for (rx, ry, rw, rh) in RECTS:
        px0 = round(off_x + rx * scale)
        py0 = round(off_y + ry * scale)
        px1 = round(off_x + (rx + rw) * scale)
        py1 = round(off_y + (ry + rh) * scale)
        # Clamp.
        px0 = max(0, min(size, px0))
        py0 = max(0, min(size, py0))
        px1 = max(0, min(size, px1))
        py1 = max(0, min(size, py1))
        for y in range(py0, py1):
            row_start = (y * size + px0) * 4
            row_end = (y * size + px1) * 4
            block = bytes(FG) * (px1 - px0)
            pixels[row_start:row_end] = block

    return encode_png(pixels, size, size)


def encode_png(rgba: bytes, width: int, height: int) -> bytes:
    """Encode raw RGBA bytes as a PNG (filter type 0, deflate)."""
    sig = b"\x89PNG\r\n\x1a\n"

    # IHDR
    ihdr_data = struct.pack(
        ">IIBBBBB",
        width, height,
        8,   # bit depth
        6,   # color type = RGBA
        0, 0, 0,
    )
    ihdr = chunk(b"IHDR", ihdr_data)

    # IDAT — each row prefixed with filter byte 0.
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        raw += rgba[y * stride : (y + 1) * stride]
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))

    iend = chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


def chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def main():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
    os.makedirs(out_dir, exist_ok=True)
    for size in (16, 48, 128):
        path = os.path.join(out_dir, f"{size}.png")
        with open(path, "wb") as f:
            f.write(render(size))
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
