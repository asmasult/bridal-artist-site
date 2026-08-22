#!/usr/bin/env python3
"""Scan Image/<folder>/* and write hero-gallery.json for the hero slideshow.

Run this after adding or removing photos/videos in any Image subfolder,
then refresh the page — no edits to script.js needed. To add a new
category, just create a new folder under Image/ and drop files in it.
"""
import json
import os

IMAGE_DIR = "Image"
OUTPUT = "hero-gallery.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4", ".mov", ".webm"}

DEFAULT_IMAGE_DURATION_MS = 4500
DEFAULT_VIDEO_SLOW_MOTION = 0.5


def main():
    slides = []
    for folder in sorted(os.listdir(IMAGE_DIR)):
        folder_path = os.path.join(IMAGE_DIR, folder)
        if not os.path.isdir(folder_path):
            continue
        for name in sorted(os.listdir(folder_path)):
            ext = os.path.splitext(name)[1].lower()
            src = "/".join([IMAGE_DIR, folder, name])
            if ext in IMAGE_EXTS:
                slides.append({"type": "image", "src": src, "duration": DEFAULT_IMAGE_DURATION_MS})
            elif ext in VIDEO_EXTS:
                slides.append({"type": "video", "src": src, "slowMotion": DEFAULT_VIDEO_SLOW_MOTION})

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(slides, f, indent=2)
        f.write("\n")

    print("Wrote {} slide(s) to {}".format(len(slides), OUTPUT))
    for s in slides:
        print("  - [{}] {}".format(s["type"], s["src"]))


if __name__ == "__main__":
    main()
