#!/usr/bin/env python3
"""Encode a geomotion spec into shareable player / studio links (no Node needed).

usage: python link.py spec.json [--transparent] [--site URL]
       cat spec.json | python link.py -
"""
import base64
import json
import sys
import zlib

SITE = "https://hacimertgokhan.github.io/geomotion"


def encode(spec: dict) -> str:
    raw = json.dumps(spec, separators=(",", ":")).encode()
    c = zlib.compressobj(9, zlib.DEFLATED, -15)  # raw deflate, same as the browser's "deflate-raw"
    data = c.compress(raw) + c.flush()
    return "z" + base64.urlsafe_b64encode(data).decode().rstrip("=")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    site = SITE
    if "--site" in args:
        site = args[args.index("--site") + 1].rstrip("/")
    transparent = "--transparent" in args
    src = args[0]
    spec = json.load(sys.stdin if src == "-" else open(src, encoding="utf-8"))
    if not spec.get("keyframes"):
        sys.exit("spec needs a non-empty 'keyframes' list")
    code = encode(spec)
    bg = "&bg=0" if transparent else ""
    player = f"{site}/play/#s={code}{bg}"
    print(f"player: {player}")
    print(f"studio: {site}/studio/#s={code}{bg}")
    print(f'embed:  <iframe src="{player}" width="400" height="400" style="border:0" loading="lazy"></iframe>')


if __name__ == "__main__":
    main()
