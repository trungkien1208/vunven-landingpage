"""Chroma-key the green-screen cut-outs into trimmed transparent PNGs.

Usage: python3 -I art-gen/key.py <project_root>
Reads art-gen/cut/{hun,props}/*.png (flat #00FF00 background) and writes art-gen/cut/keyed/{hun,props}/<id>.png.
Hun poses are rescaled so the character's body reads at the same size in every pose (a per-pose height
factor accounts for raised flippers, sitting and bowing); feet sit on the bottom edge of the output.
"""
import os, sys, glob
import cv2
import numpy as np

root = sys.argv[1]
cut = os.path.join(root, 'art-gen', 'cut')

HUN_H = 900  # output height for a standing pose
POSE_H = {'stretch': 1.18, 'wave': 1.0, 'point': 1.05, 'hop': 1.0, 'sit': 0.82, 'sit-yawn': 0.84, 'sit-sleep': 0.8, 'bow': 0.86}

def key(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    green = ((h > 35) & (h < 90) & (s > 70) & (v > 50)).astype(np.uint8) * 255
    # keep only the largest non-green blob (drops stray specks), then soften the edge
    fg = cv2.bitwise_not(green)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:
        keep = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        big = stats[keep, cv2.CC_STAT_AREA]
        mask = np.zeros_like(fg)
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] >= big * 0.02:  # keep separate parts like a held letter
                mask[labels == i] = 255
        fg = mask
    alpha = cv2.GaussianBlur(cv2.erode(fg, np.ones((3, 3), np.uint8)), (5, 5), 0)
    # de-spill: pull green fringe back toward the red/blue average
    b, g, r = cv2.split(img.astype(np.int16))
    g = np.minimum(g, np.maximum(r, b) + 12)
    out = cv2.merge([b, g, r]).clip(0, 255).astype(np.uint8)
    return np.dstack([out, alpha])

def trim(rgba, pad=8):
    ys, xs = np.where(rgba[..., 3] > 8)
    if not len(xs):
        return rgba
    y0, y1 = max(0, ys.min() - pad), min(rgba.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(rgba.shape[1], xs.max() + pad)
    return rgba[y0:y1, x0:x1]

for kind in ('hun', 'props'):
    od = os.path.join(cut, 'keyed', kind)
    os.makedirs(od, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(cut, kind, '*.png'))):
        sid = os.path.splitext(os.path.basename(f))[0]
        rgba = trim(key(cv2.imread(f)))
        if kind == 'hun':
            target = int(HUN_H * POSE_H.get(sid, 1.0))
            scale = target / rgba.shape[0]
            rgba = cv2.resize(rgba, (max(1, int(rgba.shape[1] * scale)), target), interpolation=cv2.INTER_AREA)
        else:
            m = max(rgba.shape[:2])
            if m > 480:
                s = 480 / m
                rgba = cv2.resize(rgba, (int(rgba.shape[1] * s), int(rgba.shape[0] * s)), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(od, f'{sid}.png'), rgba)
        print(kind, sid, rgba.shape[1], 'x', rgba.shape[0])
